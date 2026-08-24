'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { X, Calendar, Package, Truck, CheckCircle, XCircle, Clock, MapPin, CreditCard } from 'lucide-react'
import { useMediaQuery } from 'react-responsive'

declare global {
  interface Window {
    L: any
  }
}

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

interface Order {
  id: string
  orderNumber: string
  date: string
  status: 'pending' | 'confirmed' | 'preparing' | 'packed' | 'ready_for_pickup' | 'assigned_rider' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded'
  total: number
  items: OrderItem[]
  shippingAddress: string
  paymentMethod: string
  location?: {
    lat: number
    lng: number
  }
}

interface OrderDetailSheetProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusColors = {
  pending: 'bg-[#8EC801]/10 text-[#429801] border-[#8EC801]/20',
  confirmed: 'bg-[#8EC801]/10 text-[#429801] border-[#8EC801]/20',
  preparing: 'bg-[#8EC801]/10 text-[#429801] border-[#8EC801]/20',
  packed: 'bg-[#8EC801]/10 text-[#429801] border-[#8EC801]/20',
  ready_for_pickup: 'bg-[#8EC801]/10 text-[#429801] border-[#8EC801]/20',
  assigned_rider: 'bg-[#8EC801]/10 text-[#429801] border-[#8EC801]/20',
  out_for_delivery: 'bg-[#8EC801]/10 text-[#429801] border-[#8EC801]/20',
  delivered: 'bg-[#8EC801]/10 text-[#429801] border-[#8EC801]/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  refunded: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

const statusIcons = {
  pending: Clock,
  confirmed: Package,
  preparing: Package,
  packed: Package,
  ready_for_pickup: Truck,
  assigned_rider: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: XCircle,
}

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  packed: 'Packed',
  ready_for_pickup: 'Ready for Pickup',
  assigned_rider: 'Assigned Rider',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

function OrderDetailContent({ order, loading, onClose }: { order: Order | null; loading: boolean; onClose: () => void }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!order?.location || !mapRef.current || mapInstanceRef.current) return

    const loadMap = async () => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => {
        if (window.L && mapRef.current) {
          const position: [number, number] = [order.location!.lat, order.location!.lng]
          
          const map = window.L.map(mapRef.current, {
            center: position,
            zoom: 14,
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
          })

          window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 20,
          }).addTo(map)

          window.L.marker(position).addTo(map)
          mapInstanceRef.current = map
        }
      }
      document.body.appendChild(script)
    }

    loadMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [order])

  if (loading) {
    return (
      <div className="flex-1 space-y-4">
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <Separator />
          <Skeleton className="h-5 w-24" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    )
  }

  const StatusIcon = statusIcons[order.status] || Clock
  const statusColor = statusColors[order.status] || 'bg-gray-500/10 text-gray-600 border-gray-200'
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="w-full">
      {/* Edge-to-Edge Map Header */}
      {order.location && (
        <div className="relative w-full h-48 bg-muted">
          <div ref={mapRef} className="w-full h-full z-0" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/90 px-3 py-1 rounded-full text-xs shadow-sm z-10">
            📍 Delivery Location
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h2>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(order.date).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>

            {/* Pushed completely to the right */}
            <Badge className={`${statusColor} inline-flex items-center border px-2.5 py-0.5 text-xs font-medium shrink-0`}>
              <StatusIcon className="h-3.5 w-3.5 mr-1" />
              {statusLabels[order.status]}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Items */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Summary */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>₱0.00</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₱{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Delivery & Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm mb-1 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Shipping Address
            </h4>
            <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Payment Method
            </h4>
            <p className="text-sm text-muted-foreground">{order.paymentMethod}</p>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <Button className="w-full" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export function OrderDetailSheet({ order, open, onOpenChange }: OrderDetailSheetProps) {
  const isDesktop = useMediaQuery({ minWidth: 1024 })
  const [loading, setLoading] = useState(false)

  if (!isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh] rounded-t-2xl p-0 overflow-hidden">
          <div className="relative h-full flex flex-col">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-3 top-3 z-50 p-2 rounded-full bg-background/90 hover:bg-background transition-colors shadow-md border"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
              <OrderDetailContent order={order} loading={loading} onClose={() => onOpenChange(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden rounded-xl border-0 shadow-2xl [&>button]:hidden"
      >
        <div className="relative max-h-[85vh] flex flex-col">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-50 p-2 rounded-full bg-background/90 hover:bg-background transition-colors shadow-md border"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
            <OrderDetailContent order={order} loading={loading} onClose={() => onOpenChange(false)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}