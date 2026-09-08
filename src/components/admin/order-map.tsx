"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";
import { useRole } from "@/hooks/use-role";
import {
  Loader2,
  Moon,
  Globe,
  Sun,
  Maximize2,
  Minimize2,
  Crosshair,
  Plus,
  Minus,
  Navigation,
  Clock,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

export const TILE_LAYERS = {
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

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function shouldFlipTruck(angle: number): boolean {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  return normalizedAngle < 90 || normalizedAngle > 270;
}

export async function getCoordinates(
  address: string,
  city: string,
  province: string,
) {
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          primaryQuery,
        )}&limit=1`,
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          fallbackQuery,
        )}&limit=1`,
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

    return { lat: 13.9419, lng: 121.1644 };
  } catch (error) {
    return { lat: 13.9419, lng: 121.1644 };
  }
}

export async function getRouteGeometry(
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
  } catch (err) {}

  return [
    [start.lat, start.lng],
    [end.lat, end.lng],
  ] as [number, number][];
}

async function fetchStoreLocation() {
  try {
    const response = await fetch("/api/admin/profile");
    if (!response.ok) return null;
    const data = await response.json();

    if (data.storeLocation?.latitude && data.storeLocation?.longitude) {
      return {
        lat: data.storeLocation.latitude,
        lng: data.storeLocation.longitude,
        name: data.storeLocation.address || "Store Location",
      };
    }
    return null;
  } catch (error) {
    return null;
  }
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

export function useRiderLocationTracker(
  orderId: string | undefined,
  isTrackingActive: boolean,
) {
  const lastUpdateRef = useRef<number>(0);
  const isUpdatingRef = useRef<boolean>(false);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const channelRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isTrackingActive || !orderId) return;

    const channel = supabase.channel(`rider-location:${orderId}`, {
      config: { broadcast: { ack: true } },
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        isSubscribedRef.current = true;
      }
    });

    channelRef.current = channel;

    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch {}
    };
    requestWakeLock();

    if ("geolocation" in navigator) {
      const handleLocation = async (position: GeolocationPosition) => {
        if (isUpdatingRef.current) return;
        const now = Date.now();
        if (now - lastUpdateRef.current < 1000) return;

        const { latitude, longitude } = position.coords;

        if (lastPositionRef.current) {
          const distance = calculateDistance(
            lastPositionRef.current.lat,
            lastPositionRef.current.lng,
            latitude,
            longitude,
          );
          if (distance < 3) return; // Trigger update if rider moved 3+ meters
        }

        lastUpdateRef.current = now;
        lastPositionRef.current = { lat: latitude, lng: longitude };

        if (isSubscribedRef.current) {
          try {
            channel.send({
              type: "broadcast",
              event: "location_update",
              payload: {
                orderId,
                riderLat: latitude,
                riderLng: longitude,
                timestamp: now,
              },
            });
          } catch {}
        }

        try {
          isUpdatingRef.current = true;
          await fetch(`/api/admin/orders/${orderId}/location`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ riderLat: latitude, riderLng: longitude }),
          });
        } catch {
        } finally {
          isUpdatingRef.current = false;
        }
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocation,
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            toast.error(
              "Location permissions required for real-time tracking.",
            );
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 },
      );
    }

    return () => {
      isSubscribedRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (wakeLock) wakeLock.release().catch(() => {});
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [orderId, isTrackingActive]);
}

interface OrderMapProps {
  order: any;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

export function OrderMap({
  order,
  isFullscreen,
  onFullscreenToggle,
}: OrderMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

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
  const isProgrammaticResetRef = useRef(false);
  const routePointsRef = useRef<[number, number][]>([]);
  const completedRouteRef = useRef<any>(null);
  const remainingRouteRef = useRef<any>(null);

  const { role } = useRole();
  const { theme, resolvedTheme } = useTheme();

  const [mapTheme, setMapTheme] = useState<"street" | "dark" | "satellite">(
    "street",
  );
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [storeLocation, setStoreLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  const [isFollowingRider, setIsFollowingRider] = useState(true);
  const [riderDistance, setRiderDistance] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isMapMoved, setIsMapMoved] = useState(false);

  const [currentRiderPos, setCurrentRiderPos] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    if (
      order?.status === "OUT_FOR_DELIVERY" &&
      order?.riderLat &&
      order?.riderLng
    ) {
      return { lat: order.riderLat, lng: order.riderLng };
    }
    return null;
  });

  const isAdmin = role === "ADMIN";
  const isRider = role === "RIDER";
  const isOutForDelivery = order?.status === "OUT_FOR_DELIVERY";
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const canFullscreen = () => {
    if (role === "ADMIN") return true;
    if (role === "RIDER" && isOutForDelivery) return true;
    return false;
  };

  const getRiderPosition = () => {
    if (isOutForDelivery) {
      if (currentRiderPos) return currentRiderPos;
      if (order?.riderLat && order?.riderLng) {
        return { lat: order.riderLat, lng: order.riderLng };
      }
    }
    return storeLocation;
  };

  const updateRiderPositionOnMap = (lat: number, lng: number) => {
    setCurrentRiderPos({ lat, lng });
    if (mapInstanceRef.current) {
      animateMarkerTo(lat, lng, 1000);
    }
  };

  const checkIfMapMoved = () => {
    if (isProgrammaticResetRef.current) return;

    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || !storeLocation || !coordinates) return;

    const currentBounds = map.getBounds();
    const routeBounds = L.latLngBounds([
      [storeLocation.lat, storeLocation.lng],
      [coordinates.lat, coordinates.lng],
    ]);

    const center = currentBounds.getCenter();
    const targetCenter = routeBounds.getCenter();

    const centerDist = calculateDistance(
      center.lat,
      center.lng,
      targetCenter.lat,
      targetCenter.lng,
    );

    const targetZoom = map.getBoundsZoom(routeBounds, false, L.point(50, 50));
    const zoomDiff = Math.abs(map.getZoom() - targetZoom);

    if (centerDist > 300 || zoomDiff >= 0.8) {
      setIsMapMoved(true);
    } else {
      setIsMapMoved(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadStore = async () => {
      const loc = await fetchStoreLocation();
      if (active) setStoreLocation(loc);
    };
    loadStore();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const currentTheme = resolvedTheme || theme || "light";
    setMapTheme(currentTheme === "dark" ? "dark" : "street");
  }, [theme, resolvedTheme]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.getElementById("leaflet-dark-filter")) {
      const style = document.createElement("style");
      style.id = "leaflet-dark-filter";
      style.textContent = `
        .leaflet-dark-tiles {
          filter: invert(1) hue-rotate(180deg) brightness(0.78) contrast(0.9) saturate(0.65);
        }
        .leaflet-normal-tiles,
        .leaflet-satellite-tiles {
          filter: none;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadLeaflet = async () => {
      try {
        if (leafletRef.current) {
          setIsLeafletReady(true);
          return;
        }
        const leaflet = await import("leaflet");
        if (!active) return;
        leafletRef.current = leaflet.default || leaflet;
        setIsLeafletReady(true);
      } catch (error) {}
    };
    loadLeaflet();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!order?.address?.address && !order?.address?.city) return;
    let active = true;

    const fetchCoords = async () => {
      try {
        const coords = await getCoordinates(
          order.address?.address || "",
          order.address?.city || "",
          order.address?.province || "",
        );
        if (active) setCoordinates(coords);
      } catch (error) {
        if (active) setCoordinates({ lat: 13.9419, lng: 121.1644 });
      }
    };
    fetchCoords();
    return () => {
      active = false;
    };
  }, [order?.address?.address, order?.address?.city, order?.address?.province]);

  const createRiderIcon = (zoom: number, angle: number = 0) => {
    const L = leafletRef.current;
    if (!L) return null;

    const baseSize = 60;
    const scale = Math.min(Math.max(zoom / 15, 0.6), 1.5);
    const size = Math.min(Math.max(baseSize * scale, 40), 120);
    const shouldFlip = shouldFlipTruck(angle);

    return L.divIcon({
      className: "custom-leaflet-animated-icon",
      html: `
        <div style="
          width:${size}px;
          height:${size}px;
          display:flex;
          align-items:center;
          justify-content:center;
          transform:scaleX(${shouldFlip ? -1 : 1});
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
    const L = leafletRef.current;
    if (!L) return null;

    const baseSize = 64;
    const scale = Math.min(Math.max(zoom / 15, 0.6), 1.5);
    const size = Math.min(Math.max(baseSize * scale, 32), 96);

    return L.divIcon({
      className: "custom-leaflet-animated-icon",
      html: `
        <div style="
          width:${size}px;
          height:${size}px;
          display:flex;
          align-items:center;
          justify-content:center;
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
    if (!leafletRef.current) return;
    if (riderMarkerRef.current) {
      const riderIcon = createRiderIcon(zoom, lastBearingRef.current);
      if (riderIcon) riderMarkerRef.current.setIcon(riderIcon);
    }
    if (customerMarkerRef.current) {
      const customerIcon = createCustomerIcon(zoom);
      if (customerIcon) customerMarkerRef.current.setIcon(customerIcon);
    }
  };

  const updateRouteProgress = (riderLat: number, riderLng: number) => {
    const points = routePointsRef.current;
    if (points.length < 2) return;

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
    const L = leafletRef.current;
    if (!map || !L) return;

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

  const fitFullRoute = (animate = true) => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || !storeLocation || !coordinates) return;

    isProgrammaticResetRef.current = true;
    setIsMapMoved(false);

    const bounds = L.latLngBounds([
      [storeLocation.lat, storeLocation.lng],
      [coordinates.lat, coordinates.lng],
    ]);

    map.fitBounds(bounds, { padding: [50, 50], animate });

    setTimeout(
      () => {
        isProgrammaticResetRef.current = false;
      },
      animate ? 500 : 50,
    );
  };

  const cleanupMap = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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

  const animateMarkerTo = (
    targetLat: number,
    targetLng: number,
    duration = 1000,
  ) => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;

    if (!map || !L) return;

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
      if (centerDistance > 15) {
        map.panTo([targetLat, targetLng], { animate: true, duration: 0.8 });
      }
    }

    const distance = calculateDistance(
      startPos.lat,
      startPos.lng,
      targetLat,
      targetLng,
    );

    if (distance > 2000) {
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

  useEffect(() => {
    if (
      !coordinates ||
      !mapRef.current ||
      !isLeafletReady ||
      !storeLocation ||
      !leafletRef.current
    ) {
      return;
    }

    if (mapInstanceRef.current || mapInitializingRef.current) return;

    mapInitializingRef.current = true;
    let active = true;

    const initMap = async () => {
      const L = leafletRef.current;
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
        const customerIcon = createCustomerIcon(initialZoom);

        if (customerIcon) {
          customerMarkerRef.current = L.marker(customerPos, {
            icon: customerIcon,
          }).addTo(map);
          customerMarkerRef.current.setZIndexOffset(500);
        }

        const routePoints = await getRouteGeometry(storeLocation, coordinates);

        if (!active || !mapInstanceRef.current) return;

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
          lastBearingRef.current = calculateBearing(
            routePoints[0][0],
            routePoints[0][1],
            routePoints[1][0],
            routePoints[1][1],
          );
        }

        const bounds = L.latLngBounds([storePos, customerPos]);
        map.fitBounds(bounds, { padding: [50, 50] });

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
          }
        }

        map.on("zoomend", () => {
          if (mapInstanceRef.current === map) {
            updateMarkerIcons(map.getZoom());
            if (!isOutForDelivery) {
              checkIfMapMoved();
            }
          }
        });

        map.on("moveend", () => {
          if (mapInstanceRef.current === map && !isOutForDelivery) {
            checkIfMapMoved();
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
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch {}
        }
        mapInstanceRef.current = null;
        setMapReady(false);
      } finally {
        if (active) mapInitializingRef.current = false;
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
  }, [coordinates, isLeafletReady, storeLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    const activeConfig = TILE_LAYERS[mapTheme];

    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch {}
    }

    tileLayerRef.current = L.tileLayer(
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
      labelsLayerRef.current = L.tileLayer(labelsConfig.url, {
        ...labelsConfig.options,
        opacity: 0.6,
      }).addTo(map);
    }
  }, [mapTheme]);

  // Real-Time Location Listener (Broadcasts + Database Fallback)
  useEffect(() => {
    if (!order?.id || !isOutForDelivery) return;

    // Use unique channel topic names per hook instance to prevent collision during toggles/re-mounts
    const broadcastTopic = `rider-location:${order.id}:${Math.random().toString(36).substring(2, 7)}`;
    const dbTopic = `order-db-changes:${order.id}:${Math.random().toString(36).substring(2, 7)}`;

    let isSubscribed = true;

    // 1. Listen via WebSockets (Instant High Frequency)
    const broadcastChannel = supabase
      .channel(broadcastTopic)
      .on("broadcast", { event: "location_update" }, (payload) => {
        const { riderLat, riderLng } = payload.payload || {};
        if (riderLat !== undefined && riderLng !== undefined && isSubscribed) {
          updateRiderPositionOnMap(riderLat, riderLng);
        }
      })
      .subscribe();

    // 2. Fallback: Listen directly to Database Updates (Postgres Changes)
    const dbChannel = supabase
      .channel(dbTopic)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const newLat = payload.new?.riderLat;
          const newLng = payload.new?.riderLng;
          if (newLat !== undefined && newLng !== undefined && isSubscribed) {
            updateRiderPositionOnMap(newLat, newLng);
          }
        },
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [order?.id, isOutForDelivery]);

  useEffect(() => {
    const loadLottie = () => {
      if (document.getElementById("lottie-player-js")) return;
      const script = document.createElement("script");
      script.id = "lottie-player-js";
      script.src =
        "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
      script.type = "module";
      document.body.appendChild(script);
    };
    loadLottie();
  }, []);

  const renderTopBar = () => {
    if (!mapReady) return null;

    const labelText = isAdmin ? "Rider Location" : "Your Location";

    return (
      <div className="absolute top-3 inset-x-3 z-20 pointer-events-none flex items-start justify-between gap-2">
        {isOutForDelivery && (isAdmin || isRider) && (
          <div
            className={cn(
              "pointer-events-auto transition-all duration-200",
              // Mobile + Not Fullscreen: expand card width to prevent text overflow
              !isFullscreen
                ? "w-[calc(100%-3.5rem)] sm:w-auto sm:max-w-xs"
                : "max-w-[60%] sm:max-w-xs",
            )}
          >
            <div className="bg-background/95 backdrop-blur-md border border-border/80 shadow-lg rounded-xl p-2.5 sm:p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                  {labelText}
                </span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary shrink-0">
                  Live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-foreground">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-muted-foreground truncate">
                    Distance
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 min-w-0">
                    <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />
                    {riderDistance !== null ? (
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {riderDistance >= 1000
                          ? `${(riderDistance / 1000).toFixed(1)} km`
                          : `${Math.round(riderDistance)} m`}
                      </span>
                    ) : (
                      <span className="text-[11px] sm:text-xs text-muted-foreground animate-pulse truncate">
                        Calculating...
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col border-l border-border/60 pl-2 min-w-0">
                  <span className="text-[10px] text-muted-foreground truncate">
                    Est. Arrival
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    {etaMinutes !== null ? (
                      <span className="text-xs sm:text-sm font-bold truncate">
                        ~{etaMinutes} mins
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground animate-pulse truncate">
                        --
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-auto shrink-0 ml-auto">
          <div className="bg-background/90 backdrop-blur-md border border-border/80 shadow-md rounded-xl p-1 flex flex-col sm:flex-row items-center gap-1 sm:gap-0.5">
            <Button
              size="sm"
              variant={mapTheme === "street" ? "default" : "ghost"}
              onClick={() => setMapTheme("street")}
              className={cn(
                "h-8 sm:h-7 w-8 sm:w-auto text-xs font-medium px-0 sm:px-2 gap-1.5 justify-center",
                mapTheme === "street" &&
                  "bg-primary text-primary-foreground shadow-sm",
              )}
              title="Street View"
            >
              <Sun className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Street</span>
            </Button>

            <Button
              size="sm"
              variant={mapTheme === "dark" ? "default" : "ghost"}
              onClick={() => setMapTheme("dark")}
              className={cn(
                "h-8 sm:h-7 w-8 sm:w-auto text-xs font-medium px-0 sm:px-2 gap-1.5 justify-center",
                mapTheme === "dark" &&
                  "bg-primary text-primary-foreground shadow-sm",
              )}
              title="Dark View"
            >
              <Moon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Dark</span>
            </Button>

            <Button
              size="sm"
              variant={mapTheme === "satellite" ? "default" : "ghost"}
              onClick={() => setMapTheme("satellite")}
              className={cn(
                "h-8 sm:h-7 w-8 sm:w-auto text-xs font-medium px-0 sm:px-2 gap-1.5 justify-center",
                mapTheme === "satellite" &&
                  "bg-primary text-primary-foreground shadow-sm",
              )}
              title="Satellite View"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Satellite</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderBottomDock = () => {
    if (!mapReady) return null;

    const showActionButton = isOutForDelivery ? !isFollowingRider : isMapMoved;

    const buttonIcon = isOutForDelivery ? (
      <>
        <Crosshair className="h-4 w-4 text-primary" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      </>
    ) : (
      <RotateCcw className="h-4 w-4 text-primary" />
    );

    const buttonTooltip = isOutForDelivery
      ? "Recenter on Rider"
      : "Reset Route View";

    const buttonAction = isOutForDelivery
      ? () => centerOnRider(true)
      : () => fitFullRoute(true);

    return (
      <div className="absolute bottom-3 inset-x-3 z-20 pointer-events-none flex items-end justify-between gap-2">
        <div />

        <div className="pointer-events-auto">
          {canFullscreen() && onFullscreenToggle && (
            <div className="bg-background/90 backdrop-blur-md border border-border/80 shadow-md rounded-xl p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onFullscreenToggle}
                className={cn(
                  "text-xs font-medium px-2.5 gap-1.5 text-foreground hover:bg-accent",
                  isMobile ? "h-8" : "h-7",
                )}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Minimize Map</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Fullscreen</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex flex-col gap-2 items-end">
          {showActionButton && (
            <div className="bg-background/90 backdrop-blur-md border border-border/80 shadow-md rounded-xl p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={buttonAction}
                className={cn(
                  "text-foreground hover:bg-accent relative",
                  isMobile ? "h-7 w-7" : "h-8 w-8",
                )}
                aria-label={buttonTooltip}
                title={buttonTooltip}
              >
                {buttonIcon}
              </Button>
            </div>
          )}

          <div className="bg-background/90 backdrop-blur-md border border-border/80 shadow-md rounded-xl flex flex-col gap-0.5 p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className={cn(
                "text-foreground hover:bg-accent",
                isMobile ? "h-7 w-7" : "h-8 w-8",
              )}
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <div className="w-full h-px bg-border/60" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className={cn(
                "text-foreground hover:bg-accent",
                isMobile ? "h-7 w-7" : "h-8 w-8",
              )}
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "w-full rounded-lg overflow-hidden border border-border shadow-sm relative z-0 bg-background",
        isFullscreen
          ? "h-full min-h-screen"
          : "h-full min-h-[400px] md:min-h-[500px]",
      )}
    >
      {renderTopBar()}
      {renderBottomDock()}

      {!isLeafletReady ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full z-0" />
      )}
    </div>
  );
}
