'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight, Calendar, Package, ShoppingBag, ArrowLeft } from 'lucide-react'
import { OrderDetailSheet } from '@/components/orders/order-detail-sheet'

// Sample order data with location
const sampleOrders = [
   {
      id: '1',
      orderNumber: 'SNG-9042',
      date: '2025-02-15T10:30:00',
      status: 'out_for_delivery' as const,
      total: 1299,
      items: [
         {
            id: 'i1',
            name: 'Wireless Headphones',
            price: 1299,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
         },
      ],
      shippingAddress: '123 SINAG Street, Barangay San Lorenzo, Metro Manila',
      paymentMethod: 'GCash',
      location: {
         lat: 14.5995,
         lng: 120.9842,
      },
   },
   {
      id: '2',
      orderNumber: 'SNG-9012',
      date: '2025-02-12T14:15:00',
      status: 'delivered' as const,
      total: 3498,
      items: [
         {
            id: 'i2',
            name: 'Smart Watch',
            price: 2499,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop',
         },
         {
            id: 'i3',
            name: 'Laptop Backpack',
            price: 899,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&h=100&fit=crop',
         },
      ],
      shippingAddress: '456 Maginhawa St, Quezon City, Metro Manila',
      paymentMethod: 'COD',
      location: {
         lat: 14.6500,
         lng: 121.0300,
      },
   },
   {
      id: '3',
      orderNumber: 'SNG-8987',
      date: '2025-02-08T09:45:00',
      status: 'preparing' as const,
      total: 599,
      items: [
         {
            id: 'i4',
            name: 'Bluetooth Speaker',
            price: 599,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=100&h=100&fit=crop',
         },
      ],
      shippingAddress: '789 Mabini St, Mandaluyong, Metro Manila',
      paymentMethod: 'GCash',
      location: {
         lat: 14.5800,
         lng: 121.0350,
      },
   },
   {
      id: '4',
      orderNumber: 'SNG-8950',
      date: '2025-02-02T16:20:00',
      status: 'cancelled' as const,
      total: 1899,
      items: [
         {
            id: 'i5',
            name: 'Running Shoes',
            price: 1899,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
         },
      ],
      shippingAddress: '321 Luna St, Pasig, Metro Manila',
      paymentMethod: 'COD',
      location: {
         lat: 14.5600,
         lng: 121.0800,
      },
   },
]

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

export default function OrdersPage() {
   const router = useRouter()
   const [selectedOrder, setSelectedOrder] = useState<typeof sampleOrders[0] | null>(null)
   const [sheetOpen, setSheetOpen] = useState(false)

   const openOrderDetail = (order: typeof sampleOrders[0]) => {
      setSelectedOrder(order)
      setSheetOpen(true)
   }

   const goBack = () => {
      router.back()
   }

   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 max-w-3xl">
         {/* Back button */}
         <button
            onClick={goBack}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors gap-1.5 mb-6"
         >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
         </button>

         <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6">My Orders</h1>

         {sampleOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
               <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
               </div>
               <p className="text-lg font-medium">No orders yet</p>
               <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  When you place an order, it will appear here.
               </p>
               <Link
                  href="/products"
                  className="mt-6 text-sm font-medium text-primary hover:underline"
               >
                  Start shopping
               </Link>
            </div>
         ) : (
            <div className="space-y-3">
               {sampleOrders.map((order) => (
                  <Card
                     key={order.id}
                     className="hover:shadow-sm hover:border-primary/30 transition-all cursor-pointer"
                     onClick={() => openOrderDetail(order)}
                  >
                     <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                           {/* Thumbnails */}
                           <div className="flex -space-x-2 shrink-0">
                              {order.items.slice(0, 3).map((item, idx) => (
                                 <div
                                    key={item.id}
                                    className="relative h-12 w-12 rounded-md overflow-hidden border-2 border-background"
                                    style={{ zIndex: 3 - idx }}
                                 >
                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                 </div>
                              ))}
                              {order.items.length > 3 && (
                                 <div className="relative h-12 w-12 rounded-md bg-muted flex items-center justify-center border-2 border-background text-xs font-medium">
                                    +{order.items.length - 3}
                                 </div>
                              )}
                           </div>
                           <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                 <p className="font-medium text-sm truncate">Order #{order.orderNumber}</p>
                                 <Badge className={`${statusColors[order.status]} border px-2 py-0 text-[10px] font-normal`}>
                                    {statusLabels[order.status]}
                                 </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                 <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(order.date).toLocaleDateString('en-PH', {
                                       year: 'numeric',
                                       month: 'short',
                                       day: 'numeric',
                                    })}
                                 </span>
                                 <span>•</span>
                                 <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                                 <span>•</span>
                                 <span className="font-medium text-foreground">₱{order.total.toFixed(2)}</span>
                              </div>
                           </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                     </CardContent>
                  </Card>
               ))}
            </div>
         )}

         <OrderDetailSheet
            order={selectedOrder}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
         />
      </div>
   )
}