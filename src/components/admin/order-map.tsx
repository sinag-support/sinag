"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { useRole } from "@/hooks/use-role";
import { Loader2, Moon, Globe, Map, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Initialize Supabase Client
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

    // ✅ Add null/undefined checks
    const safeAddress = address || "";
    const safeCity = city || "";
    const safeProvince = province || "";

    // Try with full address first
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
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      }
    }

    // Fallback to city only
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
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      }
    }

    // Default fallback (center of Lipa City, Batangas)
    return { lat: 13.9419, lng: 121.1644 };
  } catch (error) {
    console.error("Geocoding error:", error);
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
  } catch (err) {
    console.error("OSRM route error:", err);
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
    console.error("Error fetching store location:", error);
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isTrackingActive || !orderId) {
      return;
    }

    const channel = supabase.channel(`rider-location:${orderId}`, {
      config: { broadcast: { ack: true } },
    });

    channel.subscribe();
    channelRef.current = channel;

    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err) {
        // Wake Lock not supported
      }
    };

    requestWakeLock();

    if ("geolocation" in navigator) {
      const getLocation = () => {
        if (isUpdatingRef.current) return;

        navigator.geolocation.getCurrentPosition(
          async (position) => {
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
            lastPositionRef.current = { lat: latitude, lng: longitude };

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
            } catch (err) {
              // Broadcast error
            }

            try {
              isUpdatingRef.current = true;
              await fetch(`/api/admin/orders/${orderId}/location`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  riderLat: latitude,
                  riderLng: longitude,
                }),
              });
            } catch (err) {
              // API error
            } finally {
              isUpdatingRef.current = false;
            }
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              toast.error(
                "Location permissions required for real-time tracking.",
              );
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      };

      getLocation();
      intervalRef.current = setInterval(getLocation, 2000);
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (wakeLock) wakeLock.release().catch(() => {});
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
  const tileLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const leafletLoadedRef = useRef(false);
  const lastBearingRef = useRef<number>(0);
  const lastLocationUpdateRef = useRef<number>(0);
  const { role } = useRole();
  const isMapCreatedRef = useRef(false);

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

  const canFullscreen = () => {
    if (role === "ADMIN") return true;
    if (role === "RIDER" && order.status === "OUT_FOR_DELIVERY") return true;
    return false;
  };

  const getRiderPosition = () => {
    if (order.status === "OUT_FOR_DELIVERY") {
      if (currentRiderPos) return currentRiderPos;
      if (order.riderLat && order.riderLng) {
        return { lat: order.riderLat, lng: order.riderLng };
      }
    }
    return storeLocation;
  };

  useEffect(() => {
    const loadStoreLocation = async () => {
      const location = await fetchStoreLocation();
      setStoreLocation(location);
    };
    loadStoreLocation();
  }, []);

  useEffect(() => {
    const currentTheme = resolvedTheme || theme || "light";
    setMapTheme(currentTheme === "dark" ? "dark" : "street");
  }, [theme, resolvedTheme]);

  useEffect(() => {
    if (!document.getElementById("leaflet-dark-filter")) {
      const style = document.createElement("style");
      style.id = "leaflet-dark-filter";
      style.textContent = `
        .leaflet-dark-tiles {
          filter: invert(1) hue-rotate(180deg) brightness(0.78) contrast(0.9) saturate(0.65);
        }
        .leaflet-normal-tiles, .leaflet-satellite-tiles {
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

  const createRiderIcon = (zoom: number, angle: number = 0) => {
    if (!window.L) return null;

    const baseSize = 60;
    const minSize = 40;
    const maxSize = 120;
    const scale = Math.min(Math.max(zoom / 15, 0.6), 1.5);
    const size = Math.min(Math.max(baseSize * scale, minSize), maxSize);

    const shouldFlip = shouldFlipTruck(angle);
    const scaleX = shouldFlip ? -1 : 1;

    return window.L.divIcon({
      className: "custom-leaflet-animated-icon",
      html: `
        <div style="
          width:${size}px;
          height:${size}px;
          display:flex;
          align-items:center;
          justify-content:center;
          transform: scaleX(${scaleX});
          transform-origin: center;
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
      iconAnchor: [size / 2, size - 17],
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
    if (!window.L || !riderMarkerRef.current) return;

    const riderIcon = createRiderIcon(zoom, lastBearingRef.current);
    if (riderIcon) riderMarkerRef.current.setIcon(riderIcon);

    if (customerMarkerRef.current) {
      const newIcon = createCustomerIcon(zoom);
      if (newIcon) customerMarkerRef.current.setIcon(newIcon);
    }
  };

  useEffect(() => {
    if (!order?.address) return;

    let isMounted = true;
    const fetchCoords = async () => {
      try {
        const coords = await getCoordinates(
          order.address.address,
          order.address.city,
          order.address.province,
        );
        if (isMounted && coords) {
          setCoordinates(coords);
        }
      } catch (error) {
        console.error("Error fetching coordinates:", error);
        if (isMounted) {
          setCoordinates({ lat: 13.9419, lng: 121.1644 });
        }
      }
    };

    fetchCoords();
    return () => {
      isMounted = false;
    };
  }, [order]);

  const animateMarkerTo = (
    targetLat: number,
    targetLng: number,
    duration: number = 500,
  ) => {
    if (!mapInstanceRef.current) return;

    if (!riderMarkerRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 15;
      const riderIcon = createRiderIcon(currentZoom, lastBearingRef.current);
      if (riderIcon) {
        riderMarkerRef.current = window.L.marker([targetLat, targetLng], {
          icon: riderIcon,
          zIndexOffset: 1000,
        }).addTo(mapInstanceRef.current);
      }
      return;
    }

    const startPos = riderMarkerRef.current.getLatLng();
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

    const currentZoom = mapInstanceRef.current.getZoom();
    const newIcon = createRiderIcon(currentZoom, angle);
    if (newIcon) {
      riderMarkerRef.current.setIcon(newIcon);
    }

    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentLat = startPos.lat + (targetLat - startPos.lat) * eased;
      const currentLng = startPos.lng + (targetLng - startPos.lng) * eased;

      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([currentLat, currentLng]);
      }

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
    tileLayerRef.current = null;
    labelsLayerRef.current = null;
    riderMarkerRef.current = null;
    customerMarkerRef.current = null;
    polylineRef.current = null;
    isMapCreatedRef.current = false;
  };

  // Initialize map
  useEffect(() => {
    if (!coordinates || !mapRef.current || !isLeafletReady || !storeLocation) {
      return;
    }

    if (isMapCreatedRef.current) {
      return;
    }

    const initMap = async () => {
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

        const map = window.L.map(mapRef.current, {
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: true,
          attributionControl: false,
        });

        const activeConfig = TILE_LAYERS[mapTheme];
        tileLayerRef.current = window.L.tileLayer(
          activeConfig.url,
          activeConfig.options,
        ).addTo(map);

        if (mapTheme === "satellite") {
          const labelsConfig = TILE_LAYERS.satelliteLabels;
          labelsLayerRef.current = window.L.tileLayer(labelsConfig.url, {
            ...labelsConfig.options,
            opacity: 0.6,
          }).addTo(map);
        }

        const initialZoom = map.getZoom();

        const customerIcon = createCustomerIcon(initialZoom);
        if (customerIcon) {
          customerMarkerRef.current = window.L.marker(customerPos, {
            icon: customerIcon,
          }).addTo(map);
          customerMarkerRef.current.setZIndexOffset(500);
        }

        const routePoints = await getRouteGeometry(storeLocation, coordinates);

        polylineRef.current = window.L.polyline(routePoints, {
          color: "#dc2626",
          weight: 5,
          opacity: 0.85,
        }).addTo(map);

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

          const updatedCustomerIcon = createCustomerIcon(currentZoom);
          if (updatedCustomerIcon && customerMarkerRef.current) {
            customerMarkerRef.current.setIcon(updatedCustomerIcon);
          }

          const riderPos = getRiderPosition();

          if (riderPos) {
            const riderIcon = createRiderIcon(
              currentZoom,
              lastBearingRef.current,
            );

            if (riderIcon) {
              riderMarkerRef.current = window.L.marker(
                [riderPos.lat, riderPos.lng],
                {
                  icon: riderIcon,
                  zIndexOffset: 1000,
                },
              ).addTo(map);
            }
          }

          mapInstanceRef.current = map;
          isMapCreatedRef.current = true;
          map.invalidateSize();
        }, 150);

        map.on("zoomend", () => {
          updateMarkerIcons(map.getZoom());
        });
      } catch (error) {
        console.error("Map initialization error:", error);
        isMapCreatedRef.current = false;
      }
    };

    initMap();

    return () => {
      cleanupMap();
    };
  }, [coordinates, isLeafletReady, storeLocation]);

  // Separate effect for theme changes - just updates tiles
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
      labelsLayerRef.current = window.L.tileLayer(labelsConfig.url, {
        ...labelsConfig.options,
        opacity: 0.6,
      }).addTo(map);
    }

    if (polylineRef.current) {
      polylineRef.current.setStyle({
        color: "#dc2626",
      });
    }
  }, [mapTheme]);

  // Update Rider Marker when position state changes
  useEffect(() => {
    const riderPos = getRiderPosition();
    if (riderPos && riderMarkerRef.current) {
      animateMarkerTo(riderPos.lat, riderPos.lng, 300);
    }
  }, [currentRiderPos, order.status]);

  // WebSocket Broadcast Listener
  useEffect(() => {
    if (!order?.id || order.status !== "OUT_FOR_DELIVERY") return;

    const channel = supabase.channel(`rider-location:${order.id}`, {
      config: { broadcast: { ack: true } },
    });

    channel
      .on("broadcast", { event: "location_update" }, (payload) => {
        const { riderLat, riderLng } = payload.payload;
        if (riderLat && riderLng) {
          setCurrentRiderPos({ lat: riderLat, lng: riderLng });

          if (mapInstanceRef.current) {
            animateMarkerTo(riderLat, riderLng, 300);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, order?.status]);

  // Supabase Realtime Database Listener
  useEffect(() => {
    if (!order?.id) return;

    const existingChannel = supabase
      .getChannels()
      .find((ch) => ch.topic === `realtime:order-realtime-${order.id}`);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const channelName = `order-realtime-${order.id}`;
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

        if (status === "OUT_FOR_DELIVERY" && riderLat && riderLng) {
          setCurrentRiderPos({ lat: riderLat, lng: riderLng });

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
