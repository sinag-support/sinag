'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
   DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
   LogOut, ShoppingCart, Heart, Bell, Search, 
   UserCircle, Package
} from 'lucide-react'

export default function Header() {
   const router = useRouter()
   const pathname = usePathname()
   const [user, setUser] = useState<any>(null)
   const [loading, setLoading] = useState(true)

   const fetchUser = async () => {
      try {
         const { data: { session } } = await supabase.auth.getSession()
         setUser(session?.user || null)
      } catch (error) {
         console.error('Error getting user:', error)
         setUser(null)
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      fetchUser()
   }, [pathname])

   useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
         async (event, session) => {
            if (event === 'SIGNED_OUT') {
               setUser(null)
            } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
               setUser(session?.user || null)
            }
            setLoading(false)
         }
      )

      return () => subscription?.unsubscribe()
   }, [])

   const handleLogout = async () => {
      try {
         await supabase.auth.signOut()
         window.location.href = '/'
      } catch (error) {
         console.error('Logout error:', error)
         window.location.href = '/'
      }
   }

   if (pathname?.startsWith('/admin')) {
      return null
   }

   const getInitials = (name: string) => {
      if (!name) return 'U'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
   }

   if (loading) {
      return (
         <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
            <div className="px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
               <Link href="/" className="text-xl font-bold shrink-0">SINAG</Link>
               <div className="hidden flex-1 max-w-md mx-4 md:flex relative">
                  <div className="w-full h-9 rounded-md bg-muted animate-pulse" />
               </div>
               <div className="flex items-center gap-2 sm:gap-4">
                  <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
                  <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
                  <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
               </div>
            </div>
         </header>
      )
   }

   return (
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
         <div className="px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-4">
            <Link href="/" className="text-xl font-bold shrink-0">
               SINAG
            </Link>

            <div className="hidden flex-1 max-w-md mx-4 md:flex relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-9 w-full"
                  onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement
                        if (target.value.trim()) {
                           router.push(`/products?search=${encodeURIComponent(target.value.trim())}`)
                        }
                     }
                  }}
               />
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
               <ThemeToggle />

               <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                     0
                  </span>
               </Button>

               <Link href="/cart">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                     <ShoppingCart className="h-5 w-5" />
                  </Button>
               </Link>

               {user ? (
                  <DropdownMenu>
                     <DropdownMenuTrigger>
                        <div className="cursor-pointer rounded-full h-9 w-9 bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                           <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-transparent text-primary">
                                 {getInitials(user.user_metadata?.name || user.email || '')}
                              </AvatarFallback>
                           </Avatar>
                        </div>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-56" align="end">
                        <div className="flex flex-col space-y-1 px-4 py-2">
                           <p className="text-sm font-medium leading-none">
                              {user.user_metadata?.name || user.email}
                           </p>
                           <p className="text-xs leading-none text-muted-foreground">
                              {user.email}
                           </p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                           <DropdownMenuItem onClick={() => router.push('/profile')}>
                              <UserCircle className="mr-2 h-4 w-4" />
                              Profile
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => router.push('/orders')}>
                              <Package className="mr-2 h-4 w-4" />
                              My Orders
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => router.push('/wishlist')}>
                              <Heart className="mr-2 h-4 w-4" />
                              Wishlist
                           </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                           <LogOut className="mr-2 h-4 w-4" />
                           Logout
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               ) : (
                  <Link href="/login">
                     <Button variant="default" size="sm">
                        Login
                     </Button>
                  </Link>
               )}
            </div>
         </div>

         <div className="md:hidden border-t px-4 py-2">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-9 w-full"
                  onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement
                        if (target.value.trim()) {
                           router.push(`/products?search=${encodeURIComponent(target.value.trim())}`)
                        }
                     }
                  }}
               />
            </div>
         </div>
      </header>
   )
}