'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingCart, Minus, Plus, Star } from 'lucide-react'

interface Product {
   id: string
   name: string
   price: number
   image: string
   rating: number
}

interface ProductGridProps {
   products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
   const [wishlist, setWishlist] = useState<Set<string>>(new Set())
   const [quantities, setQuantities] = useState<Record<string, number>>({})

   const toggleWishlist = (productId: string) => {
      setWishlist((prev) => {
         const newSet = new Set(prev)
         if (newSet.has(productId)) {
            newSet.delete(productId)
         } else {
            newSet.add(productId)
         }
         return newSet
      })
   }

   const updateQuantity = (productId: string, delta: number) => {
      setQuantities((prev) => {
         const current = prev[productId] || 0
         const newQuantity = Math.max(0, current + delta)
         if (newQuantity === 0) {
            const { [productId]: _, ...rest } = prev
            return rest
         }
         return { ...prev, [productId]: newQuantity }
      })
   }

   const addToCart = (productId: string) => {
      setQuantities((prev) => ({
         ...prev,
         [productId]: (prev[productId] || 0) + 1,
      }))
   }

   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
         {products.map((product) => {
            const isWishlisted = wishlist.has(product.id)
            const quantity = quantities[product.id] || 0

            return (
               <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow relative">
                  <button
                     onClick={() => toggleWishlist(product.id)}
                     className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 transition-colors"
                     aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                     <Heart
                        className={`h-5 w-5 transition-colors ${
                           isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
                        }`}
                     />
                  </button>

                  <Link href={`/products/${product.id}`}>
                     <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        <Image
                           src={product.image}
                           alt={product.name}
                           fill
                           sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                           className="object-cover hover:scale-105 transition-transform"
                        />
                     </div>
                  </Link>

                  <CardContent className="p-3 sm:p-4 space-y-1.5">
                     <Link href={`/products/${product.id}`}>
                        <h3 className="font-medium text-sm sm:text-base line-clamp-1 hover:text-primary transition-colors">
                           {product.name}
                        </h3>
                     </Link>

                     <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{product.rating}</span>
                     </div>

                     <div className="flex items-center justify-between pt-0.5">
                        <span className="font-bold text-sm sm:text-base">
                           ₱{product.price.toFixed(2)}
                        </span>
                        <Button
                           size="icon"
                           variant={quantity > 0 ? 'default' : 'outline'}
                           className="h-8 w-8 rounded-full"
                           onClick={() => addToCart(product.id)}
                           aria-label="Add to cart"
                        >
                           <ShoppingCart className="h-4 w-4" />
                        </Button>
                     </div>

                     <div className="flex items-center gap-2 pt-0.5">
                        <Button
                           size="icon"
                           variant="outline"
                           className="h-7 w-7 rounded-full"
                           onClick={() => updateQuantity(product.id, -1)}
                           disabled={quantity === 0}
                        >
                           <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-5 text-center">
                           {quantity}
                        </span>
                        <Button
                           size="icon"
                           variant="outline"
                           className="h-7 w-7 rounded-full"
                           onClick={() => updateQuantity(product.id, 1)}
                        >
                           <Plus className="h-3 w-3" />
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            )
         })}
      </div>
   )
}