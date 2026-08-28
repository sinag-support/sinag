'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, CheckCircle2, Trash2, ShoppingBag, Tag, Gift, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  description?: string
  type: 'ORDER' | 'PRODUCT' | 'SALE' | 'DEFAULT'
  read: boolean
  link?: string
  metadata?: any
  createdAt: string
}

const typeIcons = {
  ORDER: ShoppingBag,
  PRODUCT: Gift,
  SALE: Tag,
  DEFAULT: Bell,
}

const typeColors = {
  ORDER: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  PRODUCT: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
  SALE: 'text-orange-500 bg-orange-50 dark:bg-orange-950',
  DEFAULT: 'text-gray-500 bg-gray-50 dark:bg-gray-950',
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d`
  
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  })
}

export function NotificationsDropdown() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/notifications?limit=5')
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      const data = await response.json()
      setNotifications(data)
      const unread = data.filter((n: Notification) => !n.read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark as read')
      }

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark all as read')
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsDeleting(id)
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      const deleted = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (notification.link) {
      router.push(notification.link)
    } else if (notification.metadata?.orderId) {
      router.push(`/profile/orders/${notification.metadata.orderId}`)
    } else if (notification.metadata?.productId) {
      router.push(`/products/${notification.metadata.productId}`)
    }
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <Button variant="outline" size="icon" className="h-9 w-9 relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 max-h-[70vh] overflow-hidden">
        {/* Header - Removed "View all" link */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-8 px-2"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Read all
            </Button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground">
                You're all caught up!
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || typeIcons.DEFAULT
              const colorClass = typeColors[notification.type] || typeColors.DEFAULT
              const isUnread = !notification.read

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer border-b border-border/50 last:border-0",
                    isUnread ? 'bg-primary/5' : ''
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`p-1.5 rounded-full shrink-0 ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm truncate",
                      isUnread ? 'font-medium' : 'text-muted-foreground'
                    )}>
                      {notification.title}
                    </p>
                    {notification.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {notification.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => markAsRead(notification.id, e)}
                        aria-label="Mark as read"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => deleteNotification(notification.id, e)}
                      disabled={isDeleting === notification.id}
                      aria-label="Delete notification"
                    >
                      {isDeleting === notification.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer - View all link */}
        {notifications.length > 0 && (
          <div className="border-t p-2 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}