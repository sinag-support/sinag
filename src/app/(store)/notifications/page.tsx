'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, CheckCircle2, Trash2, ShoppingBag, Tag, Truck, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Sample data – replace with real API
const sampleNotifications = [
   { id: 1, title: 'Order #1234 has been shipped', description: 'Your order is on its way!', time: '2 hours ago', read: false, type: 'order' },
   { id: 2, title: 'New product: Wireless Earbuds', description: 'Check out our latest arrival.', time: '5 hours ago', read: false, type: 'product' },
   { id: 3, title: 'Flash Sale: 50% off', description: 'Ends tomorrow. Don\'t miss out!', time: '1 day ago', read: true, type: 'sale' },
   { id: 4, title: 'Order #1230 delivered', description: 'Your order has been delivered successfully.', time: '2 days ago', read: true, type: 'order' },
]

const typeIcons = {
   order: ShoppingBag,
   product: Gift,
   sale: Tag,
   default: Bell,
}

const typeColors = {
   order: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
   product: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
   sale: 'text-orange-500 bg-orange-50 dark:bg-orange-950',
   default: 'text-gray-500 bg-gray-50 dark:bg-gray-950',
}

export default function NotificationsPage() {
   const [notifications, setNotifications] = useState(sampleNotifications)

   const markAsRead = (id: number) => {
      setNotifications(prev =>
         prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
   }

   const markAllAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
   }

   const deleteNotification = (id: number) => {
      setNotifications(prev => prev.filter(n => n.id !== id))
   }

   const unreadCount = notifications.filter(n => !n.read).length

   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-3xl">
         {/* Header */}
         <div className="flex items-center gap-3 mb-6">
            <Link
               href="/"
               className="hidden sm:inline-flex text-muted-foreground hover:text-foreground transition-colors"
            >
               <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
               <span className="text-xs sm:text-sm text-muted-foreground ml-auto">
                  {unreadCount} unread
               </span>
            )}
         </div>

         {/* Actions */}
         {notifications.length > 0 && unreadCount > 0 && (
            <div className="flex justify-end mb-4">
               <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
                  Mark all as read
               </Button>
            </div>
         )}

         {/* Notifications List */}
         <div className="space-y-3">
            {notifications.length === 0 ? (
               <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No notifications</h3>
                  <p className="text-sm text-muted-foreground">You're all caught up!</p>
               </div>
            ) : (
               notifications.map((notif) => {
                  const Icon = typeIcons[notif.type as keyof typeof typeIcons] || typeIcons.default
                  const colorClass = typeColors[notif.type as keyof typeof typeColors] || typeColors.default
                  const isUnread = !notif.read

                  return (
                     <Card
                        key={notif.id}
                        className={`transition-colors ${
                           isUnread ? 'border-primary/20 bg-primary/5' : ''
                        }`}
                     >
                        <CardContent className="p-3 sm:p-4 flex items-start gap-3">
                           {/* Icon */}
                           <div className={`p-2 rounded-full shrink-0 ${colorClass}`}>
                              <Icon className="h-4 w-4" />
                           </div>

                           {/* Content */}
                           <div className="flex-1 min-w-0">
                              <p className={`text-sm ${isUnread ? 'font-medium' : ''}`}>
                                 {notif.title}
                              </p>
                              {notif.description && (
                                 <p className="text-sm text-muted-foreground mt-0.5">
                                    {notif.description}
                                 </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                 {notif.time}
                              </p>
                           </div>

                           {/* Actions */}
                           <div className="flex items-center gap-0.5 shrink-0">
                              {isUnread && (
                                 <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => markAsRead(notif.id)}
                                    aria-label="Mark as read"
                                 >
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                 </Button>
                              )}
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                 onClick={() => deleteNotification(notif.id)}
                                 aria-label="Delete notification"
                              >
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                        </CardContent>
                     </Card>
                  )
               })
            )}
         </div>
      </div>
   )
}