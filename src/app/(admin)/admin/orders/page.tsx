'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRole } from '@/hooks/use-role'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Eye, RefreshCw, Search, Package, ShoppingBag, User, Calendar, CreditCard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const statusOptions = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP',
  'ASSIGNED_RIDER', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'
]

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

interface OrderItem {
  id: string
  productId: string
  product: {
    title: string
    price: number
    images: string[]
  }
  quantity: number
  price: number
  discount: number
}

interface Order {
  id: string
  orderNumber: number
  user: { name: string | null; email: string }
  total: number
  payable: number
  status: string
  createdAt: string
  isPaid: boolean
  address?: { address: string; city: string; province: string }
  items?: OrderItem[]
}

export default function OrdersPage() {
  const { role } = useRole()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      const data = await res.json()
      setOrders(data)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [search, statusFilter])

  const fetchOrderDetail = async (orderId: string) => {
    setDetailOpen(true)
    setLoadingDetail(true)
    setSelectedOrder(null)
    
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`)
      const data = await res.json()
      setSelectedOrder(data)
    } catch (error) {
      console.error('Failed to load order details:', error)
      toast.error('Failed to load order details')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success('Order status updated')
        fetchOrders()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to update')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const getStatusActions = (order: Order) => {
    if (role === 'ADMIN') {
      return (
        <Select
          value={order.status}
          onValueChange={(val: string | null) => val && handleStatusUpdate(order.id, val)}
        >
          <SelectTrigger className="w-40 h-8">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(s => (
              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
    if (role === 'STAFF') {
      const allowedNext: Record<string, string[]> = {
        PENDING: ['CONFIRMED'],
        CONFIRMED: ['PREPARING'],
        PREPARING: ['PACKED'],
        PACKED: ['READY_FOR_PICKUP'],
      }
      const nextOptions = allowedNext[order.status as keyof typeof allowedNext] || []
      return (
        <div className="flex gap-1 flex-wrap">
          {nextOptions.map(s => (
            <Button
              key={s}
              size="sm"
              variant="outline"
              onClick={() => handleStatusUpdate(order.id, s)}
            >
              {s.replace('_', ' ')}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">{order.status.replace('_', ' ')}</span>
        </div>
      )
    }
    if (role === 'RIDER') {
      if (order.status === 'ASSIGNED_RIDER') {
        return (
          <Button
            size="sm"
            variant="default"
            onClick={() => handleStatusUpdate(order.id, 'OUT_FOR_DELIVERY')}
          >
            Start Delivery
          </Button>
        )
      }
      if (order.status === 'OUT_FOR_DELIVERY') {
        return (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
          >
            Mark Delivered
          </Button>
        )
      }
      return <Badge variant="outline">{order.status.replace('_', ' ')}</Badge>
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">
          {role === 'ADMIN' && 'Full order management'}
          {role === 'STAFF' && 'Process orders (update status)'}
          {role === 'RIDER' && 'Manage your deliveries'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order number or customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(val: string | null) => setStatusFilter(val || 'ALL')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {statusOptions.map(s => (
              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchOrders} className="ml-auto">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search ? 'No orders found matching your search' : 'No orders found'}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                    <TableCell>{order.user.name || order.user.email}</TableCell>
                    <TableCell>₱{order.payable.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.isPaid ? 'default' : 'secondary'}>
                        {order.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => fetchOrderDetail(order.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {getStatusActions(order)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open: boolean) => setDetailOpen(open)}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              Order #{selectedOrder?.orderNumber || '...'}
            </DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <OrderDetailSkeleton />
          ) : selectedOrder && (
            <div className="space-y-6 py-2">
              {/* Order Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <User className="h-3 w-3" />
                    Customer
                  </div>
                  <p className="font-medium text-sm truncate">{selectedOrder.user.name || selectedOrder.user.email}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <CreditCard className="h-3 w-3" />
                    Payment
                  </div>
                  <p className="font-medium text-sm">{selectedOrder.isPaid ? 'Paid' : 'Unpaid'}</p>
                  <p className="text-xs text-muted-foreground">₱{selectedOrder.payable.toFixed(2)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    Date
                  </div>
                  <p className="font-medium text-sm">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Badge className={statusColors[selectedOrder.status] + ' text-xs px-2 py-0'}>
                      {selectedOrder.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">Status</p>
                </div>
              </div>

              {/* Address */}
              {selectedOrder.address && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Delivery Address</p>
                  <p className="text-sm">{selectedOrder.address.address}, {selectedOrder.address.city}, {selectedOrder.address.province}</p>
                </div>
              )}

              {/* Order Items with Images */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Items ({selectedOrder.items?.length || 0})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[280px]">Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item) => {
                          const imageUrl = item.product?.images?.[0] || null

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {imageUrl ? (
                                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border bg-white">
                                      <Image
                                        src={imageUrl}
                                        alt={item.product?.title || 'Product'}
                                        width={48}
                                        height={48}
                                        className="h-full w-full object-cover"
                                        unoptimized={imageUrl.startsWith('http')}
                                        onError={(e) => {
                                          // If image fails, hide it and show fallback
                                          const parent = e.currentTarget.parentElement
                                          if (parent) {
                                            parent.style.display = 'none'
                                            const fallback = parent.parentElement?.querySelector('.fallback-icon')
                                            if (fallback) {
                                              fallback.classList.remove('hidden')
                                            }
                                          }
                                        }}
                                      />
                                      <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center bg-muted">
                                        <Package className="h-5 w-5 text-muted-foreground" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border bg-muted">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span className="font-medium truncate">{item.product?.title || 'Unknown Product'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">×{item.quantity}</TableCell>
                              <TableCell className="text-right">₱{item.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium">₱{(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No items found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                    <TableHeader>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                        <TableCell className="text-right font-bold">₱{selectedOrder.payable.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Order Detail Skeleton Component
function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 py-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>

      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableHeader>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                <TableCell className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        </div>
      </div>
    </div>
  )
}