"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Moon, Globe, Map as MapIcon } from "lucide-react";
import { useTheme } from "next-themes";

declare global {
  interface Window {
    L: any;
  }
}

interface FormDataState {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  landmark: string;
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
      maxZoom: 19,
      className: "leaflet-satellite-tiles",
    },
  },
};

async function getCoordinates(address: string, city: string, province: string) {
  try {
    const headers = {
      "Accept-Language": "en",
    };

    if (address.trim() && city.trim()) {
      const primaryQuery = `${address}, ${city}, ${province}, Philippines`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(primaryQuery)}&limit=1`,
        { headers },
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
        }
      }
    }

    if (city.trim()) {
      const fallbackQuery = `${city}, ${province}, Philippines`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`,
        { headers },
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const headers = {
      "Accept-Language": "en",
    };
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers },
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || !data.address) return null;

    const addr = data.address;
    const road =
      addr.road ||
      addr.pedestrian ||
      addr.residential ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.village ||
      addr.hamlet ||
      addr.isolated_dwelling ||
      "";
    const city =
      addr.city || addr.town || addr.municipality || addr.county || "";
    const province = addr.state || addr.region || addr.province || "";
    const postalCode = addr.postcode || "";
    const country = addr.country || "Philippines";

    return {
      address: road,
      city,
      province,
      postalCode,
      country,
    };
  } catch {
    return null;
  }
}

export function AddressMapPicker({
  formData,
  onLocationChange,
  addressChanged,
}: {
  formData: FormDataState;
  onLocationChange: (data: Partial<FormDataState>) => void;
  addressChanged: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const isUserDraggingRef = useRef(false);
  const isProgrammaticMoveRef = useRef(false);
  const initializedFromCoordinatesRef = useRef(false);

  const { theme, resolvedTheme } = useTheme();
  const [mapTheme, setMapTheme] = useState<"street" | "dark" | "satellite">(
    "street",
  );
  const [mapReady, setMapReady] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    const activeTheme = resolvedTheme || theme;
    if (activeTheme === "dark") {
      setMapTheme("dark");
    } else if (activeTheme === "light") {
      setMapTheme("street");
    }
  }, [theme, resolvedTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById("leaflet-smooth-map")) {
      const style = document.createElement("style");
      style.id = "leaflet-smooth-map";
      style.textContent = `
        .leaflet-container {
          background: #e5e7eb;
          overflow: hidden;
        }
        .leaflet-tile {
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .leaflet-fade-anim .leaflet-tile {
          transition: opacity 0.18s linear;
        }
        .leaflet-layer,
        .leaflet-tile-container {
          will-change: transform;
        }
        .leaflet-dark-tiles {
          filter: invert(1) hue-rotate(180deg) brightness(0.78) contrast(0.9) saturate(0.65);
        }
        .leaflet-normal-tiles {
          filter: none;
        }
        .leaflet-satellite-tiles {
          filter: none;
        }
        .custom-lottie-pin {
          background: transparent !important;
          border: none !important;
        }
        @media (max-width: 640px) {
          .leaflet-control-zoom {
            transform: scale(0.9);
            transform-origin: top left;
          }
        }
      `;
      document.head.appendChild(style);
    }

    if (!document.getElementById("lottie-player-js")) {
      const lottieScript = document.createElement("script");
      lottieScript.id = "lottie-player-js";
      lottieScript.src =
        "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
      lottieScript.type = "module";
      document.body.appendChild(lottieScript);
    }

    if (!window.L && !document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        setLeafletLoaded(true);
      };
      script.onerror = () => {
        setMapError(true);
      };
      document.body.appendChild(script);
    } else if (window.L) {
      setLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      let initialCoords: { lat: number; lng: number } | null = null;

      if (formData.latitude !== null && formData.longitude !== null) {
        initialCoords = {
          lat: formData.latitude,
          lng: formData.longitude,
        };
        initializedFromCoordinatesRef.current = true;
      } else {
        initializedFromCoordinatesRef.current = false;
        initialCoords = await getCoordinates(
          formData.address,
          formData.city,
          formData.province,
        );
      }

      if (!isMounted || !mapRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      try {
        const position: [number, number] = initialCoords
          ? [initialCoords.lat, initialCoords.lng]
          : [14.5995, 120.9842];

        const map = window.L.map(mapRef.current, {
          center: position,
          zoom: 16,
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: true,
          attributionControl: false,
          fadeAnimation: true,
          zoomAnimation: true,
          markerZoomAnimation: true,
          inertia: true,
          inertiaDeceleration: 3000,
          easeLinearity: 0.1,
        });

        const activeConfig = TILE_LAYERS[mapTheme];
        const tileLayer = window.L.tileLayer(activeConfig.url, {
          ...activeConfig.options,
          updateWhenZooming: false,
          updateWhenIdle: true,
          keepBuffer: 4,
          crossOrigin: true,
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        map.on("dragstart", () => {
          isUserDraggingRef.current = true;
          isProgrammaticMoveRef.current = false;
          if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = null;
          }
          requestIdRef.current++;
        });

        map.on("drag", () => {
          isUserDraggingRef.current = true;
        });

        map.on("dragend", async () => {
          isUserDraggingRef.current = false;
          if (isProgrammaticMoveRef.current) return;

          const center = map.getCenter();
          setIsGeocoding(true);
          const result = await reverseGeocode(center.lat, center.lng);
          if (!isMounted) return;

          onLocationChange({
            latitude: center.lat,
            longitude: center.lng,
            ...(result?.address ? { address: result.address } : {}),
            ...(result?.city ? { city: result.city } : {}),
            ...(result?.province ? { province: result.province } : {}),
            ...(result?.postalCode ? { postalCode: result.postalCode } : {}),
            ...(result?.country ? { country: result.country } : {}),
          });
          setIsGeocoding(false);
        });

        map.on("moveend", () => {
          if (isProgrammaticMoveRef.current) {
            isProgrammaticMoveRef.current = false;
          }
        });

        mapInstanceRef.current = map;
        setMapReady(true);
        setMapError(false);

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize({ animate: false });
          }
        }, 250);
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError(true);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      tileLayerRef.current = null;
      setMapReady(false);
    };
  }, [leafletLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || !addressChanged) return;

    if (initializedFromCoordinatesRef.current) {
      initializedFromCoordinatesRef.current = false;
      return;
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    const currentRequest = ++requestIdRef.current;
    typingTimerRef.current = setTimeout(async () => {
      const address = formData.address.trim();
      const city = formData.city.trim();
      const province = formData.province.trim();

      if (!address || !city) return;
      if (isUserDraggingRef.current) return;

      setIsGeocoding(true);
      const coords = await getCoordinates(address, city, province);

      if (currentRequest !== requestIdRef.current) {
        setIsGeocoding(false);
        return;
      }

      if (!coords || !mapInstanceRef.current) {
        setIsGeocoding(false);
        return;
      }

      if (isUserDraggingRef.current) {
        setIsGeocoding(false);
        return;
      }

      const map = mapInstanceRef.current;
      const target = window.L.latLng(coords.lat, coords.lng);
      const currentCenter = map.getCenter();
      const distance = currentCenter.distanceTo(target);

      if (distance > 25) {
        isProgrammaticMoveRef.current = true;
        map.stop();
        map.flyTo(target, map.getZoom(), {
          animate: true,
          duration: 1.5,
          easeLinearity: 0.08,
          noMoveStart: true,
        });
        onLocationChange({
          latitude: coords.lat,
          longitude: coords.lng,
        });
      }

      setIsGeocoding(false);
    }, 1100);

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [
    addressChanged,
    formData.address,
    formData.city,
    formData.province,
    mapReady,
  ]);

  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const map = mapInstanceRef.current;
    const activeConfig = TILE_LAYERS[mapTheme];
    const oldTileLayer = tileLayerRef.current;
    const newTileLayer = window.L.tileLayer(activeConfig.url, {
      ...activeConfig.options,
      updateWhenZooming: false,
      updateWhenIdle: true,
      keepBuffer: 4,
      crossOrigin: true,
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;

    newTileLayer.once("load", () => {
      if (map.hasLayer(oldTileLayer)) {
        map.removeLayer(oldTileLayer);
      }
    });

    const fallbackTimer = setTimeout(() => {
      if (map.hasLayer(oldTileLayer) && tileLayerRef.current === newTileLayer) {
        map.removeLayer(oldTileLayer);
      }
    }, 8000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [mapTheme]);

  if (mapError) {
    return (
      <div className="w-full h-full min-h-[260px] bg-muted flex flex-col items-center justify-center rounded-md">
        <MapIcon className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Map unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-md overflow-hidden bg-muted">
      {mapReady && !mapError && (
        <div className="absolute top-2 right-2 z-[1000] bg-background/85 backdrop-blur-md p-1 rounded-lg border shadow-md flex gap-1">
          <Button
            size="sm"
            type="button"
            variant={mapTheme === "street" ? "default" : "ghost"}
            onClick={() => setMapTheme("street")}
            className="h-6 text-[10px] font-medium px-1.5 gap-0.5"
          >
            <MapIcon className="w-3 h-3" />
            Street
          </Button>
          <Button
            size="sm"
            type="button"
            variant={mapTheme === "dark" ? "default" : "ghost"}
            onClick={() => setMapTheme("dark")}
            className="h-6 text-[10px] font-medium px-1.5 gap-0.5"
          >
            <Moon className="w-3 h-3" />
            Dark
          </Button>
          <Button
            size="sm"
            type="button"
            variant={mapTheme === "satellite" ? "default" : "ghost"}
            onClick={() => setMapTheme("satellite")}
            className="h-6 text-[10px] font-medium px-1.5 gap-0.5"
          >
            <Globe className="w-3 h-3" />
            Satellite
          </Button>
        </div>
      )}

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {mapReady && (
        <div className="absolute inset-0 pointer-events-none z-[999] flex items-center justify-center">
          <div className="relative -mt-8 flex items-center justify-center">
            <div
              className="flex items-center justify-center"
              dangerouslySetInnerHTML={{
                __html: `
                  <dotlottie-player
                    src="/animations/location.json"
                    background="transparent"
                    speed="1"
                    style="width:64px;height:64px;"
                    loop
                    autoplay
                  ></dotlottie-player>
                `,
              }}
            />
          </div>
        </div>
      )}

      {isGeocoding && mapReady && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-background/90 backdrop-blur-sm border rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Detecting location...</span>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full min-h-[280px]" />
    </div>
  );
}
