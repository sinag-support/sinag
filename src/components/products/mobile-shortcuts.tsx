'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Heart, CreditCard, Ticket, MapPin, HelpCircle } from 'lucide-react'

const shortcuts = [
   { href: '/orders', label: 'Orders', icon: ClipboardList },
   { href: '/wishlist', label: 'Wishlist', icon: Heart },
   { href: '/payments', label: 'Payments', icon: CreditCard },
   { href: '/vouchers', label: 'Vouchers', icon: Ticket },
   { href: '/profile/addresses', label: 'Address', icon: MapPin },
   { href: '/help', label: 'Help', icon: HelpCircle },
]

export function MobileShortcuts() {
   const pathname = usePathname()

   return (
      <div className="grid grid-cols-6 gap-0.5 w-full md:hidden">
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
                  <Icon className="h-5 w-5" />
                  <span className="text-[9px] font-medium leading-tight truncate max-w-full">
                     {label}
                  </span>
               </Link>
            )
         })}
      </div>
   )
}