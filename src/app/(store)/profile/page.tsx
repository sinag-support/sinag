'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  User,
  Package,
  Heart,
  LogOut,
  Settings,
  ChevronRight,
  MapPin,
  CreditCard,
  Bell,
  ShieldCheck,
  HelpCircle,
  ShoppingBag,
  Lock,
  Truck,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    title: string
    images: string[]
  }
}

interface Order {
  id: string
  orderNumber: number
  status: string
  total: number
  payable: number
  createdAt: string
  items: OrderItem[]
}

const menuGroups = [
  {
    title: 'Shopping & Orders',
    items: [
      { href: '/profile/orders', label: 'My Orders', icon: Package, desc: 'Track, return, or buy again' },
      { href: '/profile/wishlist', label: 'Wishlist', icon: Heart, desc: 'Items saved for later' },
      { href: '/profile/addresses', label: 'Saved Addresses', icon: MapPin, desc: 'Manage delivery locations' },
      { href: '/profile/payments', label: 'Payment Methods', icon: CreditCard, desc: 'Saved cards & digital wallets' },
    ],
  },
  {
    title: 'Account Settings',
    items: [
      { href: '/profile/settings', label: 'Personal Information', icon: User, desc: 'Update name, email & phone' },
      { href: '/profile/security', label: 'Security & Password', icon: Lock, desc: '2FA and password updates' },
      { href: '/profile/notifications', label: 'Notifications', icon: Bell, desc: 'Promotions & order alerts' },
    ],
  },
  {
    title: 'Support & Legal',
    items: [
      { href: '/profile/help', label: 'Help Center & FAQ', icon: HelpCircle, desc: 'Customer service & assistance' },
      { href: '/profile/privacy', label: 'Privacy Policy', icon: ShieldCheck, desc: 'Data protection and usage' },
    ],
  },
]

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  PREPARING: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  PACKED: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [latestOrder, setLatestOrder] = useState<Order | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setName(user.user_metadata?.full_name || user.user_metadata?.name || '')
      setEmail(user.email || '')
      setLoading(false)

      await fetchLatestOrder()
    }
    fetchUser()
  }, [router])

  const fetchLatestOrder = async () => {
    try {
      const response = await fetch('/api/orders/latest')
      if (!response.ok) {
        setOrdersLoading(false)
        return
      }
      const data: Order = await response.json()
      setLatestOrder(data)
    } catch (error) {
      console.error('Error fetching latest order:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'U'
    return nameStr
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-12 max-w-2xl space-y-6">
      {/* Page Title with Theme Toggle - Mobile Only */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 md:hidden rounded-full"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* User Header */}
      <Card className="border shadow-sm overflow-hidden">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                {getInitials(name || email)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="font-semibold text-lg leading-none">{name || 'Member'}</h2>
              <p className="text-xs text-muted-foreground">{email}</p>
              <span className="text-[11px] text-muted-foreground block pt-0.5">
                Member since {new Date(user?.created_at || Date.now()).getFullYear()}
              </span>
            </div>
          </div>
          <Link href="/profile/settings">
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Edit Profile</span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Active Order Widget */}
      {!ordersLoading && latestOrder && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                  <Truck className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Active Order</span>
              </div>
              <Badge variant="outline" className={statusColors[latestOrder.status] || ''}>
                {getStatusLabel(latestOrder.status)}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">Order #{latestOrder.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(latestOrder.createdAt).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <p className="font-bold">₱{latestOrder.payable.toFixed(2)}</p>
            </div>

            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <div className="flex -space-x-2">
                {latestOrder.items?.slice(0, 3).map((item, index) => (
                  <div
                    key={item.id}
                    className="h-8 w-8 rounded-full border-2 border-background bg-muted overflow-hidden"
                    style={{ zIndex: 3 - index }}
                  >
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ShoppingBag className="h-3 w-3 m-auto text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
              <Link href={`/profile/orders/${latestOrder.id}`}>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs font-semibold">
                  Track Order <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped Navigation Links */}
      <div className="space-y-6">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {group.title}
            </h3>
            <Card className="shadow-sm divide-y divide-border overflow-hidden">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between p-3.5 sm:p-6 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2 rounded-lg bg-muted text-foreground/80 shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-none">{item.label}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  </Link>
                )
              })}
            </Card>
          </div>
        ))}
      </div>

      {/* Sign Out Button */}
      <Card className="shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-3.5 sm:p-6 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2 rounded-lg bg-muted text-foreground/80 shrink-0">
              <LogOut className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm leading-none">Sign Out</p>
              <p className="text-xs text-muted-foreground truncate mt-1">Log out of your account on this device</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        </button>
      </Card>
    </div>
  )
}