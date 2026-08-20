'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function WishlistPage() {
   const router = useRouter()
   const goBack = () => router.back()

   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-3xl">
         {/* Header */}
         <div className="flex items-center gap-3 mb-8">
            <button
               onClick={goBack}
               className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
               aria-label="Go back"
            >
               <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Wishlist</h1>
         </div>

         {/* Empty State Card */}
         <Card>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-muted-foreground" />
               </div>
               <p className="text-lg font-medium">Your wishlist is empty</p>
               <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Start adding items you love.
               </p>
               <Link
                  href="/products"
                  className="mt-6 text-sm font-medium text-primary hover:underline"
               >
                  Explore products
               </Link>
            </CardContent>
         </Card>
      </div>
   )
}