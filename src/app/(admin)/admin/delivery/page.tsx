'use client'

import { useEffect, useState } from 'react'
import { useRole } from '@/hooks/use-role'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  MapPin,
  Package,
  CheckCircle,
  Search,
  RefreshCw,
  Navigation,
  Mail,
  User,
  Truck,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import dynamic from 'next/dynamic'

// ✅ Import Leaflet CSS only (this is safe for SSR)
import 'leaflet/dist/leaflet.css'

// ✅ Dynamically import all Leaflet components with ssr: false
const MapContainer = dynamic<{
  center: [number, number]
  zoom: number
  style: React.CSSProperties
  children: React.ReactNode
}>(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic<any>(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic<any>(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Polyline = dynamic<any>(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)

const Popup = dynamic<any>(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

// ✅ Only import Leaflet icons on the client
let L: any
let riderIcon: any
let destinationIcon: any

// This runs only on the client
if (typeof window !== 'undefined') {
  // Dynamically import Leaflet
  import('leaflet').then((module) => {
    L = module.default

    // Fix default marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })

    riderIcon = new L.Icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })

    destinationIcon = new L.Icon({
      iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
  })
}

interface DeliveryOrder {
  id: string
  orderNumber: number
  user: { name: string | null; email: string; phone?: string }
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

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'Lipa City': { lat: 13.9411, lng: 121.1633 },
  'Batangas City': { lat: 13.7565, lng: 121.0583 },
  'Tanauan': { lat: 14.0863, lng: 121.1499 },
  'Santo Tomas': { lat: 14.1079, lng: 121.1412 },
  'Malvar': { lat: 14.0431, lng: 121.1331 },
  'Bauan': { lat: 13.7916, lng: 121.0088 },
  'San Jose': { lat: 13.8781, lng: 121.1063 },
}

const RIDER_LOCATION = { lat: 13.9500, lng: 121.1500 }

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

export default function DeliveryPage() {
  const { role } = useRole()
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchDeliveryOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (role === 'RIDER') {
        params.append('status', 'ASSIGNED_RIDER,OUT_FOR_DELIVERY')
      }
      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      const data = await res.json()
      const ordersWithCoords = data.map((order: DeliveryOrder) => ({
        ...order,
        address: {
          ...order.address,
          lat: cityCoordinates[order.address?.city]?.lat || 13.9411,
          lng: cityCoordinates[order.address?.city]?.lng || 121.1633,
        },
      }))
      setOrders(ordersWithCoords)
    } catch {
      toast.error('Failed to load delivery orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliveryOrders()
  }, [role])

  const updateStatus = async (orderId: string, status: string) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success('Delivery status updated')
        fetchDeliveryOrders()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to update')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const searchLower = search.toLowerCase()
    return (
      order.orderNumber.toString().includes(search) ||
      order.user?.name?.toLowerCase().includes(searchLower) ||
      order.user?.email?.toLowerCase().includes(searchLower) ||
      order.address?.city?.toLowerCase().includes(searchLower)
    )
  })

  const totalOrders = orders.length
  const assignedOrders = orders.filter((o) => o.status === 'ASSIGNED_RIDER').length
  const outForDelivery = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length

  const OrderMap = ({ order }: { order: DeliveryOrder }) => {
    if (!isMounted) return null

    const destination = {
      lat: order.address?.lat || 13.9411,
      lng: order.address?.lng || 121.1633,
    }

    const iconRider = riderIcon
    const iconDest = destinationIcon

    return (
      <div className="h-64 w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={[RIDER_LOCATION.lat, RIDER_LOCATION.lng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {iconRider && (
            <Marker position={[RIDER_LOCATION.lat, RIDER_LOCATION.lng]} icon={iconRider}>
              <Popup>📍 Rider Location</Popup>
            </Marker>
          )}
          {iconDest && (
            <Marker position={[destination.lat, destination.lng]} icon={iconDest}>
              <Popup>
                📦 Delivery: {order.address?.address}
                <br />
                {order.address?.city}, {order.address?.province}
              </Popup>
            </Marker>
          )}
          <Polyline
            positions={[
              [RIDER_LOCATION.lat, RIDER_LOCATION.lng],
              [destination.lat, destination.lng],
            ]}
            color="#3b82f6"
            weight={3}
            opacity={0.8}
            dashArray="8, 8"
          />
        </MapContainer>
      </div>
    )
  }

  if (loading) {
    return <DeliverySkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Delivery Management</h1>
        <p className="text-muted-foreground">
          {role === 'ADMIN'
            ? 'Manage all deliveries'
            : role === 'RIDER'
            ? 'Manage your assigned deliveries'
            : 'Delivery management'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All deliveries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedOrders}</div>
            <p className="text-xs text-muted-foreground">Ready to pick up</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out for Delivery</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outForDelivery}</div>
            <p className="text-xs text-muted-foreground">On the way</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order #, customer, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={fetchDeliveryOrders}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search ? 'No deliveries found matching your search' : 'No deliveries found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                  <TableCell>{order.user?.name || order.user?.email}</TableCell>
                  <TableCell>{order.address?.city}</TableCell>
                  <TableCell>₱{order.payable.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(order)
                        setDetailOpen(true)
                      }}
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>

                    {/* Rider actions */}
                    {role === 'RIDER' && order.status === 'ASSIGNED_RIDER' && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Delivery'}
                      </Button>
                    )}
                    {role === 'RIDER' && order.status === 'OUT_FOR_DELIVERY' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white font-medium"
                        onClick={() => updateStatus(order.id, 'DELIVERED')}
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark Delivered'}
                      </Button>
                    )}

                    {/* Admin actions */}
                    {role === 'ADMIN' && order.status === 'ASSIGNED_RIDER' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')}
                        disabled={isUpdating}
                      >
                        Start
                      </Button>
                    )}
                    {role === 'ADMIN' && order.status === 'OUT_FOR_DELIVERY' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() => updateStatus(order.id, 'DELIVERED')}
                        disabled={isUpdating}
                      >
                        Complete
                      </Button>
                    )}

                    {/* Admin: Assign Rider button for pending/preparing statuses */}
                    {role === 'ADMIN' &&
                      ['PENDING', 'CONFIRMED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP'].includes(
                        order.status
                      ) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-600 hover:bg-orange-50 hover:text-orange-700"
                          onClick={() => updateStatus(order.id, 'ASSIGNED_RIDER')}
                          disabled={isUpdating}
                        >
                          Assign Rider
                        </Button>
                      )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Dialog with Map */}
      <Dialog open={detailOpen} onOpenChange={(open: boolean) => setDetailOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Delivery Details
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Order #{selectedOrder.orderNumber}</span>
                  <Badge className={statusColors[selectedOrder.status] || 'bg-gray-100 text-gray-800'}>
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  ₱{selectedOrder.payable.toFixed(2)}
                </span>
              </div>

              {/* Map - only rendered on client */}
              {isMounted && <OrderMap order={selectedOrder} />}

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedOrder.user?.name || selectedOrder.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs truncate">{selectedOrder.user?.email}</span>
                  </div>
                </div>
                <div className="border rounded-lg p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Delivery Address</p>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p>{selectedOrder.address?.address}</p>
                      <p>{selectedOrder.address?.city}, {selectedOrder.address?.province}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Items ({selectedOrder.items?.length || 0})</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm border-b pb-1">
                        <span>{item.product?.title || 'Unknown Product'}</span>
                        <span className="text-muted-foreground">×{item.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No items found</p>
                  )}
                </div>
              </div>

              {/* ✅ FIXED: Button for all statuses */}
              {(role === 'ADMIN' || role === 'RIDER') && (
                <Button
                  className="w-full font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    if (selectedOrder.status === 'ASSIGNED_RIDER') {
                      updateStatus(selectedOrder.id, 'OUT_FOR_DELIVERY')
                    } else if (selectedOrder.status === 'OUT_FOR_DELIVERY') {
                      updateStatus(selectedOrder.id, 'DELIVERED')
                    } else if (
                      ['PENDING', 'CONFIRMED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP'].includes(
                        selectedOrder.status
                      )
                    ) {
                      updateStatus(selectedOrder.id, 'ASSIGNED_RIDER')
                    } else {
                      toast.info('This order cannot be updated')
                    }
                  }}
                  disabled={
                    selectedOrder.status === 'DELIVERED' ||
                    selectedOrder.status === 'CANCELLED' ||
                    selectedOrder.status === 'REFUNDED' ||
                    isUpdating
                  }
                >
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedOrder.status === 'ASSIGNED_RIDER' && 'Start Delivery'}
                  {selectedOrder.status === 'OUT_FOR_DELIVERY' && 'Mark as Delivered'}
                  {['PENDING', 'CONFIRMED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP'].includes(
                    selectedOrder.status
                  ) && 'Assign Rider'}
                  {selectedOrder.status === 'DELIVERED' && '✓ Delivered'}
                  {selectedOrder.status === 'CANCELLED' && 'Cancelled'}
                  {selectedOrder.status === 'REFUNDED' && 'Refunded'}
                  {![
                    'ASSIGNED_RIDER',
                    'OUT_FOR_DELIVERY',
                    'DELIVERED',
                    'CANCELLED',
                    'REFUNDED',
                    'PENDING',
                    'CONFIRMED',
                    'PREPARING',
                    'PACKED',
                    'READY_FOR_PICKUP',
                  ].includes(selectedOrder.status) && 'Update Status'}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DeliverySkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}