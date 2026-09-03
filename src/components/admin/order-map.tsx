"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { useRole } from "@/hooks/use-role";
import { Loader2, Moon, Globe, Map, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Initialize Supabase Client (for realtime subscription only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Default fallback location (will be overridden by admin's store location)
const DEFAULT_STORE_LOCATION = {
  lat: 14.5995,
  lng: 120.9842,
  name: "Store Location (Default)",
};

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

// Calculate compass heading angle (0 to 360 deg) between two coordinates
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

    const primaryQuery = `${address}, ${city}, ${province}, Philippines`;

    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        primaryQuery,
      )}&limit=1`,
      { headers },
    );

    let data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    const fallbackQuery = `${city}, ${province}, Philippines`;

    response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        fallbackQuery,
      )}&limit=1`,
      { headers },
    );

    data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return {
      lat: 13.9419,
      lng: 121.1644,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
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
    console.error("OSRM route error, falling back to direct line:", err);
  }

  return [
    [start.lat, start.lng],
    [end.lat, end.lng],
  ] as [number, number][];
}

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
        address: data.storeLocation,
      };
    }

    return DEFAULT_STORE_LOCATION;
  } catch (error) {
    console.error("Error fetching store location:", error);
    return DEFAULT_STORE_LOCATION;
  }
}

export function useRiderLocationTracker(
  orderId: string | undefined,
  isTrackingActive: boolean,
) {
  const lastUpdateRef = useRef<number>(0);
  const isUpdatingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isTrackingActive || !orderId || !("geolocation" in navigator)) {
      return;
    }

    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err) {
        console.warn("Wake Lock request failed:", err);
      }
    };

    requestWakeLock();

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        if (isUpdatingRef.current) return;

        const now = Date.now();
        if (now - lastUpdateRef.current < 3000) return;
        lastUpdateRef.current = now;

        const { latitude, longitude } = position.coords;

        try {
          isUpdatingRef.current = true;
          const response = await fetch(
            `/api/admin/orders/${orderId}/location`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                riderLat: latitude,
                riderLng: longitude,
              }),
            },
          );

          if (!response.ok) {
            const error = await response.json();
            console.error(
              "Failed to update rider location:",
              error.error || response.statusText,
            );
          }
        } catch (err) {
          console.error("Error updating location:", err);
        } finally {
          isUpdatingRef.current = false;
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permissions required for real-time tracking.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (wakeLock) wakeLock.release().catch(() => {});
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
  const tileLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const leafletLoadedRef = useRef(false);
  const lastBearingRef = useRef<number>(0);
  const { role } = useRole();

  const { theme, resolvedTheme } = useTheme();
  const [mapTheme, setMapTheme] = useState<"street" | "dark" | "satellite">(
    "street",
  );
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapError, setMapError] = useState(false);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  const [storeLocation, setStoreLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  }>(DEFAULT_STORE_LOCATION);
  const [storeLoading, setStoreLoading] = useState(true);

  const originalRouteRef = useRef<[number, number][] | null>(null);
  const riderInitializedRef = useRef(false);

  const canFullscreen = () => {
    if (role === "ADMIN") return true;
    if (role === "RIDER" && order.status === "OUT_FOR_DELIVERY") return true;
    return false;
  };

  const shouldUseRealLocation = () => {
    return order.status === "OUT_FOR_DELIVERY";
  };

  const getRiderPosition = () => {
    if (shouldUseRealLocation() && order?.riderLat && order?.riderLng) {
      return { lat: order.riderLat, lng: order.riderLng };
    }
    return { lat: storeLocation.lat, lng: storeLocation.lng };
  };

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
      leafletLoadedRef.current = true;
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
        leafletLoadedRef.current = true;
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

  const createRiderIcon = (zoom: number, rotation: number = 0) => {
    if (!window.L) return null;

    const baseSize = 60;
    const minSize = 40;
    const maxSize = 120;
    const scale = Math.min(Math.max(zoom / 15, 0.6), 1.5);
    const size = Math.min(Math.max(baseSize * scale, minSize), maxSize);

    const isHeadingEast = rotation > 0 && rotation < 180;
    const scaleX = isHeadingEast ? -1 : 1;

    let rawPitch = isHeadingEast ? rotation - 90 : 270 - rotation;
    const correctedPitch = isHeadingEast ? -rawPitch : rawPitch;
    const clampedPitch = Math.min(Math.max(correctedPitch, -30), 30);

    const offsetX = 0;
    const offsetY = -17;

    return window.L.divIcon({
      className: "custom-leaflet-animated-icon",
      html: `
      <div style="
        width:${size}px;
        height:${size}px;
        display:flex;
        align-items:center;
        justify-content:center;
        transform: scaleX(${scaleX}) rotate(${clampedPitch}deg);
        transform-origin: center bottom;
        transition: transform 0.3s ease-out;
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
      iconAnchor: [size / 2 + offsetX, size + offsetY],
      popupAnchor: [0, -size],
    });
  };

  const createCustomerIcon = (zoom: number) => {
    if (!window.L) return null;

    const baseSize = 64;
    const minSize = 32;
    const maxSize = 96;
    const scale = Math.min(Math.max(zoom / 15, 0.6), 1.5);
    const size = Math.min(Math.max(baseSize * scale, minSize), maxSize);

    return window.L.divIcon({
      className: "custom-leaflet-animated-icon",
      html: `
        <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;transition: all 0.2s ease;">
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
    if (!window.L) return;

    if (riderMarkerRef.current) {
      const newIcon = createRiderIcon(zoom, lastBearingRef.current);
      if (newIcon) riderMarkerRef.current.setIcon(newIcon);
    }
    if (customerMarkerRef.current) {
      const newIcon = createCustomerIcon(zoom);
      if (newIcon) customerMarkerRef.current.setIcon(newIcon);
    }
  };

  useEffect(() => {
    if (!order?.address) return;

    let isMounted = true;

    const fetchCoordinates = async () => {
      const coords = await getCoordinates(
        order.address.address,
        order.address.city,
        order.address.province,
      );
      if (isMounted) {
        setCoordinates(coords);
      }
    };

    fetchCoordinates();

    return () => {
      isMounted = false;
    };
  }, [order]);

  const animateMarkerTo = (
    targetLat: number,
    targetLng: number,
    duration: number = 1000,
  ) => {
    if (!riderMarkerRef.current || !mapInstanceRef.current) return;

    const startPos = riderMarkerRef.current.getLatLng();

    // 1. Calculate rotation bearing if movement occurs
    if (startPos.lat !== targetLat || startPos.lng !== targetLng) {
      const bearing = calculateBearing(
        startPos.lat,
        startPos.lng,
        targetLat,
        targetLng,
      );
      lastBearingRef.current = bearing;

      const currentZoom = mapInstanceRef.current.getZoom();
      const rotatedIcon = createRiderIcon(currentZoom, bearing);
      if (rotatedIcon) {
        riderMarkerRef.current.setIcon(rotatedIcon);
      }
    }

    // 2. Animate position smoothly
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentLat = startPos.lat + (targetLat - startPos.lat) * progress;
      const currentLng = startPos.lng + (targetLng - startPos.lng) * progress;

      riderMarkerRef.current.setLatLng([currentLat, currentLng]);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (tileLayerRef.current) {
      tileLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      labelsLayerRef.current = null;
    }
    if (riderMarkerRef.current) {
      riderMarkerRef.current = null;
    }
    if (customerMarkerRef.current) {
      customerMarkerRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current = null;
    }
    riderInitializedRef.current = false;
  };

  // Initialize map
  useEffect(() => {
    if (!coordinates || !mapRef.current || !isLeafletReady || storeLoading)
      return;
    if (!window.L) return;

    cleanupMap();

    const timer = setTimeout(async () => {
      try {
        if (!mapRef.current || !window.L) return;

        const customerPos: [number, number] = [
          coordinates.lat,
          coordinates.lng,
        ];
        const storePos: [number, number] = [
          storeLocation.lat,
          storeLocation.lng,
        ];

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = window.L.map(mapRef.current, {
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: true,
          attributionControl: false,
        });

        const activeConfig = TILE_LAYERS[mapTheme];
        const tileLayer = window.L.tileLayer(
          activeConfig.url,
          activeConfig.options,
        ).addTo(map);
        tileLayerRef.current = tileLayer;

        if (mapTheme === "satellite") {
          const labelsConfig = TILE_LAYERS.satelliteLabels;
          const labelsLayer = window.L.tileLayer(labelsConfig.url, {
            ...labelsConfig.options,
            opacity: 0.6,
          }).addTo(map);
          labelsLayerRef.current = labelsLayer;
        }

        const initialZoom = map.getZoom();

        const customerIcon = createCustomerIcon(initialZoom);
        if (customerIcon) {
          const customerMarker = window.L.marker(customerPos, {
            icon: customerIcon,
          }).addTo(map);
          customerMarkerRef.current = customerMarker;

          if (order?.address) {
            customerMarker.bindPopup(`
              <div style="font-size:13px;">
                <strong>Delivery Destination</strong><br/>
                ${order.address.address}<br/>
                ${order.address.city}, ${order.address.province}
              </div>
            `);
          }
        }

        const routePoints = await getRouteGeometry(
          { lat: storeLocation.lat, lng: storeLocation.lng },
          coordinates,
        );

        originalRouteRef.current = routePoints;

        polylineRef.current = window.L.polyline(routePoints, {
          color: "#dc2626",
          weight: 5,
          opacity: 0.85,
        }).addTo(map);

        // Initial bearing calculated along the first leg of the route
        if (routePoints.length > 1) {
          lastBearingRef.current = calculateBearing(
            routePoints[0][0],
            routePoints[0][1],
            routePoints[1][0],
            routePoints[1][1],
          );
        }

        const bounds = window.L.latLngBounds([storePos, customerPos]);
        map.fitBounds(bounds, { padding: [50, 50] });

        setTimeout(() => {
          const currentZoom = map.getZoom();
          const riderIcon = createRiderIcon(
            currentZoom,
            lastBearingRef.current,
          );

          if (riderIcon) {
            const riderPos = getRiderPosition();

            const riderMarker = window.L.marker([riderPos.lat, riderPos.lng], {
              icon: riderIcon,
              zIndexOffset: 1000,
            }).addTo(map);

            riderMarkerRef.current = riderMarker;
            riderInitializedRef.current = true;

            riderMarker.bindPopup(
              `<b>Delivery Rider</b><br/>Status: ${order.status}`,
            );
          }

          const updatedCustomerIcon = createCustomerIcon(currentZoom);
          if (updatedCustomerIcon && customerMarkerRef.current) {
            customerMarkerRef.current.setIcon(updatedCustomerIcon);
          }

          mapInstanceRef.current = map;
          map.invalidateSize();
        }, 100);

        map.on("zoomend", () => {
          const currentZoom = map.getZoom();
          updateMarkerIcons(currentZoom);
        });
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError(true);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanupMap();
    };
  }, [
    coordinates,
    order,
    mapTheme,
    isLeafletReady,
    storeLocation,
    storeLoading,
  ]);

  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, []);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!order?.id) return;

    if (order.status !== "OUT_FOR_DELIVERY") {
      if (riderMarkerRef.current) {
        const storePos = { lat: storeLocation.lat, lng: storeLocation.lng };
        animateMarkerTo(storePos.lat, storePos.lng, 500);
      }
      return;
    }

    const channelName = `order-realtime-${order.id}`;

    const existingChannel = supabase
      .getChannels()
      .find((ch) => ch.topic === `realtime:${channelName}`);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channel = supabase.channel(channelName);

    channel
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
            const storePos = {
              lat: storeLocation.lat,
              lng: storeLocation.lng,
            };
            animateMarkerTo(storePos.lat, storePos.lng, 500);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, coordinates, storeLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current || !window.L) return;

    const map = mapInstanceRef.current;
    const activeConfig = TILE_LAYERS[mapTheme];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newTileLayer = window.L.tileLayer(
      activeConfig.url,
      activeConfig.options,
    ).addTo(map);
    tileLayerRef.current = newTileLayer;

    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (mapTheme === "satellite") {
      const labelsConfig = TILE_LAYERS.satelliteLabels;
      const labelsLayer = window.L.tileLayer(labelsConfig.url, {
        ...labelsConfig.options,
        opacity: 0.6,
      }).addTo(map);
      labelsLayerRef.current = labelsLayer;
    }

    if (polylineRef.current) {
      polylineRef.current.setStyle({
        color: "#dc2626",
      });
    }
  }, [mapTheme]);

  return (
    <div
      className={cn(
        "w-full rounded-lg overflow-hidden border border-border shadow-sm relative z-0 bg-background",
        isFullscreen
          ? "h-full min-h-screen"
          : "h-full min-h-[400px] md:min-h-[500px]",
      )}
    >
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

      {canFullscreen() && onFullscreenToggle && (
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
      )}

      {!isLeafletReady && !mapError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : mapError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10 p-4 text-center">
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
  );
}
