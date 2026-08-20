'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, CheckCircle2, Trash2, ShoppingBag, Tag, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Sample data – replace with real API
const sampleNotifications = [
   { id: 1, title: 'Order #1234 has been shipped', description: 'Your order is on its way!', time: '2 hours ago', read: false, type: 'order' },
   { id: 2, title: 'New product: Wireless Earbuds', description: 'Check out our latest arrival.', time: '5 hours ago', read: false, type: 'product' },
   { id: 3, title: 'Flash Sale: 50% off', description: 'Ends tomorrow. Don\'t miss out!', time: '1 day ago', read: true, type: 'sale' },
   { id: 4, title: 'Order #1230 delivered', description: 'Your order has been delivered successfully.', time: '2 days ago', read: true, type: 'order' },
   { id: 5, title: 'Welcome to SINAG!', description: 'Thank you for joining us.', time: '3 minutes ago', read: false, type: 'default' },
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

function groupNotifications(notifs: typeof sampleNotifications) {
   const groups: { [key: string]: typeof sampleNotifications } = {
      Today: [],
      Yesterday: [],
      Earlier: [],
   }

   notifs.forEach((n) => {
      const time = n.time.toLowerCase()
      if (time.includes('minute') || time.includes('hour') || time.includes('just now')) {
         groups.Today.push(n)
      } else if (time.includes('yesterday') || (time.includes('day') && time.includes('ago'))) {
         const days = parseInt(time.match(/\d+/)?.[0] || '0')
         if (days === 1) {
            groups.Yesterday.push(n)
         } else {
            groups.Earlier.push(n)
         }
      } else {
         groups.Earlier.push(n)
      }
   })

   return Object.fromEntries(
      Object.entries(groups).filter(([_, items]) => items.length > 0)
   )
}

export default function NotificationsPage() {
   const [notifications, setNotifications] = useState(sampleNotifications)
   const [loading, setLoading] = useState(true)
   const [filter, setFilter] = useState<'all' | 'unread'>('all')

   useEffect(() => {
      const timer = setTimeout(() => setLoading(false), 1500)
      return () => clearTimeout(timer)
   }, [])

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

   const filtered = filter === 'all' ? notifications : notifications.filter(n => !n.read)
   const unreadCount = notifications.filter(n => !n.read).length
   const grouped = groupNotifications(filtered)
   const groupKeys = Object.keys(grouped)

   if (loading) {
      return (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-16 md:pb-0 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
               <Skeleton className="h-6 w-6 rounded" />
               <Skeleton className="h-8 w-48" />
            </div>
            <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                     <CardContent className="p-3 sm:p-4 flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                           <Skeleton className="h-4 w-3/4" />
                           <Skeleton className="h-3 w-1/2" />
                           <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>
      )
   }

   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 md:pb-12 sm:pb-12 max-w-3xl">
         {/* Header – no back button */}
         <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
               <span className="text-xs sm:text-sm text-muted-foreground">
                  {unreadCount} unread
               </span>
            )}
         </div>

         {/* Filter chips */}
         <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
               <button
                  onClick={() => setFilter('all')}
                  className={cn(
                     "px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors",
                     filter === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                  )}
               >
                  All
               </button>
               <button
                  onClick={() => setFilter('unread')}
                  className={cn(
                     "px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors",
                     filter === 'unread'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                  )}
               >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
               </button>
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
               <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
                  Mark all as read
               </Button>
            )}
         </div>

         {/* Notifications List with groups – icons use old style (p-2, h-4 w-4) */}
         {filtered.length === 0 ? (
            <div className="text-center py-12">
               <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
               <h3 className="text-lg font-medium">
                  {filter === 'all' ? 'No notifications' : 'No unread notifications'}
               </h3>
               <p className="text-sm text-muted-foreground">
                  {filter === 'all' ? "You're all caught up!" : 'You have no unread notifications.'}
               </p>
            </div>
         ) : (
            <div className="space-y-6">
               {groupKeys.map((group) => (
                  <div key={group}>
                     <h2 className="text-sm font-semibold text-muted-foreground mb-2">{group}</h2>
                     <div className="space-y-2">
                        {grouped[group].map((notif) => {
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
                                    <div className={`p-2 rounded-full shrink-0 ${colorClass}`}>
                                       <Icon className="h-4 w-4" />
                                    </div>
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
                        })}
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   )
}