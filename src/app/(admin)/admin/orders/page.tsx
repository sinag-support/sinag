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
import { 
  Eye, RefreshCw, Search, Package, ShoppingBag, User, Calendar, CreditCard, 
  ChevronLeft, ChevronRight, UserCog, Loader2, Pencil, Trash2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'

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

interface Rider {
  id: string
  name: string | null
  email: string
}

interface Order {
  id: string
  orderNumber: number
  user: { name: string | null; email: string }
  rider?: Rider | null
  total: number
  payable: number
  status: string
  createdAt: string
  isPaid: boolean
  address?: { address: string; city: string; province: string }
  items?: OrderItem[]
}

interface PaginatedResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function OrdersPage() {
  const { role } = useRole()
  const [orders, setOrders] = useState<Order[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRiders, setLoadingRiders] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  
  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editStatus, setEditStatus] = useState<string>('')
  const [editRiderId, setEditRiderId] = useState<string>('')
  const [updating, setUpdating] = useState(false)

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchRiders = async () => {
    if (role !== 'ADMIN') return
    setLoadingRiders(true)
    try {
      const res = await fetch('/api/admin/users?role=RIDER')
      if (res.ok) {
        const data = await res.json()
        setRiders(Array.isArray(data) ? data : [])
      } else {
        setRiders([])
      }
    } catch (error) {
      console.error('Error fetching riders:', error)
      setRiders([])
    } finally {
      setLoadingRiders(false)
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      
      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      const data: PaginatedResponse = await res.json()
      setOrders(data.orders || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRiders()
  }, [role])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [search, statusFilter, page])

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

  const handleEditOrder = async () => {
    if (!editingOrder) return
    
    setUpdating(true)
    try {
      // Update status if changed
      if (editStatus !== editingOrder.status) {
        await handleStatusUpdate(editingOrder.id, editStatus)
      }
      
      // Update rider if changed and rider is assigned
      if (editRiderId !== (editingOrder.rider?.id || '')) {
        if (editRiderId) {
          const res = await fetch(`/api/admin/orders/${editingOrder.id}/assign-rider`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ riderId: editRiderId }),
          })
          if (!res.ok) {
            const err = await res.json()
            toast.error(err.error || 'Failed to assign rider')
          } else {
            toast.success('Rider assigned successfully')
          }
        }
      }
      
      setEditDialogOpen(false)
      setEditingOrder(null)
      fetchOrders()
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/orders/${deletingOrder.id}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        toast.success('Order deleted successfully')
        setDeleteDialogOpen(false)
        setDeletingOrder(null)
        fetchOrders()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete order')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Failed to delete order')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (order: Order) => {
    setDeletingOrder(order)
    setDeleteDialogOpen(true)
  }

  const openEditDialog = (order: Order) => {
    setEditingOrder(order)
    setEditStatus(order.status)
    setEditRiderId(order.rider?.id || '')
    setEditDialogOpen(true)
  }

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  const getRiderName = (rider: Rider | null | undefined) => {
    if (!rider) return 'Not assigned'
    return rider.name || rider.email || 'Unknown Rider'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24 ml-auto" />
        </div>
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">
          {role === 'ADMIN' && 'Full order management with rider assignment'}
          {role === 'STAFF' && 'Process orders (update status)'}
          {role === 'RIDER' && 'Manage your assigned deliveries'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val: string | null) => setStatusFilter(val || 'ALL')}
        >
          <SelectTrigger className="w-40 h-8">
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

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'order' : 'orders'} found
          {statusFilter !== 'ALL' && ` with status ${statusFilter.replace('_', ' ')}`}
          {search && ` matching "${search}"`}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    {role === 'ADMIN' && <TableHead>Assigned Rider</TableHead>}
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
                      <TableCell colSpan={role === 'ADMIN' ? 8 : 7} className="text-center py-8 text-muted-foreground">
                        {search || statusFilter !== 'ALL' 
                          ? 'No orders found matching your filters' 
                          : 'No orders found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                        <TableCell>{order.user.name || order.user.email}</TableCell>
                        
                        {/* Rider Column - Admin only */}
                        {role === 'ADMIN' && (
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {getRiderName(order.rider)}
                            </Badge>
                          </TableCell>
                        )}
                        
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
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => fetchOrderDetail(order.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Edit Button - Admin and Staff only */}
                          {(role === 'ADMIN' || role === 'STAFF') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(order)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Delete Button - Admin only */}
                          {role === 'ADMIN' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDeleteDialog(order)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Rider Actions - Quick status updates for riders */}
                          {role === 'RIDER' && order.status === 'ASSIGNED_RIDER' && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleStatusUpdate(order.id, 'OUT_FOR_DELIVERY')}
                            >
                              Start
                            </Button>
                          )}
                          {role === 'RIDER' && order.status === 'OUT_FOR_DELIVERY' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                            >
                              Deliver
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 py-2">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="h-8 w-8 p-0 text-sm"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditDialogOpen(false)
          setEditingOrder(null)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Order #{editingOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Update the status or assign a rider to this order.
            </DialogDescription>
          </DialogHeader>
          
          {editingOrder && (
            <div className="space-y-4 py-2">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rider Assignment - Admin only */}
              {role === 'ADMIN' && (
                <div className="space-y-2">
                  <Label htmlFor="rider">Assign Rider</Label>
                  <Select value={editRiderId} onValueChange={setEditRiderId}>
                    <SelectTrigger id="rider" className="w-full">
                      <SelectValue placeholder="Select a rider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {Array.isArray(riders) && riders.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id}>
                          {rider.name || rider.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Current Info */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Customer:</span>{' '}
                  {editingOrder.user.name || editingOrder.user.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Total:</span>{' '}
                  ₱{editingOrder.payable.toFixed(2)}
                </p>
                <p>
                  <span className="text-muted-foreground">Current Rider:</span>{' '}
                  {getRiderName(editingOrder.rider)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false)
                    setEditingOrder(null)
                  }}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditOrder}
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order #{deletingOrder?.orderNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              <div>
                <p>Are you sure you want to delete this order? This action cannot be undone.</p>
                {deletingOrder && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground">Customer:</span>{' '}
                      {deletingOrder.user.name || deletingOrder.user.email}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>{' '}
                      ₱{deletingOrder.payable.toFixed(2)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      {deletingOrder.status.replace('_', ' ')}
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

              {/* Rider Info - Show if assigned */}
              {selectedOrder.rider && (
                <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Assigned Rider: <span className="font-medium">{selectedOrder.rider.name || selectedOrder.rider.email}</span>
                  </span>
                </div>
              )}

              {/* Address */}
              {selectedOrder.address && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Delivery Address</p>
                  <p className="text-sm">{selectedOrder.address.address}, {selectedOrder.address.city}, {selectedOrder.address.province}</p>
                </div>
              )}

              {/* Order Items */}
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