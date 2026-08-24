'use client'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Calendar, Package, Truck, CheckCircle, XCircle, Clock, MapPin, CreditCard } from 'lucide-react'
import Image from 'next/image'

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
}

interface OrderDetailSheetProps {
   order: Order | null
   open: boolean
   onOpenChange: (open: boolean) => void
}

const statusColors = {
   pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
   confirmed: 'bg-blue-500/10 text-blue-600 border-blue-200',
   preparing: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
   packed: 'bg-purple-500/10 text-purple-600 border-purple-200',
   ready_for_pickup: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
   assigned_rider: 'bg-orange-500/10 text-orange-600 border-orange-200',
   out_for_delivery: 'bg-amber-500/10 text-amber-600 border-amber-200',
   delivered: 'bg-green-500/10 text-green-600 border-green-200',
   cancelled: 'bg-red-500/10 text-red-600 border-red-200',
   refunded: 'bg-gray-500/10 text-gray-600 border-gray-200',
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

export function OrderDetailSheet({ order, open, onOpenChange }: OrderDetailSheetProps) {
   if (!order) return null

   const StatusIcon = statusIcons[order.status] || Clock
   const statusColor = statusColors[order.status] || 'bg-gray-500/10 text-gray-600 border-gray-200'

   return (
      <Sheet open={open} onOpenChange={onOpenChange}>
         <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh] rounded-t-2xl overflow-y-auto p-4 sm:p-6">
            <div className="space-y-6">
               {/* Header */}
               <div className="flex items-start justify-between">
                  <div>
                     <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h2>
                     <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                           <Calendar className="h-3.5 w-3.5" />
                           {new Date(order.date).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                           })}
                        </span>
                     </div>
                  </div>
                  <Badge className={`${statusColor} border px-3 py-1 text-xs font-medium`}>
                     <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                     {statusLabels[order.status]}
                  </Badge>
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
                        <span>₱{order.total.toFixed(2)}</span>
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

               {/* Action Button */}
               <div className="pt-4">
                  <Button className="w-full" variant="outline" onClick={() => onOpenChange(false)}>
                     Close
                  </Button>
               </div>
            </div>
         </SheetContent>
      </Sheet>
   )
}