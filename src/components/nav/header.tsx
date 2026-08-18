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
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown'
import { supabase } from '@/lib/supabase'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
   LogOut, ShoppingCart, Heart, Bell, Search, 
   UserCircle, Package, Home
} from 'lucide-react'

export default function Header() {
   const router = useRouter()
   const pathname = usePathname()
   const [user, setUser] = useState<any>(null)
   const [loading, setLoading] = useState(true)
   const [isMobile, setIsMobile] = useState(false)

   // Detect mobile
   useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
   }, [])

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

   // Hide on admin pages
   if (pathname?.startsWith('/admin')) {
      return null
   }

   // Hide on mobile cart page
   if (isMobile && pathname === '/cart') {
      return null
   }

   const getInitials = (name: string) => {
      if (!name) return 'U'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
   }

   const navLinks = [
      { href: '/products', label: 'Products' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/blog', label: 'Blog' },
   ]

   // Loading skeleton
   if (loading) {
      return (
         <>
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
               <div className="hidden md:flex px-4 sm:px-6 lg:px-8 h-16 items-center justify-between gap-4">
                  <div className="text-xl font-bold shrink-0">SINAG</div>
                  <div className="hidden flex-1 max-w-md mx-4 md:flex relative">
                     <div className="w-full h-9 rounded-md bg-muted animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                     <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
                     <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
                     <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                  </div>
               </div>
               <div className="md:hidden px-4 py-2 flex items-center gap-3">
                  <div className="flex-1 h-9 rounded-md bg-muted animate-pulse" />
                  <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
                  <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
               </div>
            </header>
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
               <nav className="flex items-center justify-around h-16">
                  {[1, 2, 3, 4].map((i) => (
                     <div key={i} className="flex flex-col items-center gap-0.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                        <div className="w-10 h-3 rounded-md bg-muted animate-pulse" />
                     </div>
                  ))}
               </nav>
            </div>
         </>
      )
   }

   return (
      <>
         <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
            {/* Desktop */}
            <div className="hidden md:flex px-4 sm:px-6 lg:px-8 h-16 items-center justify-between gap-4">
               <Link href="/" className="text-xl font-bold shrink-0">SINAG</Link>
               <nav className="flex items-center gap-6 text-sm">
                  {navLinks.map((link) => (
                     <Link
                        key={link.href}
                        href={link.href}
                        className={`transition-colors hover:text-primary ${
                           pathname === link.href ? 'text-primary font-medium' : 'text-muted-foreground'
                        }`}
                     >
                        {link.label}
                     </Link>
                  ))}
               </nav>
               <div className="flex flex-1 max-w-sm mx-4 relative">
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
                  <NotificationsDropdown />
                  <Link href="/cart">
                     <Button variant="outline" size="icon" className="h-9 w-9">
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
                                 <UserCircle className="mr-2 h-4 w-4" /> Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push('/orders')}>
                                 <Package className="mr-2 h-4 w-4" /> My Orders
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push('/wishlist')}>
                                 <Heart className="mr-2 h-4 w-4" /> Wishlist
                              </DropdownMenuItem>
                           </DropdownMenuGroup>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                              <LogOut className="mr-2 h-4 w-4" /> Logout
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  ) : (
                     <Link href="/login">
                        <Button variant="default" size="sm">Login</Button>
                     </Link>
                  )}
               </div>
            </div>

            {/* Mobile – search + theme + cart */}
            <div className="md:hidden px-4 py-2 flex items-center gap-3">
               <div className="relative flex-1">
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
               <ThemeToggle />
               <Link href="/cart">
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                     <ShoppingCart className="h-5 w-5" />
                  </Button>
               </Link>
            </div>
         </header>

         {/* Mobile Bottom Navigation */}
         <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
            <nav className="flex items-center justify-around h-16">
               <Link
                  href="/"
                  className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
                     pathname === '/' ? 'text-primary' : 'text-muted-foreground'
                  }`}
               >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
               </Link>
               <Link
                  href="/products"
                  className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
                     pathname?.startsWith('/products') ? 'text-primary' : 'text-muted-foreground'
                  }`}
               >
                  <Package className="h-5 w-5" />
                  <span>Products</span>
               </Link>
               <Link
                  href="/notifications"
                  className={`relative flex flex-col items-center gap-0.5 text-xs transition-colors ${
                     pathname === '/notifications' ? 'text-primary' : 'text-muted-foreground'
                  }`}
               >
                  <div className="relative">
                     <Bell className="h-5 w-5" />
                     <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                        0
                     </span>
                  </div>
                  <span>Notifications</span>
               </Link>
               <Link
                  href={user ? '/profile' : '/login'}
                  className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
                     pathname?.startsWith('/profile') ? 'text-primary' : 'text-muted-foreground'
                  }`}
               >
                  {user ? (
                     <Avatar className="h-6 w-6 border-2 border-primary/20">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                           {getInitials(user.user_metadata?.name || user.email || '')}
                        </AvatarFallback>
                     </Avatar>
                  ) : (
                     <UserCircle className="h-5 w-5" />
                  )}
                  <span>{user ? 'Profile' : 'Login'}</span>
               </Link>
            </nav>
         </div>
      </>
   )
}