'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
   LayoutDashboard,
   Package,
   ShoppingCart,
   Users,
   Tag,
   ImageIcon,
   LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const adminNavItems = [
   { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
   { href: '/admin/products', label: 'Products', icon: Package },
   { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
   { href: '/admin/users', label: 'Users', icon: Users },
   { href: '/admin/categories', label: 'Categories', icon: Tag },
   { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
]

export default function AdminSidebar() {
   const pathname = usePathname()
   const [isLoggingOut, setIsLoggingOut] = useState(false)

   const handleLogout = async () => {
      if (isLoggingOut) return
      
      setIsLoggingOut(true)
      try {
         const response = await fetch('/api/auth/logout', {
            method: 'POST',
         })

         if (response.ok) {
            // Force redirect to home
            window.location.href = '/'
         } else {
            console.error('Logout failed')
            setIsLoggingOut(false)
         }
      } catch (error) {
         console.error('Logout error:', error)
         setIsLoggingOut(false)
         // Fallback: clear local session and redirect
         window.location.href = '/'
      }
   }

   return (
      <aside className="hidden w-64 border-r bg-background lg:block">
         <div className="flex h-16 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2">
               <span className="font-bold">SINAG</span>
               <span className="text-sm text-muted-foreground">Admin</span>
            </Link>
         </div>
         <nav className="space-y-1 p-4">
            {adminNavItems.map((item) => {
               const Icon = item.icon
               const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
               
               return (
                  <Link
                     key={item.href}
                     href={item.href}
                     className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                           ? 'bg-accent text-accent-foreground'
                           : 'hover:bg-muted'
                     )}
                  >
                     <Icon className="h-4 w-4" />
                     {item.label}
                  </Link>
               )
            })}
            <div className="border-t pt-4 mt-4">
               <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
               >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
               </button>
            </div>
         </nav>
      </aside>
   )
}