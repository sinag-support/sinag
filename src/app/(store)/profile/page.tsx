'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
   User, Package, Heart, LogOut, Settings, 
   ChevronRight, UserCircle, MapPin, CreditCard,
   Bell, ShieldCheck, HelpCircle, Sparkles, Truck,
   ArrowLeft, ShoppingBag, Lock
} from 'lucide-react'

// Extended menu categories
const menuGroups = [
   {
      title: 'Shopping & Orders',
      items: [
         { href: '/profile/orders', label: 'My Orders', icon: Package, desc: 'Track, return, or buy again', badge: '1 Active' },
         { href: '/profile/wishlist', label: 'Wishlist', icon: Heart, desc: 'Items saved for later', badge: '12' },
         { href: '/profile/addresses', label: 'Saved Addresses', icon: MapPin, desc: 'Manage delivery locations' },
         { href: '/profile/payments', label: 'Payment Methods', icon: CreditCard, desc: 'Saved cards & digital wallets' },
      ]
   },
   {
      title: 'Account Settings',
      items: [
         { href: '/profile/settings', label: 'Personal Information', icon: User, desc: 'Update name, email & phone' },
         { href: '/profile/security', label: 'Security & Password', icon: Lock, desc: '2FA and password updates' },
         { href: '/profile/notifications', label: 'Notifications', icon: Bell, desc: 'Promotions & order alerts' },
      ]
   },
   {
      title: 'Support & Legal',
      items: [
         { href: '/help', label: 'Help Center & FAQ', icon: HelpCircle, desc: 'Customer service & assistance' },
         { href: '/privacy', label: 'Privacy Policy', icon: ShieldCheck, desc: 'Data protection and usage' },
      ]
   }
]

export default function ProfilePage() {
   const router = useRouter()
   const [user, setUser] = useState<any>(null)
   const [loading, setLoading] = useState(true)
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
      }
      fetchUser()
   }, [router])

   const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/')
   }

   const getInitials = (nameStr: string) => {
      if (!nameStr) return 'U'
      return nameStr
         .split(' ')
         .filter(Boolean)
         .map(n => n[0])
         .join('')
         .toUpperCase()
         .slice(0, 2)
   }

   if (loading) {
      return (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-3xl space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center gap-3">
               <Skeleton className="h-8 w-32" />
            </div>

            {/* Profile Card Skeleton */}
            <Card>
               <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                     <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                     </div>
                  </div>
                  <Skeleton className="h-9 w-24 rounded-md hidden sm:block" />
               </CardContent>
            </Card>

            {/* Quick Stats Grid Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
               ))}
            </div>

            {/* Recent Order Banner Skeleton */}
            <Skeleton className="h-24 w-full rounded-xl" />

            {/* Menu Groups Skeleton */}
            <div className="space-y-6">
               {[1, 2].map((group) => (
                  <div key={group} className="space-y-3">
                     <Skeleton className="h-4 w-32" />
                     <div className="space-y-2">
                        {[1, 2, 3].map((item) => (
                           <Skeleton key={item} className="h-16 w-full rounded-xl" />
                        ))}
                     </div>
                  </div>
               ))}
            </div>

            {/* Logout Button Skeleton */}
            <Skeleton className="h-10 w-full rounded-md" />
         </div>
      )
   }

   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-3xl space-y-6">
         {/* Page Header */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Link href="/" className="sm:hidden text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
               </Link>
               <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Account Profile</h1>
            </div>
         </div>

         {/* User Summary Card */}
         <Card className="relative overflow-hidden border-primary/10">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20 shrink-0">
                     <AvatarImage src={user?.user_metadata?.avatar_url} alt={name || 'User'} />
                     <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                        {getInitials(name || email)}
                     </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0">
                     <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-semibold truncate">{name || 'Member'}</h2>
                        <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-medium">
                           <Sparkles className="h-3 w-3 fill-amber-500/20" /> Gold Member
                        </Badge>
                     </div>
                     <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                        <UserCircle className="h-3.5 w-3.5 shrink-0" />
                        {email}
                     </p>
                  </div>
               </div>
               <Link href="/profile/settings" className="shrink-0">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                     Edit Profile
                  </Button>
               </Link>
            </CardContent>
         </Card>

         {/* Quick Dashboard Stats */}
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/profile/orders">
               <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-3.5 text-center">
                     <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
                     <p className="text-xl font-bold text-foreground mt-0.5">8</p>
                  </CardContent>
               </Card>
            </Link>
            <Link href="/profile/wishlist">
               <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-3.5 text-center">
                     <p className="text-xs text-muted-foreground font-medium">Wishlist</p>
                     <p className="text-xl font-bold text-foreground mt-0.5">12</p>
                  </CardContent>
               </Card>
            </Link>
            <Link href="/profile/addresses">
               <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-3.5 text-center">
                     <p className="text-xs text-muted-foreground font-medium">Saved Addresses</p>
                     <p className="text-xl font-bold text-foreground mt-0.5">2</p>
                  </CardContent>
               </Card>
            </Link>
            <Card className="bg-primary/5 border-primary/20">
               <CardContent className="p-3.5 text-center">
                  <p className="text-xs text-primary font-medium">SINAG Points</p>
                  <p className="text-xl font-bold text-primary mt-0.5">450 pts</p>
               </CardContent>
            </Card>
         </div>

         {/* Active Order Highlight Card */}
         <Card className="bg-muted/40 border-dashed">
            <CardContent className="p-4 flex items-center justify-between gap-4">
               <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                     <Truck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">In Transit</span>
                        <span className="text-xs text-muted-foreground">• Order #SNG-9042</span>
                     </div>
                     <p className="text-sm font-medium truncate">Estimated Delivery: Tomorrow by 5:00 PM</p>
                  </div>
               </div>
               <Link href="/profile/orders" className="shrink-0 hidden sm:block">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                     Track <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
               </Link>
            </CardContent>
         </Card>

         {/* Categorized Menu Section */}
         <div className="space-y-6">
            {menuGroups.map((group) => (
               <div key={group.title} className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                     {group.title}
                  </h3>
                  <div className="space-y-2">
                     {group.items.map((item) => {
                        const Icon = item.icon
                        return (
                           <Link key={item.href} href={item.href} className="block">
                              <Card className="hover:shadow-sm hover:border-primary/30 transition-all cursor-pointer">
                                 <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                       <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                          <Icon className="h-5 w-5" />
                                       </div>
                                       <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                             <p className="font-medium text-sm leading-tight truncate">{item.label}</p>
                                             {item.badge && (
                                                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal h-4">
                                                   {item.badge}
                                                </Badge>
                                             )}
                                          </div>
                                          <p className="text-xs text-muted-foreground truncate leading-tight mt-1">
                                             {item.desc}
                                          </p>
                                       </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                                 </CardContent>
                              </Card>
                           </Link>
                        )
                     })}
                  </div>
               </div>
            ))}
         </div>

         {/* Sign Out Button */}
         <div className="pt-2">
            <Button
               variant="outline"
               className="w-full justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5 transition-colors"
               onClick={handleLogout}
            >
               <LogOut className="h-4 w-4 mr-2" />
               Sign Out
            </Button>
         </div>
      </div>
   )
}