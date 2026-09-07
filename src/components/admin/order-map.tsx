"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { useRole } from "@/hooks/use-role";
import {
  Loader2,
  Moon,
  Globe,
  Map,
  Maximize2,
  Minimize2,
  MapPin,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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

    return {
      lat: 13.9419,
      lng: 121.1644,
    };
  } catch (error) {
    return {
      lat: 13.9419,
      lng: 121.1644,
    };
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
  } catch (err) {
    // Fallback to direct line
  }

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

  useEffect(() => {
    if (!isTrackingActive || !orderId) {
      return;
    }

    const channel = supabase.channel(`rider-location:${orderId}`, {
      config: {
        broadcast: {
          ack: true,
        },
      },
    });

    channel.subscribe();
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

          if (distance < 5) return;
        }

        lastUpdateRef.current = now;
        lastPositionRef.current = {
          lat: latitude,
          lng: longitude,
        };

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

        try {
          isUpdatingRef.current = true;

          await fetch(`/api/admin/orders/${orderId}/location`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              riderLat: latitude,
              riderLng: longitude,
            }),
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
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            toast.error("Unable to determine your current location.");
          } else if (error.code === error.TIMEOUT) {
            toast.error("Location request timed out. Retrying...");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 2000,
        },
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
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

  const isAdmin = role === "ADMIN";
  const isRider = role === "RIDER";
  const isOutForDelivery = order?.status === "OUT_FOR_DELIVERY";

  const canFullscreen = () => {
    if (role === "ADMIN") return true;
    if (role === "RIDER" && isOutForDelivery) return true;
    return false;
  };

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

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadStoreLocation = async () => {
      const location = await fetchStoreLocation();

      if (active) {
        setStoreLocation(location);
      }
    };

    loadStoreLocation();

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
      } catch (error) {
        // Leaflet loading failed
      }
    };

    loadLeaflet();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      !order?.address?.address &&
      !order?.address?.city &&
      !order?.address?.province
    ) {
      return;
    }

    let active = true;

    const fetchCoords = async () => {
      try {
        const coords = await getCoordinates(
          order.address?.address || "",
          order.address?.city || "",
          order.address?.province || "",
        );

        if (active) {
          setCoordinates(coords);
        }
      } catch (error) {
        if (active) {
          setCoordinates({
            lat: 13.9419,
            lng: 121.1644,
          });
        }
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
    const L = leafletRef.current;

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
    if (!leafletRef.current) return;

    if (riderMarkerRef.current) {
      const riderIcon = createRiderIcon(zoom, lastBearingRef.current);

      if (riderIcon) {
        riderMarkerRef.current.setIcon(riderIcon);
      }
    }

    if (customerMarkerRef.current) {
      const customerIcon = createCustomerIcon(zoom);

      if (customerIcon) {
        customerMarkerRef.current.setIcon(customerIcon);
      }
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
    duration: number = 500,
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

    if (mapInstanceRef.current || mapInitializingRef.current) {
      return;
    }

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
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch {}
        }

        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        labelsLayerRef.current = null;
        riderMarkerRef.current = null;
        customerMarkerRef.current = null;
        polylineRef.current = null;
        setMapReady(false);
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
    if (!order?.id || !isOutForDelivery) {
      return;
    }

    const channel = supabase.channel(`rider-location:${order.id}`, {
      config: {
        broadcast: {
          ack: true,
        },
      },
    });

    channel
      .on(
        "broadcast",
        {
          event: "location_update",
        },
        (payload) => {
          const { riderLat, riderLng } = payload.payload;

          if (riderLat !== undefined && riderLng !== undefined) {
            setCurrentRiderPos({
              lat: riderLat,
              lng: riderLng,
            });

            if (mapInstanceRef.current) {
              animateMarkerTo(riderLat, riderLng, 300);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, isOutForDelivery]);

  useEffect(() => {
    if (!order?.id) return;

    const channelName = `order-realtime-${order.id}`;

    const existingChannel = supabase
      .getChannels()
      .find((ch) => ch.topic === `realtime:${channelName}`);

    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase.channel(channelName);

    channel.on(
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
          riderLat !== null &&
          riderLng !== null &&
          riderLat !== undefined &&
          riderLng !== undefined
        ) {
          setCurrentRiderPos({
            lat: riderLat,
            lng: riderLng,
          });

          if (mapInstanceRef.current) {
            animateMarkerTo(riderLat, riderLng, 500);
          }
        } else if (status !== "OUT_FOR_DELIVERY" && storeLocation) {
          setCurrentRiderPos(null);

          if (riderMarkerRef.current) {
            animateMarkerTo(storeLocation.lat, storeLocation.lng, 500);
          }
        }
      },
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, storeLocation]);

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

  const renderDistanceCard = () => {
    if (!isOutForDelivery || !mapReady) return null;

    if (isAdmin) {
      return (
        <div className="absolute top-3 left-3 z-[9999] pointer-events-auto">
          <div className="bg-background/90 backdrop-blur-md border border-border shadow-md rounded-lg px-3 py-2 min-w-[130px]">
            <div className="text-xs text-muted-foreground">
              Rider's Location
            </div>
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
    }

    if (isRider) {
      return (
        <div className="absolute top-3 left-3 z-[9999] pointer-events-auto">
          <div className="bg-background/90 backdrop-blur-md border border-border shadow-md rounded-lg px-3 py-2 min-w-[140px]">
            <div className="text-xs text-muted-foreground">Your Position</div>
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
    }

    return null;
  };

  const renderFollowButton = () => {
    if (!isOutForDelivery || !mapReady) return null;
    if (!getRiderPosition()) return null;

    const followLabel = isRider ? "Center Map" : "Track Rider";
    const followingLabel = isRider ? "Centered" : "Tracking Rider";

    return (
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
        {!isFollowingRider && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => centerOnRider(true)}
            className="bg-background/95 backdrop-blur-md shadow-md border-border gap-2"
          >
            <MapPin className="h-4 w-4" />
            {followLabel}
          </Button>
        )}

        {isFollowingRider && (
          <div className="bg-background/90 backdrop-blur-md border border-border shadow-sm rounded-full px-3 py-1.5 text-xs font-medium">
            {followingLabel}
          </div>
        )}
      </div>
    );
  };

  const renderMobileDistanceCard = () => {
    if (!isOutForDelivery || !mapReady) return null;

    const label = isRider ? "You" : "Rider";

    return (
      <div className="lg:hidden absolute top-3 left-3 z-[9999] pointer-events-auto">
        <div className="bg-background/90 backdrop-blur-md border border-border shadow-md rounded-lg px-2.5 py-1.5 min-w-[100px]">
          <div className="text-[10px] text-muted-foreground">{label}</div>
          <div className="text-sm font-semibold">
            {riderDistance !== null
              ? riderDistance >= 1000
                ? `${(riderDistance / 1000).toFixed(1)}km`
                : `${Math.round(riderDistance)}m`
              : "..."}
          </div>
          {etaMinutes !== null && (
            <div className="text-[10px] text-muted-foreground">
              ETA {etaMinutes}m
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderZoomControls = () => {
    if (!mapReady) return null;

    const showFullscreen = canFullscreen();
    const zoomPosition =
      showFullscreen || isOutForDelivery
        ? "bottom-16 right-4 flex-col"
        : "bottom-4 right-4 flex-col";

    return (
      <div
        className={cn(
          "absolute z-[1000] flex gap-1 bg-background/90 backdrop-blur-md p-1 rounded-md border border-border shadow-sm",
          isFullscreen ? "bottom-4 right-4 flex-row" : zoomPosition,
        )}
      >
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
          Street
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
          Dark
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
          Satellite
        </Button>
      </div>
    );
  };

  const renderFullscreenButton = () => {
    if (!mapReady) return null;
    if (!canFullscreen() || !onFullscreenToggle) return null;

    return (
      <div
        className={cn(
          "absolute z-[1000]",
          isFullscreen
            ? "bottom-4 left-1/2 -translate-x-1/2"
            : "bottom-4 right-4",
        )}
      >
        <Button
          variant="outline"
          size={isFullscreen ? "default" : "sm"}
          onClick={onFullscreenToggle}
          className="bg-background/90 backdrop-blur-md hover:bg-accent shadow-sm border-border gap-2"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4" />
              Minimize Map
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              Fullscreen
            </>
          )}
        </Button>
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
      {renderThemeSwitcher()}
      {renderDistanceCard()}
      {renderMobileDistanceCard()}
      {renderZoomControls()}
      {renderFollowButton()}
      {renderFullscreenButton()}

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
