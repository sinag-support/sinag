"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Flag,
  Loader2,
  Package,
  Moon,
  Globe,
  Map,
  User,
  MapPin,
  Ban,
  RotateCcw,
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { useTheme } from "next-themes";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface DeliveryOrder {
  id: string;
  orderNumber: number;
  user: { name: string | null; email: string; phone?: string };
  address: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    lat?: number;
    lng?: number;
    landmark?: string | null;
  };
  payable: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    product: {
      id: string;
      title: string;
      price: number;
      images: string[];
    };
    option?: {
      id: string;
      name: string;
    } | null;
    quantity: number;
    price: number;
  }[];
}

interface DeliveryOrderDetailProps {
  order: DeliveryOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (orderId: string, status: string) => Promise<void>;
  isUpdating: boolean;
}

// Updated store location
const STORE_LOCATION = {
  lat: 14.5995,
  lng: 120.9842,
  name: "123 SINAG Street, Metro Manila, Philippines",
};

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
      maxZoom: 19,
      className: "leaflet-satellite-tiles",
    },
  },
};

function useRiderLocationTracker(
  orderId: string | undefined,
  isTrackingActive: boolean,
) {
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!isTrackingActive || !orderId || !("geolocation" in navigator)) return;

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
        const now = Date.now();
        if (now - lastUpdateRef.current < 3000) return;
        lastUpdateRef.current = now;

        const { latitude, longitude } = position.coords;

        try {
          const { error } = await supabase
            .from("delivery_orders")
            .update({
              rider_lat: latitude,
              rider_lng: longitude,
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (error) {
            console.error("Failed to update rider location:", error.message);
          }
        } catch (err) {
          console.error("Error broadcasting GPS update:", err);
        }
      },
      (error) => {
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

function OrderMap({ order }: { order: DeliveryOrder }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const { theme } = useTheme();
  const [mapTheme, setMapTheme] = useState<"street" | "dark" | "satellite">(
    theme === "dark" ? "dark" : "street",
  );
  const [mapReady, setMapReady] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapError, setMapError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Function to create icons based on zoom level
  const createRiderIcon = (zoom: number) => {
    const baseSize = 80;
    const minSize = 40;
    const maxSize = 120;
    const scale = Math.min(Math.max(zoom / 15, 0.6), 1.5);
    const size = Math.min(Math.max(baseSize * scale, minSize), maxSize);

    return window.L.divIcon({
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
  };

  const createCustomerIcon = (zoom: number) => {
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
    if (riderMarkerRef.current) {
      const newIcon = createRiderIcon(zoom);
      riderMarkerRef.current.setIcon(newIcon);
    }
    if (customerMarkerRef.current) {
      const newIcon = createCustomerIcon(zoom);
      customerMarkerRef.current.setIcon(newIcon);
    }
  };

  useEffect(() => {
    if (theme === "dark") {
      setMapTheme("dark");
    } else {
      setMapTheme("street");
    }
  }, [theme]);

  useEffect(() => {
    if (!order?.address) {
      setMapReady(false);
      return;
    }

    let mounted = true;

    const fetchCoordinates = async () => {
      const coords = await getCoordinates(
        order.address.address,
        order.address.city,
        order.address.province,
      );
      if (mounted) {
        setCoordinates(coords);
      }
    };

    fetchCoordinates();

    return () => {
      mounted = false;
    };
  }, [order]);

  // Initialize map
  useEffect(() => {
    if (!coordinates || !mapRef.current) return;

    // Clean up existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const timer = setTimeout(async () => {
      try {
        if (!mapRef.current) return;

        const customerPos: [number, number] = [
          coordinates.lat,
          coordinates.lng,
        ];
        const storePos: [number, number] = [
          STORE_LOCATION.lat,
          STORE_LOCATION.lng,
        ];

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

        // Get initial zoom level
        const initialZoom = map.getZoom();

        // Create customer marker with initial zoom
        const customerIcon = createCustomerIcon(initialZoom);
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

        // Fit bounds to show both store and customer
        const bounds = window.L.latLngBounds([storePos, customerPos]);
        map.fitBounds(bounds, { padding: [50, 50] });

        // Create rider marker with initial zoom after fitBounds
        const currentZoom = map.getZoom();
        const riderIcon = createRiderIcon(currentZoom);

        const riderMarker = window.L.marker(
          [STORE_LOCATION.lat, STORE_LOCATION.lng],
          {
            icon: riderIcon,
            zIndexOffset: 1000,
          },
        ).addTo(map);

        riderMarkerRef.current = riderMarker;
        riderMarker.bindPopup(
          `<b>Delivery Rider</b><br/>Status: ${order.status}`,
        );

        // Update customer icon to match new zoom
        const updatedCustomerIcon = createCustomerIcon(currentZoom);
        customerMarkerRef.current.setIcon(updatedCustomerIcon);

        mapInstanceRef.current = map;
        setMapReady(true);
        setMapError(false);
        map.invalidateSize();

        // Listen for zoom events to update icons
        map.on("zoomend", () => {
          const zoom = map.getZoom();
          updateMarkerIcons(zoom);
        });
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError(true);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, order, mapTheme]);

  useEffect(() => {
    if (!order?.id) return;

    const channel = supabase
      .channel(`order-realtime-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "delivery_orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const { rider_lat, rider_lng } = payload.new;
          if (rider_lat && rider_lng && riderMarkerRef.current) {
            animateMarkerTo(rider_lat, rider_lng, 1000);
            updateRoute(rider_lat, rider_lng);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, coordinates]);

  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const map = mapInstanceRef.current;
    const activeConfig = TILE_LAYERS[mapTheme];

    map.removeLayer(tileLayerRef.current);
    const newTileLayer = window.L.tileLayer(
      activeConfig.url,
      activeConfig.options,
    ).addTo(map);
    tileLayerRef.current = newTileLayer;

    if (polylineRef.current) {
      polylineRef.current.setStyle({
        color: "#dc2626",
      });
    }
  }, [mapTheme]);

  // Define animateMarkerTo and updateRoute inside component
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

  return (
    <div className="w-full h-full min-h-[400px] md:min-h-[500px] rounded-lg overflow-hidden border border-border shadow-sm relative z-0">
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

      <div ref={mapRef} className="w-full h-full z-0" />
    </div>
  );
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DeliveryOrderDetail({
  order,
  open,
  onOpenChange,
  onStatusUpdate,
  isUpdating,
}: DeliveryOrderDetailProps) {
  const { role } = useRole();

  const isRiderTrackingActive =
    role === "RIDER" && order?.status === "OUT_FOR_DELIVERY";
  useRiderLocationTracker(order?.id, isRiderTrackingActive);

  if (!order) return null;

  // Helper function to check if action buttons should be shown
  const shouldShowActions = () => {
    if (role === "ADMIN") {
      // Admin only sees Cancel button for OUT_FOR_DELIVERY
      return order.status === "OUT_FOR_DELIVERY";
    }
    if (role === "RIDER") {
      // Rider sees buttons for ASSIGNED_RIDER, OUT_FOR_DELIVERY, DELIVERED
      return ["ASSIGNED_RIDER", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
        order.status,
      );
    }
    return false;
  };

  const getActionButtons = () => {
    // ADMIN ACTIONS - Only Cancel for OUT_FOR_DELIVERY
    if (role === "ADMIN" && order.status === "OUT_FOR_DELIVERY") {
      return (
        <Button
          variant="destructive"
          className="w-full font-medium text-sm"
          onClick={() => onStatusUpdate(order.id, "CANCELLED")}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Ban className="mr-2 h-4 w-4" />
          )}
          Cancel Delivery
        </Button>
      );
    }

    // RIDER ACTIONS
    if (role === "RIDER") {
      if (order.status === "ASSIGNED_RIDER") {
        return (
          <Button
            className="w-full font-medium text-sm"
            variant="default"
            onClick={() => onStatusUpdate(order.id, "OUT_FOR_DELIVERY")}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Start Delivery
          </Button>
        );
      }

      if (order.status === "OUT_FOR_DELIVERY") {
        return (
          <div className="flex flex-col gap-2 w-full">
            <Button
              className="w-full font-medium text-sm"
              variant="default"
              onClick={() => onStatusUpdate(order.id, "DELIVERED")}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Mark Delivered
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1 font-medium text-sm"
                onClick={() => onStatusUpdate(order.id, "CANCELLED")}
                disabled={isUpdating}
              >
                <Ban className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="outline"
                className="flex-1 font-medium text-sm text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700 !bg-background"
                onClick={() => onStatusUpdate(order.id, "RETURNED")}
                disabled={isUpdating}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Return
              </Button>
            </div>
          </div>
        );
      }

      if (order.status === "DELIVERED") {
        return (
          <Button
            variant="outline"
            className="w-full font-medium text-sm text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700 !bg-background"
            onClick={() => onStatusUpdate(order.id, "RETURNED")}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Return
          </Button>
        );
      }
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden !bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Delivery Details
          </DialogTitle>
        </DialogHeader>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT COLUMN: Map */}
          <div className="space-y-4">
            <OrderMap order={order} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4 flex flex-col">
            {/* Customer & Address - 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4 !bg-background shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <User className="h-3.5 w-3.5" />
                  Customer
                </div>
                <p className="font-medium text-sm truncate">
                  {order.user?.name || "Guest Customer"}
                </p>
                {order.user?.phone && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.user.phone}
                  </p>
                )}
              </div>

              <div className="border border-border rounded-lg p-4 !bg-background shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Address
                </div>
                <p className="font-medium text-sm truncate">
                  {order.address?.address}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {order.address?.city}, {order.address?.province}
                </p>
                {order.address?.landmark && (
                  <div className="flex items-center gap-1.5 mt-2 p-2 rounded-md bg-muted/50">
                    <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      <span className="font-medium">Landmark:</span>{" "}
                      {order.address.landmark}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="border border-border rounded-lg p-4 !bg-background shadow-sm flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Package className="h-3.5 w-3.5" />
                Order Items ({order.items?.length || 0})
              </div>

              <div className="space-y-2">
                {order.items?.map((item) => {
                  const imageUrl = item.product?.images?.[0] || null;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-xs p-1.5 rounded-md hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-md border border-border overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.product?.title || "Product"}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-foreground truncate">
                            {item.product?.title || "Product"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.option?.name && (
                              <span className="inline-block px-1.5 py-0.2 text-[10px] font-medium bg-muted text-muted-foreground rounded border border-border">
                                {item.option.name}
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="font-semibold text-foreground flex-shrink-0">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                {(!order.items || order.items.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No items found
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Total
                </span>
                <span className="text-lg font-bold text-primary">
                  ₱{order.payable.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            {shouldShowActions() && (
              <div className="space-y-2">{getActionButtons()}</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
