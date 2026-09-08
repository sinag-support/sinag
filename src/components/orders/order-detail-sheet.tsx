"use client";

import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  CreditCard,
  Loader2,
  Moon,
  Globe,
  Map,
  Flag,
  Plus,
  Minus,
  RotateCcw,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { useTheme } from "next-themes";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

declare global {
  interface Window {
    L: any;
  }
}

// Default fallback location
const DEFAULT_STORE_LOCATION = {
  lat: 14.5995,
  lng: 120.9842,
  name: "Store Location",
};

async function fetchStoreLocation() {
  try {
    const response = await fetch("/api/admin/profile");
    if (!response.ok) {
      console.error("Failed to fetch store location:", response.status);
      return DEFAULT_STORE_LOCATION;
    }
    const data = await response.json();

    if (
      data.storeLocation &&
      data.storeLocation.latitude &&
      data.storeLocation.longitude
    ) {
      return {
        lat: data.storeLocation.latitude,
        lng: data.storeLocation.longitude,
        name: data.storeLocation.address || "Store Location",
      };
    }

    return DEFAULT_STORE_LOCATION;
  } catch (error) {
    console.error("Error fetching store location:", error);
    return DEFAULT_STORE_LOCATION;
  }
}

const TILE_LAYERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
      className: "leaflet-normal-tiles",
    },
  },
  dark: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
      className: "leaflet-dark-tiles",
    },
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 18,
      className: "leaflet-satellite-tiles",
    },
  },
  satelliteLabels: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 18,
      className: "leaflet-satellite-labels",
    },
  },
};

function calculateBearing(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): number {
  const toRad = (degree: number) => (degree * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(startLat);
  const lat2 = toRad(endLat);
  const dLng = toRad(endLng - startLng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return bearing;
}

function shouldFlipTruck(angle: number): boolean {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  return normalizedAngle < 90 || normalizedAngle > 270;
}

async function getCoordinates(address: string, city: string, province: string) {
  try {
    const headers = {
      "Accept-Language": "en",
      "User-Agent": "OrderTrackingApp/1.0",
    };

    const safeAddress = address || "";
    const safeCity = city || "";
    const safeProvince = province || "";

    if (safeAddress.trim() && safeCity.trim()) {
      const primaryQuery = `${safeAddress}, ${safeCity}, ${safeProvince}, Philippines`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(primaryQuery)}&limit=1`,
        { headers },
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0 && data[0].lat && data[0].lon) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
        }
      }
    }

    if (safeCity.trim()) {
      const fallbackQuery = `${safeCity}, ${safeProvince}, Philippines`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`,
        { headers },
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0 && data[0].lat && data[0].lon) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
        }
      }
    }

    return {
      lat: 14.5995,
      lng: 120.9842,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return {
      lat: 14.5995,
      lng: 120.9842,
    };
  }
}

async function getRouteGeometry(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]],
      ) as [number, number][];
    }
  } catch (err) {
    console.error("OSRM route error, falling back to direct line:", err);
  }

  return [
    [start.lat, start.lng],
    [end.lat, end.lng],
  ] as [number, number][];
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function OrderDetailContent({
  order,
  loading,
  onClose,
  onOrderUpdated,
}: {
  order: any;
  loading: boolean;
  onClose: () => void;
  onOrderUpdated?: () => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const mapInitializingRef = useRef(false);
  const mountedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const lastBearingRef = useRef<number>(0);
  const followRiderRef = useRef(true);
  const userInteractingRef = useRef(false);
  const routePointsRef = useRef<[number, number][]>([]);
  const completedRouteRef = useRef<any>(null);
  const remainingRouteRef = useRef<any>(null);

  const { theme, resolvedTheme } = useTheme();
  const isMobile = useMediaQuery({ maxWidth: 1023 });

  const [mapTheme, setMapTheme] = useState<"street" | "dark" | "satellite">(
    "street",
  );
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapError, setMapError] = useState(false);
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  const [storeLocation, setStoreLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  }>(DEFAULT_STORE_LOCATION);
  const [storeLoading, setStoreLoading] = useState(true);

  const [isFollowingRider, setIsFollowingRider] = useState(true);

  const [riderDistance, setRiderDistance] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  const [currentRiderPos, setCurrentRiderPos] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    if (
      order?.status === "OUT_FOR_DELIVERY" &&
      order?.riderLat &&
      order?.riderLng
    ) {
      return {
        lat: order.riderLat,
        lng: order.riderLng,
      };
    }

    return null;
  });

  const isOutForDelivery = order?.status === "OUT_FOR_DELIVERY";
  const isDelivered = order?.status === "DELIVERED";
  const isReturnRequested = order?.status === "RETURN_REQUESTED";
  const isReturned = order?.status === "RETURNED";
  const isRefundRequested = order?.status === "REFUND_REQUESTED";
  const isRefunded = order?.status === "REFUNDED";

  const getRiderPosition = () => {
    if (isOutForDelivery) {
      if (currentRiderPos) {
        return currentRiderPos;
      }

      if (order.riderLat && order.riderLng) {
        return {
          lat: order.riderLat,
          lng: order.riderLng,
        };
      }
    }

    return storeLocation;
  };

  const handleRequestReturn = async () => {
    if (!order?.id) return;

    if (!returnReason.trim()) {
      toast.error("Please provide a reason for the return");
      return;
    }

    setIsReturning(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: returnReason.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Return request submitted successfully");
        setShowReturnDialog(false);
        setReturnReason("");
        if (onOrderUpdated) {
          onOrderUpdated();
        }
      } else {
        toast.error(data.error || "Failed to submit return request");
      }
    } catch (error) {
      console.error("Error requesting return:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsReturning(false);
    }
  };

  const handleRequestRefund = async () => {
    if (!order?.id) return;

    if (!refundReason.trim()) {
      toast.error("Please provide a reason for the refund");
      return;
    }

    setIsRefunding(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: refundReason.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Refund request submitted successfully");
        setShowRefundDialog(false);
        setRefundReason("");
        if (onOrderUpdated) {
          onOrderUpdated();
        }
      } else {
        toast.error(data.error || "Failed to submit refund request");
      }
    } catch (error) {
      console.error("Error requesting refund:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsRefunding(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadStoreLocation = async () => {
      const location = await fetchStoreLocation();
      setStoreLocation(location);
      setStoreLoading(false);
    };
    loadStoreLocation();
  }, []);

  useEffect(() => {
    const currentTheme = resolvedTheme || theme || "light";
    if (currentTheme === "dark") {
      setMapTheme("dark");
    } else {
      setMapTheme("street");
    }
  }, [theme, resolvedTheme]);

  useEffect(() => {
    if (!document.getElementById("leaflet-dark-filter")) {
      const style = document.createElement("style");
      style.id = "leaflet-dark-filter";
      style.textContent = `
        .leaflet-dark-tiles {
          filter: invert(1) hue-rotate(180deg) brightness(0.78) contrast(0.9) saturate(0.65);
        }
        .leaflet-normal-tiles {
          filter: none;
        }
        .leaflet-satellite-tiles {
          filter: none;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.L) {
      setIsLeafletReady(true);
      return;
    }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        setIsLeafletReady(true);
      };
      script.onerror = () => {
        setMapError(true);
      };
      document.body.appendChild(script);
    }

    if (!document.getElementById("lottie-player-js")) {
      const lottieScript = document.createElement("script");
      lottieScript.id = "lottie-player-js";
      lottieScript.src =
        "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
      lottieScript.type = "module";
      document.body.appendChild(lottieScript);
    }
  }, []);

  useEffect(() => {
    if (!order?.address) {
      setMapReady(false);
      return;
    }

    let isMounted = true;

    const fetchCoordinates = async () => {
      try {
        const coords = await getCoordinates(
          order.address.address,
          order.address.city,
          order.address.province,
        );
        if (isMounted) {
          setCoordinates(coords);
        }
      } catch (error) {
        console.error("Error fetching coordinates:", error);
        if (isMounted) {
          setCoordinates({ lat: 14.5995, lng: 120.9842 });
        }
      }
    };

    fetchCoordinates();

    return () => {
      isMounted = false;
    };
  }, [order]);

  const createRiderIcon = (zoom: number, angle: number = 0) => {
    const L = window.L;
    if (!L) return null;

    const baseSize = 60;
    const minSize = 40;
    const maxSize = 120;
    const scale = Math.min(Math.max(zoom / 15, 0.6), 1.5);
    const size = Math.min(Math.max(baseSize * scale, minSize), maxSize);

    const shouldFlip = shouldFlipTruck(angle);
    const scaleX = shouldFlip ? -1 : 1;

    return L.divIcon({
      className: "custom-leaflet-animated-icon",
      html: `
        <div style="
          width:${size}px;
          height:${size}px;
          display:flex;
          align-items:center;
          justify-content:center;
          transform:scaleX(${scaleX});
          transform-origin:center;
          transition:transform 0.3s ease-out;
        ">
          <dotlottie-player
            src="/animations/truck.json"
            background="transparent"
            speed="1"
            style="width:${size}px;height:${size}px;"
            loop
            autoplay
          ></dotlottie-player>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size - 17],
      popupAnchor: [0, -size],
    });
  };

  const createCustomerIcon = (zoom: number) => {
    const L = window.L;
    if (!L) return null;

    const baseSize = 64;
    const minSize = 32;
    const maxSize = 96;
    const scale = Math.min(Math.max(zoom / 15, 0.6), 1.5);
    const size = Math.min(Math.max(baseSize * scale, minSize), maxSize);

    return L.divIcon({
      className: "custom-leaflet-animated-icon",
      html: `
        <div style="
          width:${size}px;
          height:${size}px;
          display:flex;
          align-items:center;
          justify-content:center;
          transition:all 0.2s ease;
        ">
          <dotlottie-player
            src="/animations/location.json"
            background="transparent"
            speed="1"
            style="width:${size}px;height:${size}px;"
            loop
            autoplay
          ></dotlottie-player>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
    });
  };

  const updateMarkerIcons = (zoom: number) => {
    const L = window.L;
    if (!L) return;

    if (riderMarkerRef.current) {
      const newIcon = createRiderIcon(zoom, lastBearingRef.current);
      if (newIcon) riderMarkerRef.current.setIcon(newIcon);
    }
    if (customerMarkerRef.current) {
      const newIcon = createCustomerIcon(zoom);
      if (newIcon) customerMarkerRef.current.setIcon(newIcon);
    }
  };

  const updateRouteProgress = (riderLat: number, riderLng: number) => {
    const points = routePointsRef.current;
    if (points.length < 2) return;

    const L = window.L;
    if (!L) return;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < points.length; i++) {
      const distance = calculateDistance(
        riderLat,
        riderLng,
        points[i][0],
        points[i][1],
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const completed = points.slice(0, Math.max(nearestIndex + 1, 2));
    const remaining = points.slice(Math.max(nearestIndex, 0));

    const map = mapInstanceRef.current;
    if (!map) return;

    if (completedRouteRef.current) {
      completedRouteRef.current.setLatLngs(completed);
    } else if (completed.length > 1) {
      completedRouteRef.current = L.polyline(completed, {
        color: "#94a3b8",
        weight: 5,
        opacity: 0.55,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
    }

    if (remainingRouteRef.current) {
      remainingRouteRef.current.setLatLngs(remaining);
    } else if (remaining.length > 1) {
      remainingRouteRef.current = L.polyline(remaining, {
        color: "#dc2626",
        weight: 5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
    }
  };

  const updateRiderStats = (lat: number, lng: number) => {
    if (!coordinates) return;

    const distance = calculateDistance(
      lat,
      lng,
      coordinates.lat,
      coordinates.lng,
    );

    setRiderDistance(distance);

    const averageSpeedKmh = 25;
    const minutes = Math.max(
      1,
      Math.round((distance / 1000 / averageSpeedKmh) * 60),
    );
    setEtaMinutes(minutes);

    updateRouteProgress(lat, lng);
  };

  const setFollowRider = (follow: boolean) => {
    followRiderRef.current = follow;
    setIsFollowingRider(follow);
  };

  const centerOnRider = (animate = true) => {
    const map = mapInstanceRef.current;
    const rider = getRiderPosition();

    if (!map || !rider) return;

    setFollowRider(true);

    map.setView([rider.lat, rider.lng], Math.max(map.getZoom(), 15), {
      animate,
    });
  };

  const animateMarkerTo = (
    targetLat: number,
    targetLng: number,
    duration: number = 1000,
  ) => {
    const L = window.L;
    if (!L) return;

    const map = mapInstanceRef.current;
    if (!map) return;

    if (!riderMarkerRef.current) {
      const currentZoom = map.getZoom() || 15;
      const riderIcon = createRiderIcon(currentZoom, lastBearingRef.current);

      if (riderIcon) {
        riderMarkerRef.current = L.marker([targetLat, targetLng], {
          icon: riderIcon,
          zIndexOffset: 1000,
        }).addTo(map);
      }

      return;
    }

    updateRiderStats(targetLat, targetLng);

    const startPos = riderMarkerRef.current.getLatLng();

    if (followRiderRef.current) {
      const mapCenter = map.getCenter();
      const centerDistance = calculateDistance(
        mapCenter.lat,
        mapCenter.lng,
        targetLat,
        targetLng,
      );

      if (centerDistance > 25) {
        map.panTo([targetLat, targetLng], {
          animate: false,
        });
      }
    }

    const distance = calculateDistance(
      startPos.lat,
      startPos.lng,
      targetLat,
      targetLng,
    );

    if (distance > 1000) {
      riderMarkerRef.current.setLatLng([targetLat, targetLng]);
      return;
    }

    const angle = calculateBearing(
      startPos.lat,
      startPos.lng,
      targetLat,
      targetLng,
    );

    lastBearingRef.current = angle;

    const currentZoom = map.getZoom();

    const newIcon = createRiderIcon(currentZoom, angle);

    if (newIcon) {
      riderMarkerRef.current.setIcon(newIcon);
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const startTime = performance.now();

    const step = (currentTime: number) => {
      if (!riderMarkerRef.current) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentLat = startPos.lat + (targetLat - startPos.lat) * eased;
      const currentLng = startPos.lng + (targetLng - startPos.lng) * eased;

      riderMarkerRef.current.setLatLng([currentLat, currentLng]);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  const cleanupMap = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      } catch {}
    }

    mapInstanceRef.current = null;
    tileLayerRef.current = null;
    labelsLayerRef.current = null;
    riderMarkerRef.current = null;
    customerMarkerRef.current = null;
    polylineRef.current = null;
    completedRouteRef.current = null;
    remainingRouteRef.current = null;
    routePointsRef.current = [];
    mapInitializingRef.current = false;
    setMapReady(false);
  };

  // Initialize map
  useEffect(() => {
    if (!coordinates || !mapRef.current || !isLeafletReady || storeLoading)
      return;
    if (!window.L) return;

    if (mapInstanceRef.current || mapInitializingRef.current) {
      return;
    }

    mapInitializingRef.current = true;

    let active = true;

    const initMap = async () => {
      const L = window.L;

      if (!L || !mapRef.current) {
        mapInitializingRef.current = false;
        return;
      }

      try {
        const customerPos: [number, number] = [
          coordinates.lat,
          coordinates.lng,
        ];

        const storePos: [number, number] = [
          storeLocation.lat,
          storeLocation.lng,
        ];

        const map = L.map(mapRef.current, {
          zoomControl: false,
          dragging: true,
          scrollWheelZoom: true,
          attributionControl: false,
        });

        if (!active) {
          map.remove();
          mapInitializingRef.current = false;
          return;
        }

        mapInstanceRef.current = map;

        const activeConfig = TILE_LAYERS[mapTheme];

        tileLayerRef.current = L.tileLayer(
          activeConfig.url,
          activeConfig.options,
        ).addTo(map);

        if (mapTheme === "satellite") {
          const labelsConfig = TILE_LAYERS.satelliteLabels;

          labelsLayerRef.current = L.tileLayer(labelsConfig.url, {
            ...labelsConfig.options,
            opacity: 0.6,
          }).addTo(map);
        }

        const initialZoom = map.getZoom() || 13;

        // Create customer marker IMMEDIATELY
        const customerIcon = createCustomerIcon(initialZoom);
        if (customerIcon) {
          customerMarkerRef.current = L.marker(customerPos, {
            icon: customerIcon,
          }).addTo(map);
          customerMarkerRef.current.setZIndexOffset(500);

          if (order?.address) {
            customerMarkerRef.current.bindPopup(`
              <div style="font-size:13px;">
                <strong>Delivery Destination</strong><br/>
                ${order.address.address}<br/>
                ${order.address.city}, ${order.address.province}
              </div>
            `);
          }
        }

        // Get the route
        const routePoints = await getRouteGeometry(
          { lat: storeLocation.lat, lng: storeLocation.lng },
          coordinates,
        );

        if (!active || !mapInstanceRef.current) {
          return;
        }

        routePointsRef.current = routePoints;

        polylineRef.current = L.polyline(routePoints, {
          color: "#dc2626",
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        if (routePoints.length > 1) {
          const rider = getRiderPosition();

          if (rider && isOutForDelivery) {
            updateRouteProgress(rider.lat, rider.lng);
          }
        }

        if (routePoints.length > 1) {
          lastBearingRef.current = calculateBearing(
            routePoints[0][0],
            routePoints[0][1],
            routePoints[1][0],
            routePoints[1][1],
          );
        }

        const bounds = L.latLngBounds([storePos, customerPos]);

        map.fitBounds(bounds, {
          padding: [50, 50],
        });

        const riderPos = getRiderPosition();

        if (riderPos) {
          const currentZoom = map.getZoom() || 15;

          const riderIcon = createRiderIcon(
            currentZoom,
            lastBearingRef.current,
          );

          if (riderIcon) {
            riderMarkerRef.current = L.marker([riderPos.lat, riderPos.lng], {
              icon: riderIcon,
              zIndexOffset: 1000,
            }).addTo(map);
            riderMarkerRef.current.bindPopup(
              `<b>Delivery Rider</b><br/>Status: ${order.status}`,
            );
          }
        }

        map.on("zoomend", () => {
          if (mapInstanceRef.current === map) {
            updateMarkerIcons(map.getZoom());
          }
        });

        map.on("dragstart", () => {
          userInteractingRef.current = true;
          setFollowRider(false);
        });

        map.on("dragend", () => {
          userInteractingRef.current = false;
        });

        map.on("zoomstart", () => {
          if (!userInteractingRef.current) {
            setFollowRider(false);
          }
        });

        requestAnimationFrame(() => {
          if (active && mapInstanceRef.current === map) {
            map.invalidateSize();
            setMapReady(true);
          }
        });
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError(true);
        mapInitializingRef.current = false;
      } finally {
        if (active) {
          mapInitializingRef.current = false;
        }
      }
    };

    initMap();

    return () => {
      active = false;

      if (mapInstanceRef.current) {
        cleanupMap();
      } else {
        mapInitializingRef.current = false;
        setMapReady(false);
      }
    };
  }, [coordinates, isLeafletReady, storeLocation, storeLoading]);

  // Real-time subscription
  useEffect(() => {
    if (!order?.id) return;

    if (!["OUT_FOR_DELIVERY", "ASSIGNED_RIDER"].includes(order.status)) {
      if (riderMarkerRef.current) {
        const storePos = { lat: storeLocation.lat, lng: storeLocation.lng };
        animateMarkerTo(storePos.lat, storePos.lng, 500);
      }
      return;
    }

    const channel = supabase
      .channel(`order-realtime-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const { riderLat, riderLng, status } = payload.new;

          if (
            status === "OUT_FOR_DELIVERY" &&
            riderLat &&
            riderLng &&
            riderMarkerRef.current
          ) {
            animateMarkerTo(riderLat, riderLng, 1000);
          } else if (status !== "OUT_FOR_DELIVERY" && riderMarkerRef.current) {
            const storePos = { lat: storeLocation.lat, lng: storeLocation.lng };
            animateMarkerTo(storePos.lat, storePos.lng, 500);
          }

          // Update order status if changed
          if (status !== order.status && onOrderUpdated) {
            onOrderUpdated();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, coordinates, storeLocation, onOrderUpdated]);

  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current || !window.L) return;

    const map = mapInstanceRef.current;
    const activeConfig = TILE_LAYERS[mapTheme];

    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch {}
    }

    tileLayerRef.current = window.L.tileLayer(
      activeConfig.url,
      activeConfig.options,
    ).addTo(map);

    if (labelsLayerRef.current) {
      try {
        map.removeLayer(labelsLayerRef.current);
      } catch {}

      labelsLayerRef.current = null;
    }

    if (mapTheme === "satellite") {
      const labelsConfig = TILE_LAYERS.satelliteLabels;

      labelsLayerRef.current = window.L.tileLayer(labelsConfig.url, {
        ...labelsConfig.options,
        opacity: 0.6,
      }).addTo(map);
    }

    if (polylineRef.current) {
      polylineRef.current.setStyle({
        opacity: 0,
      });
    }

    if (completedRouteRef.current) {
      completedRouteRef.current.setStyle({
        color: "#94a3b8",
        opacity: 0.55,
      });
    }

    if (remainingRouteRef.current) {
      remainingRouteRef.current.setStyle({
        color: "#dc2626",
        opacity: 0.9,
      });
    }
  }, [mapTheme]);

  useEffect(() => {
    const riderPos = getRiderPosition();

    if (riderPos && riderMarkerRef.current && mapInstanceRef.current) {
      animateMarkerTo(riderPos.lat, riderPos.lng, 300);
    }
  }, [currentRiderPos, order.status]);

  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, []);

  // Load Lottie player
  useEffect(() => {
    const loadLottie = () => {
      if (document.getElementById("lottie-player-js")) {
        return;
      }

      const script = document.createElement("script");
      script.id = "lottie-player-js";
      script.src =
        "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
      script.type = "module";
      document.body.appendChild(script);
    };

    loadLottie();
  }, []);

  // Render distance card - "Rider" at top-left
  const renderDistanceCard = () => {
    if (!isOutForDelivery || !mapReady) return null;

    return (
      <div className="absolute top-3 left-3 z-[9999] pointer-events-auto">
        <div className="bg-background/90 backdrop-blur-md border border-border shadow-md rounded-lg px-3 py-2 min-w-[130px]">
          <div className="text-xs text-muted-foreground">Rider</div>
          <div className="text-sm font-semibold">
            {riderDistance !== null
              ? riderDistance >= 1000
                ? `${(riderDistance / 1000).toFixed(1)}km away`
                : `${Math.round(riderDistance)}m away`
              : "Calculating..."}
          </div>
          {etaMinutes !== null && (
            <div className="text-[11px] text-muted-foreground">
              ETA about {etaMinutes} min
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render follow button - bottom-left (only when not centered)
  const renderFollowButton = () => {
    if (!isOutForDelivery || !mapReady) return null;
    if (!getRiderPosition()) return null;
    if (isFollowingRider) return null;

    return (
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => centerOnRider(true)}
          className="bg-background/95 backdrop-blur-md shadow-md border-border gap-2"
        >
          <MapPin className="h-4 w-4" />
          Track Rider
        </Button>
      </div>
    );
  };

  // Render zoom controls - bottom-right
  const renderZoomControls = () => {
    if (!mapReady) return null;

    return (
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1 bg-background/90 backdrop-blur-md p-1 rounded-md border border-border shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="h-8 w-8 text-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="h-8 w-8 text-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Render theme switcher - top-right
  const renderThemeSwitcher = () => {
    if (!mapReady) return null;

    return (
      <div className="absolute top-3 right-3 z-[1000] bg-background/90 backdrop-blur-md p-1 rounded-md border border-border shadow-sm flex gap-1">
        <Button
          size="sm"
          variant={mapTheme === "street" ? "default" : "ghost"}
          onClick={() => setMapTheme("street")}
          className={cn(
            "h-7 text-xs font-medium px-2.5 gap-1",
            mapTheme === "street"
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "text-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Map className="w-3.5 h-3.5" />
          {!isMobile && "Street"}
        </Button>

        <Button
          size="sm"
          variant={mapTheme === "dark" ? "default" : "ghost"}
          onClick={() => setMapTheme("dark")}
          className={cn(
            "h-7 text-xs font-medium px-2.5 gap-1",
            mapTheme === "dark"
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "text-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Moon className="w-3.5 h-3.5" />
          {!isMobile && "Dark"}
        </Button>

        <Button
          size="sm"
          variant={mapTheme === "satellite" ? "default" : "ghost"}
          onClick={() => setMapTheme("satellite")}
          className={cn(
            "h-7 text-xs font-medium px-2.5 gap-1",
            mapTheme === "satellite"
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "text-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Globe className="w-3.5 h-3.5" />
          {!isMobile && "Satellite"}
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4">
        <Skeleton className="h-48 w-full rounded-md" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    );
  }

  const subtotal =
    order.items?.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    ) || 0;

  const paymentMethod = order.payments?.[0]?.method || "N/A";
  const paymentStatus = order.payments?.[0]?.status || "PENDING";

  const statusLabels: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    PACKED: "Packed",
    READY_FOR_PICKUP: "Ready for Pickup",
    ASSIGNED_RIDER: "Assigned Rider",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    RETURN_REQUESTED: "Return Requested",
    RETURNED: "Returned",
    REFUND_REQUESTED: "Refund Requested",
    REFUNDED: "Refunded",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    CONFIRMED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    PREPARING: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    PACKED: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    READY_FOR_PICKUP: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    ASSIGNED_RIDER: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    OUT_FOR_DELIVERY: "bg-green-500/10 text-green-600 border-green-500/20",
    DELIVERED: "bg-green-600/10 text-green-700 border-green-600/20",
    CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
    RETURN_REQUESTED: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    RETURNED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    REFUND_REQUESTED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    REFUNDED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  };

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    CONFIRMED: Package,
    PREPARING: Package,
    PACKED: Package,
    READY_FOR_PICKUP: Truck,
    ASSIGNED_RIDER: Truck,
    OUT_FOR_DELIVERY: Truck,
    DELIVERED: CheckCircle,
    CANCELLED: XCircle,
    RETURN_REQUESTED: AlertTriangle,
    RETURNED: RotateCcw,
    REFUND_REQUESTED: DollarSign,
    REFUNDED: DollarSign,
  };

  const StatusIcon = statusIcons[order.status] || Clock;
  const statusColor =
    statusColors[order.status] ||
    "bg-gray-500/10 text-gray-600 border-gray-200";

  return (
    <div className="w-full flex flex-col lg:flex-row min-h-0 h-full">
      <div className="relative w-full lg:w-[50%] h-64 lg:h-full lg:min-h-[400px] bg-muted overflow-hidden shrink-0">
        {renderThemeSwitcher()}
        {renderDistanceCard()}
        {renderFollowButton()}
        {renderZoomControls()}

        {!isLeafletReady && !mapError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mapError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10 p-4 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mb-1" />
            <p className="text-sm text-muted-foreground font-medium">
              Map unavailable
            </p>
            <p className="text-xs text-muted-foreground">
              {order.address?.address}, {order.address?.city}
            </p>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full z-0" />
        )}
      </div>

      <div className="w-full lg:w-[50%] flex-1 min-h-0 p-4 sm:p-5 space-y-4 overflow-y-auto lg:max-h-[70vh] scrollbar-hide">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Order #{String(order.orderNumber || 0).padStart(4, "0")}
          </h2>

          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(order.createdAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>

            <Badge
              className={`${statusColor} inline-flex items-center border px-2.5 py-0.5 text-xs font-medium shrink-0`}
            >
              <StatusIcon className="h-3.5 w-3.5 mr-1" />
              {statusLabels[order.status] || order.status}
            </Badge>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-sm mb-2.5">Order Items</h3>

          <div className="space-y-2.5">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {item.product?.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {item.product?.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>

                <span className="text-sm font-medium">
                  ₱{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-sm mb-2">Order Summary</h3>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>₱{(order.shipping || 0).toFixed(2)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">
                  -₱{order.discount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>₱{(order.tax || 0).toFixed(2)}</span>
            </div>

            <Separator className="my-1.5" />

            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₱{(order.payable || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <h4 className="font-medium text-sm mb-1 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Shipping Address
            </h4>

            {order.address ? (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {order.address.address}, {order.address.city},{" "}
                  {order.address.province} {order.address.postalCode}
                </p>
                {order.address.landmark && (
                  <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                    <Flag className="h-3 w-3 text-muted-foreground" />
                    Landmark: {order.address.landmark}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No address provided
              </p>
            )}
          </div>

          <div>
            <h4 className="font-medium text-sm mb-1 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Payment Method
            </h4>

            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{paymentMethod}</p>
              <Badge variant="outline" className="text-[10px]">
                {paymentStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Return Button for Customers */}
        {isDelivered &&
          !isReturnRequested &&
          !isReturned &&
          !isRefundRequested &&
          !isRefunded && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  onClick={() => setShowReturnDialog(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Request Return
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  You can request a return within 7 days of delivery
                </p>
              </div>
            </>
          )}

        {/* Return Requested Status Message */}
        {isReturnRequested && (
          <>
            <Separator />
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Return Requested
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80">
                    Your return request has been submitted. Please wait for the
                    rider to confirm.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Returned Status Message */}
        {isReturned && !isRefundRequested && !isRefunded && order.isPaid && (
          <>
            <Separator />
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Return Accepted
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400/80">
                    Your return has been accepted by the rider.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Refund Button for Customers */}
        {((isDelivered && order.isPaid) || (isReturned && order.isPaid)) &&
          !isRefundRequested &&
          !isRefunded && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setShowRefundDialog(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Request Refund
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Request a refund for your paid order
                </p>
              </div>
            </>
          )}

        {/* Refund Requested Status Message */}
        {isRefundRequested && (
          <>
            <Separator />
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Refund Requested
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400/80">
                    Your refund request has been submitted. Please wait for
                    admin approval.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Refunded Status Message */}
        {isRefunded && (
          <>
            <Separator />
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Refunded
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400/80">
                    Your refund has been processed successfully.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="pt-2 pb-4">
          <Button className="w-full" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Return Request Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-w-md !bg-background">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              Request Return
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for returning Order #
              {String(order.orderNumber || 0).padStart(4, "0")}
            </p>
            <div className="mt-3">
              <label className="text-sm font-medium">Reason for return</label>
              <textarea
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[80px] resize-none"
                placeholder="e.g., Item is damaged, wrong item received, etc."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 !bg-background hover:!bg-accent"
                onClick={() => {
                  setShowReturnDialog(false);
                  setReturnReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleRequestReturn}
                disabled={isReturning || !returnReason.trim()}
              >
                {isReturning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Submit Return
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Request Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-md !bg-background">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Request Refund
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for requesting a refund for Order #
              {String(order.orderNumber || 0).padStart(4, "0")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Amount:{" "}
              <span className="font-bold">
                ₱{(order.payable || 0).toFixed(2)}
              </span>
            </p>
            <div className="mt-3">
              <label className="text-sm font-medium">Reason for refund</label>
              <textarea
                className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[80px] resize-none"
                placeholder="e.g., Item is damaged, wrong item received, etc."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 !bg-background hover:!bg-accent"
                onClick={() => {
                  setShowRefundDialog(false);
                  setRefundReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleRequestRefund}
                disabled={isRefunding || !refundReason.trim()}
              >
                {isRefunding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Submit Refund
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function OrderDetailSheet({ order, open, onOpenChange }: any) {
  const isDesktop = useMediaQuery({
    minWidth: 1024,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        showCloseButton={false}
        className={cn(
          "p-0 gap-0 overflow-hidden",
          isDesktop
            ? "w-[80vw] max-w-5xl rounded-l-xl"
            : "!h-[80vh] !max-h-[80vh] !min-h-0 rounded-t-2xl",
        )}
      >
        <div className="h-full min-h-0 overflow-hidden">
          <OrderDetailContent
            order={order}
            loading={false}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
