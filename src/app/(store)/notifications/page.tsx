'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, CheckCircle2, Trash2, ShoppingBag, Tag, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Types
type NotificationType = 'ORDER' | 'PRODUCT' | 'SALE' | 'DEFAULT'

interface Notification {
  id: string
  title: string
  description?: string
  type: NotificationType
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

function groupNotifications(notifs: Notification[]) {
  const groups: { [key: string]: Notification[] } = {}

  notifs.forEach((n) => {
    const date = new Date(n.createdAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let groupKey = 'Earlier'
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday'
    } else {
      groupKey = 'Earlier'
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(n)
  })

  // Sort groups: Today > Yesterday > Earlier
  const ordered: { [key: string]: Notification[] } = {}
  if (groups.Today) ordered.Today = groups.Today
  if (groups.Yesterday) ordered.Yesterday = groups.Yesterday
  if (groups.Earlier) ordered.Earlier = groups.Earlier

  return ordered
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      
      if (session) {
        await fetchNotifications()
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
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
    } catch (error) {
      console.error('Error marking as read:', error)
      toast.error('Failed to mark as read')
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
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const filtered = filter === 'all' ? notifications : notifications.filter(n => !n.read)
  const unreadCount = notifications.filter(n => !n.read).length
  const grouped = groupNotifications(filtered)
  const groupKeys = Object.keys(grouped)

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 md:pb-12 max-w-3xl">
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

  // Not authenticated state
  if (isAuthenticated === false) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 md:pb-12 max-w-3xl">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Notifications</h1>
        <Card>
          <CardContent className="p-6 text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Sign in to view notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please log in to see your notifications.
            </p>
            <Link href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">
              Sign in →
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 md:pb-12 max-w-3xl">
      {/* Header */}
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

      {/* Notifications List */}
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
                  const Icon = typeIcons[notif.type] || typeIcons.DEFAULT
                  const colorClass = typeColors[notif.type] || typeColors.DEFAULT
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
                            {formatTime(notif.createdAt)}
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