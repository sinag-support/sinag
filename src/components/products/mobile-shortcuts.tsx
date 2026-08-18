'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Heart, MapPin, HelpCircle } from 'lucide-react'

const shortcuts = [
   { href: '/orders', label: 'Orders', icon: ClipboardList },
   { href: '/wishlist', label: 'Wishlist', icon: Heart },
   { href: '/profile/addresses', label: 'Address', icon: MapPin },
   { href: '/help', label: 'Help', icon: HelpCircle },
]

export function MobileShortcuts() {
   const pathname = usePathname()

   return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:hidden">
         {shortcuts.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname?.startsWith(href + '/')
            return (
               <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs whitespace-nowrap transition-colors ${
                     isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-input hover:bg-muted'
                  }`}
               >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
               </Link>
            )
         })}
      </div>
   )
}