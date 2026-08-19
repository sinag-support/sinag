'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, Star } from 'lucide-react'
import { ProductDetailSheet } from '@/components/products/product-detail-sheet'

interface Product {
   id: string
   name: string
   price: number
   image: string
   rating: number
   discount?: number
}

interface ProductGridProps {
   products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
   const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
   const [sheetOpen, setSheetOpen] = useState(false)
   const [wishlist, setWishlist] = useState<Set<string>>(new Set())

   const openProductDetail = (productId: string) => {
      setSelectedProductId(productId)
      setSheetOpen(true)
   }

   const toggleWishlist = (e: React.MouseEvent, productId: string) => {
      e.stopPropagation()
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

   return (
      <>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {products.map((product) => {
               const discount = product.discount || 0
               const hasDiscount = discount > 0
               const finalPrice = product.price - (product.price * discount / 100)
               const isWishlisted = wishlist.has(product.id)

               return (
                  <Card
                     key={product.id}
                     className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative"
                     onClick={() => openProductDetail(product.id)}
                  >
                     {/* Wishlist Button */}
                     <button
                        onClick={(e) => toggleWishlist(e, product.id)}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 transition-colors"
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                     >
                        <Heart
                           className={`h-4 w-4 transition-colors ${
                              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
                           }`}
                        />
                     </button>

                     <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        <Image
                           src={product.image}
                           alt={product.name}
                           fill
                           sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                           className="object-cover hover:scale-105 transition-transform"
                        />
                        {hasDiscount && (
                           <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                              -{discount}%
                           </div>
                        )}
                     </div>

                     <CardContent className="px-3 sm:px-4 space-y-1">
                        <h3 className="font-medium text-sm sm:text-base line-clamp-1">
                           {product.name}
                        </h3>

                        <div className="flex items-center gap-1">
                           <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                           <span className="text-xs font-medium">{product.rating}</span>
                        </div>

                        <div className="flex items-center gap-2">
                           {hasDiscount ? (
                              <>
                                 <span className="font-bold text-sm sm:text-base">
                                    ₱{finalPrice.toFixed(2)}
                                 </span>
                                 <span className="text-xs text-muted-foreground line-through">
                                    ₱{product.price.toFixed(2)}
                                 </span>
                              </>
                           ) : (
                              <span className="font-bold text-sm sm:text-base">
                                 ₱{product.price.toFixed(2)}
                              </span>
                           )}
                        </div>
                     </CardContent>
                  </Card>
               )
            })}
         </div>

         <ProductDetailSheet
            productId={selectedProductId}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
         />
      </>
   )
}