'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
   User, Package, Heart, Settings, 
   ChevronRight, UserCircle, LogOut, ArrowLeft
} from 'lucide-react'

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
         setName(user.user_metadata?.name || '')
         setEmail(user.email || '')
         setLoading(false)
      }
      fetchUser()
   }, [router])

   const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/')
   }

   const getInitials = (name: string) => {
      if (!name) return 'U'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
   }

   if (loading) {
      return (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
               <Skeleton className="hidden sm:inline-block h-5 w-5 rounded" />
               <Skeleton className="h-8 w-32" />
            </div>
            <div className="flex items-center gap-5 mb-8">
               <Skeleton className="h-20 w-20 rounded-full" />
               <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-56" />
               </div>
            </div>
            <div className="space-y-1">
               {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
               ))}
            </div>
            <Skeleton className="h-5 w-24 mt-6" />
         </div>
      )
   }

   const menuItems = [
      { href: '/profile/orders', label: 'My Orders', icon: Package, desc: 'View your order history' },
      { href: '/profile/settings', label: 'Settings', icon: Settings, desc: 'Manage your account' },
      { href: '/profile/wishlist', label: 'Wishlist', icon: Heart, desc: 'Your saved items' },
   ]

   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-3xl">
         {/* Header */}
         <div className="flex items-center gap-3 mb-8">
            <Link
               href="/"
               className="hidden sm:inline-flex text-muted-foreground hover:text-foreground transition-colors"
            >
               <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Profile</h1>
         </div>

         {/* User Card */}
         <div className="flex items-center gap-5 mb-8">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
               <AvatarFallback className="text-2xl bg-primary/5 text-primary">
                  {getInitials(name || user?.email || '')}
               </AvatarFallback>
            </Avatar>
            <div>
               <h2 className="text-xl font-medium">{name || 'User'}</h2>
               <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <UserCircle className="h-3.5 w-3.5" />
                  {email}
               </p>
               <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <UserCircle className="h-3 w-3" />
                  Joined {new Date(user?.created_at).toLocaleDateString('en-US', {
                     year: 'numeric',
                     month: 'long',
                     day: 'numeric'
                  })}
               </p>
            </div>
         </div>

         {/* Menu List */}
         <div className="space-y-1">
            {menuItems.map((item) => {
               const Icon = item.icon
               return (
                  <Link
                     key={item.href}
                     href={item.href}
                     className="flex items-center justify-between px-3 py-3 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                     <div className="flex items-center gap-3">
                        <div className="text-muted-foreground group-hover:text-primary transition-colors">
                           <Icon className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="text-sm font-medium">{item.label}</p>
                           <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                     </div>
                     <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                  </Link>
               )
            })}
         </div>

         {/* Divider */}
         <hr className="my-6 border-t border-muted" />

         {/* Logout */}
         <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2"
         >
            <LogOut className="h-4 w-4" />
            Sign Out
         </button>
      </div>
   )
}