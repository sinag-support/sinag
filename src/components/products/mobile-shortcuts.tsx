'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Heart, CreditCard, MapPin, HelpCircle } from 'lucide-react'

const shortcuts = [
   { href: '/profile/orders', label: 'Orders', icon: ClipboardList },
   { href: '/profile/wishlist', label: 'Wishlist', icon: Heart },
   { href: '/profile/payments', label: 'Payments', icon: CreditCard },
   { href: '/profile/addresses', label: 'Address', icon: MapPin },
   { href: '/help', label: 'Help', icon: HelpCircle },
]

export function MobileShortcuts() {
   const pathname = usePathname()

   return (
      <div className="grid grid-cols-5 gap-0.5 w-full md:hidden">
         {shortcuts.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname?.startsWith(href + '/')
            return (
               <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors py-1.5 ${
                     isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:bg-muted/50'
                  }`}
               >
                  <Icon className="h-6 w-6" />
                  <span className="text-[10px] mt-2 font-medium leading-tight truncate max-w-full">
                     {label}
                  </span>
               </Link>
            )
         })}
      </div>
   )
}