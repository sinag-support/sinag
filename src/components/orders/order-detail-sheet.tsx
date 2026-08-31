"use client";

import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
} from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { useTheme } from "next-themes";
import { createClient } from "@supabase/supabase-js";

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

const STORE_LOCATION = {
  lat: 14.5995,
  lng: 120.9842,
  name: "SINAG Store",
};

const TILE_LAYERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
    },
  },
  dark: {
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    options: {
      maxZoom: 20,
      subdomains: "",
    },
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
    },
  },
  // ✅ Add satelliteLabels
  satelliteLabels: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
    },
  },
};

async function getCoordinates(address: string, city: string, province: string) {
  try {
    const headers = {
      "Accept-Language": "en",
      "User-Agent": "OrderTrackingApp/1.0",
    };

    const primaryQuery = `${address}, ${city}, ${province}, Philippines`;

    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(primaryQuery)}&limit=1`,
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
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`,
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

function OrderDetailContent({
  order,
  loading,
  onClose,
}: {
  order: any;
  loading: boolean;
  onClose: () => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const leafletLoadedRef = useRef(false);

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
  const [mapReady, setMapReady] = useState(false); // ✅ Added missing state

  // Set initial map theme based on device theme
  useEffect(() => {
    const currentTheme = resolvedTheme || theme || "light";
    if (currentTheme === "dark") {
      setMapTheme("dark");
    } else {
      setMapTheme("street");
    }
  }, [theme, resolvedTheme]);

  // Load Leaflet scripts
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

  // Add dark theme CSS filter
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
    if (!order?.address) {
      setMapReady(false);
      return;
    }

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

  // Clean up map function
  const cleanupMap = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
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
  };

  // Initialize map - runs when coordinates are ready AND Leaflet is loaded
  useEffect(() => {
    if (!coordinates || !mapRef.current || !isLeafletReady) return;
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
          STORE_LOCATION.lat,
          STORE_LOCATION.lng,
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

        // ✅ Add labels overlay for satellite theme
        if (mapTheme === "satellite") {
          const labelsConfig = TILE_LAYERS.satelliteLabels;
          const labelsLayer = window.L.tileLayer(labelsConfig.url, {
            ...labelsConfig.options,
            opacity: 0.6,
          }).addTo(map);
          labelsLayerRef.current = labelsLayer;
        }

        const initialZoom = map.getZoom();

        // Create customer marker
        const customerIcon = window.L.divIcon({
          className: "custom-leaflet-animated-icon",
          html: `
            <div style="width:64px;height:64px;display:flex;align-items:center;justify-content:center;">
              <dotlottie-player
                src="/animations/location.json"
                background="transparent"
                speed="1"
                style="width:64px;height:64px;"
                loop
                autoplay
              ></dotlottie-player>
            </div>
          `,
          iconSize: [64, 64],
          iconAnchor: [32, 64],
          popupAnchor: [0, -64],
        });

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

        // Get route from store to customer
        const routePoints = await getRouteGeometry(STORE_LOCATION, coordinates);
        polylineRef.current = window.L.polyline(routePoints, {
          color: "#dc2626",
          weight: 5,
          opacity: 0.85,
        }).addTo(map);

        const bounds = window.L.latLngBounds([storePos, customerPos]);
        map.fitBounds(bounds, { padding: [50, 50] });

        setTimeout(() => {
          const currentZoom = map.getZoom();

          // Create rider marker
          const riderIcon = window.L.divIcon({
            className: "custom-leaflet-animated-icon",
            html: `
              <div style="width:80px;height:80px;display:flex;align-items:center;justify-content:center;">
                <dotlottie-player
                  src="/animations/truck.json"
                  background="transparent"
                  speed="1"
                  style="width:80px;height:80px;"
                  loop
                  autoplay
                ></dotlottie-player>
              </div>
            `,
            iconSize: [80, 80],
            iconAnchor: [40, 40],
            popupAnchor: [0, -40],
          });

          // Set initial rider position - use real location if available, otherwise start at store
          const initialRiderLat = order?.riderLat || STORE_LOCATION.lat;
          const initialRiderLng = order?.riderLng || STORE_LOCATION.lng;

          const riderMarker = window.L.marker(
            [initialRiderLat, initialRiderLng],
            {
              icon: riderIcon,
              zIndexOffset: 1000,
            },
          ).addTo(map);

          riderMarkerRef.current = riderMarker;
          riderMarker.bindPopup(
            `<b>Delivery Rider</b><br/>Status: ${order.status}`,
          );

          mapInstanceRef.current = map;
          setMapReady(true);
          map.invalidateSize();
        }, 100);

        map.on("zoomend", () => {
          const currentZoom = map.getZoom();
          // Update marker sizes on zoom
          if (riderMarkerRef.current) {
            const size = Math.min(Math.max((currentZoom / 15) * 80, 40), 120);
            const riderIcon = window.L.divIcon({
              className: "custom-leaflet-animated-icon",
              html: `
                <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;transition: all 0.2s ease;">
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
              iconAnchor: [size / 2, size / 2],
              popupAnchor: [0, -(size / 2)],
            });
            riderMarkerRef.current.setIcon(riderIcon);
          }
          if (customerMarkerRef.current) {
            const size = Math.min(Math.max((currentZoom / 15) * 64, 32), 96);
            const customerIcon = window.L.divIcon({
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
            customerMarkerRef.current.setIcon(customerIcon);
          }
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
  }, [coordinates, order, mapTheme, isLeafletReady]);

  // ✅ Real-time subscription for rider location updates (Customer view)
  useEffect(() => {
    if (!order?.id) return;

    // Only subscribe if order status is OUT_FOR_DELIVERY or ASSIGNED_RIDER
    if (!["OUT_FOR_DELIVERY", "ASSIGNED_RIDER"].includes(order.status)) return;

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

          // Update rider marker if location exists
          if (riderLat && riderLng && riderMarkerRef.current) {
            animateMarkerTo(riderLat, riderLng, 1000);
            updateRoute(riderLat, riderLng);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, coordinates]);

  // Animate rider marker
  const animateMarkerTo = (
    targetLat: number,
    targetLng: number,
    duration: number = 1000,
  ) => {
    if (!riderMarkerRef.current) return;

    const startPos = riderMarkerRef.current.getLatLng();
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

  // Update route from rider's current position to destination
  const updateRoute = async (
    currentRiderLat: number,
    currentRiderLng: number,
  ) => {
    if (!coordinates) return;
    const newRoute = await getRouteGeometry(
      { lat: currentRiderLat, lng: currentRiderLng },
      coordinates,
    );

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(newRoute);
    }
  };

  // When theme changes, update layers
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current || !window.L) return;

    const map = mapInstanceRef.current;
    const activeConfig = TILE_LAYERS[mapTheme];

    // Update base layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newTileLayer = window.L.tileLayer(
      activeConfig.url,
      activeConfig.options,
    ).addTo(map);
    tileLayerRef.current = newTileLayer;

    // Update labels overlay
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupMap();
    };
  }, []);

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
    REFUNDED: XCircle,
  };

  const StatusIcon = statusIcons[order.status] || Clock;
  const statusColor =
    statusColors[order.status] ||
    "bg-gray-500/10 text-gray-600 border-gray-200";

  return (
    <div className="w-full flex flex-col lg:flex-row min-h-0 h-full">
      <div className="relative w-full lg:w-[50%] h-64 lg:h-full lg:min-h-[400px] bg-muted overflow-hidden shrink-0">
        {/* Theme switcher */}
        <div className="absolute top-3 right-3 z-[1000] bg-background/90 backdrop-blur-md p-1 rounded-md border border-border shadow-sm flex gap-1">
          <Button
            size="sm"
            variant={mapTheme === "street" ? "default" : "ghost"}
            onClick={() => setMapTheme("street")}
            className="h-7 text-xs font-medium px-2.5 gap-1"
          >
            <Map className="w-3.5 h-3.5" />
            Street
          </Button>
          <Button
            size="sm"
            variant={mapTheme === "dark" ? "default" : "ghost"}
            onClick={() => setMapTheme("dark")}
            className="h-7 text-xs font-medium px-2.5 gap-1"
          >
            <Moon className="w-3.5 h-3.5" />
            Dark
          </Button>
          <Button
            size="sm"
            variant={mapTheme === "satellite" ? "default" : "ghost"}
            onClick={() => setMapTheme("satellite")}
            className="h-7 text-xs font-medium px-2.5 gap-1"
          >
            <Globe className="w-3.5 h-3.5" />
            Satellite
          </Button>
        </div>

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

        <div className="pt-2 pb-4">
          <Button className="w-full" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OrderDetailSheet({ order, open, onOpenChange }: any) {
  const isDesktop = useMediaQuery({
    minWidth: 1024,
  });

  if (!isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="!h-[80vh] !max-h-[80vh] !min-h-0 rounded-t-2xl p-0 gap-0 overflow-hidden"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-xl border-0 shadow-2xl [&>button]:hidden">
        <div className="relative max-h-[70vh] flex flex-col">
          <div className="flex-1 overflow-hidden min-h-0">
            <OrderDetailContent
              order={order}
              loading={false}
              onClose={() => onOpenChange(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
