'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MapPin,
  Package,
  Mail,
  User,
  Truck,
  Loader2,
  Moon,
  Globe,
  Map,
} from 'lucide-react'
import { useRole } from '@/hooks/use-role'
import { toast } from 'sonner'
import { createClient } from '@supabase/supabase-js'
import { useTheme } from 'next-themes'

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DeliveryOrder {
  id: string
  orderNumber: number
  user: { name: string | null; email: string; phone?: string }
  rider?: { id: string; name: string | null; email: string } | null
  address: {
    address: string
    city: string
    province: string
    postalCode: string
    lat?: number
    lng?: number
  }
  payable: number
  status: string
  createdAt: string
  items: {
    id: string
    product: {
      id: string
      title: string
      price: number
      images: string[]
    }
    quantity: number
    price: number
  }[]
}

interface DeliveryOrderDetailProps {
  order: DeliveryOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusUpdate: (orderId: string, status: string) => Promise<void>
  isUpdating: boolean
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-indigo-100 text-indigo-800',
  PACKED: 'bg-purple-100 text-purple-800',
  READY_FOR_PICKUP: 'bg-cyan-100 text-cyan-800',
  ASSIGNED_RIDER: 'bg-orange-100 text-orange-800',
  OUT_FOR_DELIVERY: 'bg-pink-100 text-pink-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
}

const STORE_LOCATION = {
  lat: 13.9419,
  lng: 121.1644,
  name: 'iPrime Dispatch Hub',
}

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    },
  },
  dark: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 20,
      subdomains: '',
    },
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
    },
  },
}

// Hook: Streams Rider GPS to Supabase
function useRiderLocationTracker(orderId: string | undefined, isTrackingActive: boolean) {
  const lastUpdateRef = useRef<number>(0)

  useEffect(() => {
    if (!isTrackingActive || !orderId || !('geolocation' in navigator)) return

    let wakeLock: any = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen')
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err)
      }
    }

    requestWakeLock()

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now()
        if (now - lastUpdateRef.current < 3000) return
        lastUpdateRef.current = now

        const { latitude, longitude } = position.coords

        try {
          const { error } = await supabase
            .from('delivery_orders')
            .update({
              rider_lat: latitude,
              rider_lng: longitude,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)

          if (error) {
            console.error('Failed to update rider location:', error.message)
          }
        } catch (err) {
          console.error('Error broadcasting GPS update:', err)
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permissions required for real-time tracking.')
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      if (wakeLock) wakeLock.release().catch(() => {})
    }
  }, [orderId, isTrackingActive])
}

async function getCoordinates(address: string, city: string, province: string) {
  try {
    const headers = {
      'Accept-Language': 'en',
      'User-Agent': 'OrderTrackingApp/1.0',
    }

    const primaryQuery = `${address}, ${city}, ${province}, Philippines`

    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(primaryQuery)}&limit=1`,
      { headers }
    )

    let data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
    }

    const fallbackQuery = `${city}, ${province}, Philippines`

    response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`,
      { headers }
    )

    data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
    }

    return {
      lat: 13.9419,
      lng: 121.1644,
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return {
      lat: 13.9419,
      lng: 121.1644,
    }
  }
}

async function getRouteGeometry(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`

    const res = await fetch(url)
    const data = await res.json()

    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      ) as [number, number][]
    }
  } catch (err) {
    console.error('OSRM route error, falling back to direct line:', err)
  }

  return [
    [start.lat, start.lng],
    [end.lat, end.lng],
  ] as [number, number][]
}

function OrderMap({ order }: { order: DeliveryOrder }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const riderMarkerRef = useRef<any>(null)
  const polylineRef = useRef<any>(null)

  const { theme } = useTheme()
  const [mapTheme, setMapTheme] = useState<'street' | 'dark' | 'satellite'>(
    theme === 'dark' ? 'dark' : 'street'
  )
  const [mapReady, setMapReady] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [mapError, setMapError] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Update map theme when app theme changes
  useEffect(() => {
    if (theme === 'dark') {
      setMapTheme('dark')
    } else {
      setMapTheme('street')
    }
  }, [theme])

  // 1. Load Leaflet and Lottie scripts dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    if (!window.L && !document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => setLeafletLoaded(true)
      script.onerror = () => setMapError(true)
      document.body.appendChild(script)
    } else if (window.L) {
      setLeafletLoaded(true)
    }

    if (!document.getElementById('lottie-player-js')) {
      const lottieScript = document.createElement('script')
      lottieScript.id = 'lottie-player-js'
      lottieScript.src = 'https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs'
      lottieScript.type = 'module'
      document.body.appendChild(lottieScript)
    }
  }, [])

  // 2. Geocode address
  useEffect(() => {
    if (!order?.address) {
      setMapReady(false)
      return
    }

    let isMounted = true

    const fetchCoordinates = async () => {
      const coords = await getCoordinates(
        order.address.address,
        order.address.city,
        order.address.province
      )
      if (isMounted) {
        setCoordinates(coords)
      }
    }

    fetchCoordinates()

    return () => {
      isMounted = false
    }
  }, [order])

  const animateMarkerTo = (targetLat: number, targetLng: number, duration: number = 1000) => {
    if (!riderMarkerRef.current) return

    const startPos = riderMarkerRef.current.getLatLng()
    const startTime = performance.now()

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const currentLat = startPos.lat + (targetLat - startPos.lat) * progress
      const currentLng = startPos.lng + (targetLng - startPos.lng) * progress

      riderMarkerRef.current.setLatLng([currentLat, currentLng])

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }

  const updateRoute = async (currentRiderLat: number, currentRiderLng: number) => {
    if (!coordinates) return
    const newRoute = await getRouteGeometry(
      { lat: currentRiderLat, lng: currentRiderLng },
      coordinates
    )

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(newRoute)
    }
  }

  // 3. Initialize Map Instance
  useEffect(() => {
    if (!leafletLoaded || !coordinates || !mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const timer = setTimeout(async () => {
      try {
        if (!mapRef.current) return

        const customerPos: [number, number] = [coordinates.lat, coordinates.lng]
        const storePos: [number, number] = [STORE_LOCATION.lat, STORE_LOCATION.lng]

        const map = window.L.map(mapRef.current, {
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: false,
          attributionControl: false,
        })

        const activeConfig = TILE_LAYERS[mapTheme]
        const tileLayer = window.L.tileLayer(activeConfig.url, activeConfig.options).addTo(map)
        tileLayerRef.current = tileLayer

        // Store Icon
        const storeIcon = window.L.divIcon({
          className: 'custom-leaflet-animated-icon',
          html: `
            <div style="width:72px;height:72px;display:flex;align-items:center;justify-content:center;">
              <dotlottie-player
                src="/animations/store.json"
                background="transparent"
                speed="1"
                style="width:72px;height:72px;"
                loop
                autoplay
              ></dotlottie-player>
            </div>
          `,
          iconSize: [72, 72],
          iconAnchor: [36, 36],
          popupAnchor: [0, -36],
        })

        const storeMarker = window.L.marker(storePos, { icon: storeIcon }).addTo(map)
        storeMarker.bindPopup(`<b>${STORE_LOCATION.name}</b><br/>Dispatch Point`)

        // Customer Destination Icon
        const customerIcon = window.L.divIcon({
          className: 'custom-leaflet-animated-icon',
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
        })

        const customerMarker = window.L.marker(customerPos, { icon: customerIcon }).addTo(map)
        if (order?.address) {
          customerMarker.bindPopup(`
            <div style="font-size:13px;">
              <strong>Delivery Destination</strong><br/>
              ${order.address.address}<br/>
              ${order.address.city}, ${order.address.province}
            </div>
          `)
        }

        const routePoints = await getRouteGeometry(STORE_LOCATION, coordinates)
        polylineRef.current = window.L.polyline(routePoints, {
          color: mapTheme === 'dark' ? '#60a5fa' : '#3b82f6',
          weight: 5,
          opacity: 0.85,
          dashArray: '8, 8',
        }).addTo(map)

        const bounds = window.L.latLngBounds([storePos, customerPos])
        map.fitBounds(bounds, { padding: [50, 50] })

        // Rider Icon
        const riderIcon = window.L.divIcon({
          className: 'custom-leaflet-animated-icon',
          html: `
            <div style="width:80px;height:80px;display:flex;align-items:center;justify-content:center;">
              <dotlottie-player
                src="/animations/rider.json"
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
        })

        const initialRiderPos: [number, number] = [
          order.address.lat || STORE_LOCATION.lat,
          order.address.lng || STORE_LOCATION.lng,
        ]

        riderMarkerRef.current = window.L.marker(initialRiderPos, {
          icon: riderIcon,
          zIndexOffset: 1000,
        }).addTo(map)

        riderMarkerRef.current.bindPopup(`<b>Delivery Rider</b><br/>Status: ${order.status}`)

        mapInstanceRef.current = map
        setMapReady(true)
        setMapError(false)

        setTimeout(() => map.invalidateSize(), 300)
      } catch (error) {
        console.error('Map initialization error:', error)
        setMapError(true)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded, coordinates, order, mapTheme])

  // 4. Supabase Realtime Listener
  useEffect(() => {
    if (!order?.id) return

    const channel = supabase
      .channel(`order-realtime-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const { rider_lat, rider_lng } = payload.new
          if (rider_lat && rider_lng && riderMarkerRef.current) {
            animateMarkerTo(rider_lat, rider_lng, 1000)
            updateRoute(rider_lat, rider_lng)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [order?.id, coordinates])

  // 5. Handle theme switching
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return

    const map = mapInstanceRef.current
    const activeConfig = TILE_LAYERS[mapTheme]

    map.removeLayer(tileLayerRef.current)
    const newTileLayer = window.L.tileLayer(activeConfig.url, activeConfig.options).addTo(map)
    tileLayerRef.current = newTileLayer
    
    // Update polyline color based on theme
    if (polylineRef.current) {
      polylineRef.current.setStyle({
        color: mapTheme === 'dark' ? '#60a5fa' : '#3b82f6'
      })
    }
  }, [mapTheme])

  return (
    <div className="h-72 md:h-full min-h-[300px] w-full rounded-lg overflow-hidden border shadow-sm relative z-0">
      {/* Map Theme Selector */}
      <div className="absolute top-3 right-3 z-[1000] bg-background/80 backdrop-blur-md p-1 rounded-lg border shadow-md flex gap-1">
        <Button
          size="sm"
          variant={mapTheme === 'street' ? 'default' : 'ghost'}
          onClick={() => setMapTheme('street')}
          className="h-7 text-xs font-medium px-2 gap-1"
        >
          <Map className="w-3.5 h-3.5" />
          Street
        </Button>
        <Button
          size="sm"
          variant={mapTheme === 'dark' ? 'default' : 'ghost'}
          onClick={() => setMapTheme('dark')}
          className="h-7 text-xs font-medium px-2 gap-1"
        >
          <Moon className="w-3.5 h-3.5" />
          Dark
        </Button>
        <Button
          size="sm"
          variant={mapTheme === 'satellite' ? 'default' : 'ghost'}
          onClick={() => setMapTheme('satellite')}
          className="h-7 text-xs font-medium px-2 gap-1"
        >
          <Globe className="w-3.5 h-3.5" />
          Satellite
        </Button>
      </div>

      {!mapReady && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10 p-4 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mb-1" />
          <p className="text-sm text-muted-foreground font-medium">Map unavailable</p>
          <p className="text-xs text-muted-foreground">
            {order.address?.address}, {order.address?.city}
          </p>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full z-0 min-h-[300px]" />
    </div>
  )
}

export function DeliveryOrderDetail({
  order,
  open,
  onOpenChange,
  onStatusUpdate,
  isUpdating,
}: DeliveryOrderDetailProps) {
  const { role } = useRole()

  const isRiderTrackingActive = role === 'RIDER' && order?.status === 'OUT_FOR_DELIVERY'
  useRiderLocationTracker(order?.id, isRiderTrackingActive)

  if (!order) return null

  const getStatusText = () => {
    if (order.status === 'ASSIGNED_RIDER') return 'Start Delivery'
    if (order.status === 'OUT_FOR_DELIVERY') return 'Mark as Delivered'
    if (['PENDING', 'CONFIRMED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP'].includes(order.status)) {
      if (role === 'ADMIN') return 'Assign Rider (go to Orders)'
      return 'Update Status'
    }
    if (order.status === 'DELIVERED') return '✓ Delivered'
    if (order.status === 'CANCELLED') return 'Cancelled'
    if (order.status === 'REFUNDED') return 'Refunded'
    return 'Update Status'
  }

  const isDisabled = () => {
    return (
      order.status === 'DELIVERED' ||
      order.status === 'CANCELLED' ||
      order.status === 'REFUNDED' ||
      isUpdating ||
      (order.status === 'READY_FOR_PICKUP' && role === 'ADMIN')
    )
  }

  const handleUpdate = () => {
    if (order.status === 'ASSIGNED_RIDER') {
      onStatusUpdate(order.id, 'OUT_FOR_DELIVERY')
    } else if (order.status === 'OUT_FOR_DELIVERY') {
      onStatusUpdate(order.id, 'DELIVERED')
    } else if (['PENDING', 'CONFIRMED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP'].includes(order.status)) {
      if (role === 'ADMIN') {
        toast.info('Assign a rider from the Orders page')
      }
    } else {
      toast.info('This order cannot be updated')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Delivery Details
          </DialogTitle>
        </DialogHeader>

        {/* 2-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT COLUMN: Map */}
          <div className="w-full h-full min-h-[300px]">
            <OrderMap order={order} />
          </div>

          {/* RIGHT COLUMN: Delivery Details & Actions */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Order #{order.orderNumber}</span>
                  <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  ₱{order.payable.toFixed(2)}
                </span>
              </div>

              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border rounded-lg p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{order.user?.name || order.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs truncate">{order.user?.email}</span>
                  </div>
                  {order.rider && role === 'ADMIN' && (
                    <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">Rider: {order.rider.name || order.rider.email}</span>
                    </div>
                  )}
                </div>

                <div className="border rounded-lg p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Delivery Address</p>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p>{order.address?.address}</p>
                      <p>{order.address?.city}, {order.address?.province}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items with Images */}
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Items ({order.items?.length || 0})</p>
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => {
                      const imageUrl = item.product?.images?.[0] || null
                      
                      return (
                        <div key={item.id} className="flex items-center gap-3 border-b pb-2 last:border-0">
                          {/* Product Image */}
                          <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-muted border">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.product?.title || 'Product'}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.product?.title || 'Unknown Product'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ₱{item.price.toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          
                          {/* Subtotal */}
                          <span className="text-sm font-semibold whitespace-nowrap">
                            ₱{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No items found</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            {(role === 'ADMIN' || role === 'RIDER') && (
              <Button
                className="w-full font-medium mt-auto"
                onClick={handleUpdate}
                disabled={isDisabled()}
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {getStatusText()}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}