'use client'

import { Bell } from 'lucide-react'
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
   DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useState } from 'react'

// Sample notifications – replace with real data
const sampleNotifications = [
   { id: 1, title: 'Order #1234 shipped', time: '2 hours ago', read: false },
   { id: 2, title: 'New product available', time: '5 hours ago', read: false },
   { id: 3, title: 'Sale ends tomorrow', time: '1 day ago', read: true },
]

export function NotificationsDropdown() {
   const [notifications, setNotifications] = useState(sampleNotifications)
   const unreadCount = notifications.filter(n => !n.read).length

   const markAsRead = (id: number) => {
      setNotifications(prev =>
         prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
   }

   const markAllAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
   }

   return (
      <DropdownMenu>
         <DropdownMenuTrigger>
            <div
               role="button"
               tabIndex={0}
               className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
               <Bell className="h-5 w-5" />
               {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                     {unreadCount}
                  </span>
               )}
            </div>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" className="w-80">
            {/* Replace DropdownMenuLabel with a simple div */}
            <div className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold">
               <span>Notifications</span>
               {unreadCount > 0 && (
                  <button
                     onClick={markAllAsRead}
                     className="text-xs font-normal text-primary hover:underline"
                  >
                     Mark all as read
                  </button>
               )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
               <div className="py-4 text-center text-sm text-muted-foreground">
                  No notifications
               </div>
            ) : (
               <DropdownMenuGroup>
                  {notifications.map((notif) => (
                     <DropdownMenuItem
                        key={notif.id}
                        className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                        onClick={() => markAsRead(notif.id)}
                     >
                        <div className="flex items-center justify-between w-full">
                           <span className={`text-sm ${notif.read ? 'text-muted-foreground' : 'font-medium'}`}>
                              {notif.title}
                           </span>
                           {!notif.read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                           )}
                        </div>
                        <span className="text-xs text-muted-foreground">{notif.time}</span>
                     </DropdownMenuItem>
                  ))}
               </DropdownMenuGroup>
            )}
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
               <Link
                  href="/notifications"
                  className="text-sm text-primary hover:underline"
               >
                  View all notifications
               </Link>
            </div>
         </DropdownMenuContent>
      </DropdownMenu>
   )
}