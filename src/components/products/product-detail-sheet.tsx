'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, ShoppingCart, Minus, Plus, Star, X } from 'lucide-react'
import { useMediaQuery } from 'react-responsive'

interface ProductDetailSheetProps {
   productId: string | null
   open: boolean
   onOpenChange: (open: boolean) => void
}

// Shared content component for both mobile and desktop
function ProductDetailContent({
   product,
   quantity,
   setQuantity,
   isWishlisted,
   toggleWishlist,
   addToCart,
   buyNow,
   loading,
}: any) {
   const hasDiscount = product?.discount && product.discount > 0
   const finalPrice = hasDiscount
      ? product.price - (product.price * product.discount) / 100
      : product.price

   if (loading) {
      return (
         <div className="flex-1 overflow-y-auto scrollbar-hide">
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="p-4 sm:p-6 space-y-3 pb-6">
               <Skeleton className="h-7 w-3/4" />
               <Skeleton className="h-4 w-1/3" />
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-5/6" />
               <Skeleton className="h-8 w-1/4 my-2" />
               <div className="flex items-center justify-between">
                  <Skeleton className="h-9 w-32 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
               </div>
               <div className="flex gap-3">
                  <Skeleton className="h-11 flex-1 rounded-md" />
                  <Skeleton className="h-11 flex-1 rounded-md" />
               </div>
            </div>
         </div>
      )
   }

   if (!product) {
      return (
         <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Product not found</p>
         </div>
      )
   }

   return (
      <div className="flex-1 overflow-y-auto scrollbar-hide">
         {/* Image with discount badge */}
         <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
            <Image
               src={product.images?.[0] || ''}
               alt={product.title}
               fill
               className="object-cover"
               sizes="100vw"
            />
            {hasDiscount && (
               <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                  -{product.discount}%
               </div>
            )}
         </div>

         <div className="p-4 sm:p-6 space-y-3">
            {/* Title & Rating */}
            <div>
               <h2 className="text-xl sm:text-2xl font-bold leading-tight">{product.title}</h2>
               <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                     <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                     <span className="text-sm font-medium">4.0</span>
                  </div>
                  <span className="text-xs text-muted-foreground">(12 reviews)</span>
               </div>
            </div>

            {/* Description */}
            {product.description && (
               <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
               </p>
            )}

            {/* Price – discount percent removed */}
            <div className="flex items-center gap-3">
               {hasDiscount ? (
                  <>
                     <span className="text-xl sm:text-2xl font-bold">₱{finalPrice.toFixed(2)}</span>
                     <span className="text-sm text-muted-foreground line-through">
                        ₱{product.price.toFixed(2)}
                     </span>
                  </>
               ) : (
                  <span className="text-xl sm:text-2xl font-bold">₱{product.price.toFixed(2)}</span>
               )}
            </div>

            {/* Quantity & Wishlist */}
            <div className="flex items-center justify-between pt-1">
               <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Qty</span>
                  <div className="flex items-center gap-2">
                     <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                     >
                        <Minus className="h-4 w-4" />
                     </Button>
                     <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                     <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setQuantity(quantity + 1)}
                     >
                        <Plus className="h-4 w-4" />
                     </Button>
                  </div>
               </div>
               <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={toggleWishlist}
               >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
               </Button>
            </div>

            {/* Action Buttons – always side‑by‑side */}
            <div className="flex flex-row gap-3 pt-2">
               <Button
                  variant="outline"
                  className="flex-1 gap-2 h-11 px-3 sm:px-6 text-sm font-semibold"
                  onClick={addToCart}
               >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
               </Button>
               <Button
                  variant="default"
                  className="flex-1 h-11 px-3 sm:px-6 text-sm font-semibold"
                  onClick={buyNow}
               >
                  Buy Now
               </Button>
            </div>
         </div>
      </div>
   )
}

export function ProductDetailSheet({ productId, open, onOpenChange }: ProductDetailSheetProps) {
   const [product, setProduct] = useState<any>(null)
   const [loading, setLoading] = useState(false)
   const [quantity, setQuantity] = useState(1)
   const [isWishlisted, setIsWishlisted] = useState(false)
   const isDesktop = useMediaQuery({ minWidth: 1024 })

   useEffect(() => {
      if (productId && open) {
         setLoading(true)
         fetch(`/api/products/${productId}`)
            .then((res) => res.json())
            .then((data) => {
               setProduct(data)
               setLoading(false)
            })
            .catch((err) => {
               console.error(err)
               setLoading(false)
            })
      }
   }, [productId, open])

   const addToCart = () => {
      console.log('Add to cart:', productId, quantity)
   }

   const buyNow = () => {
      console.log('Buy now:', productId, quantity)
   }

   const toggleWishlist = () => {
      setIsWishlisted(!isWishlisted)
   }

   if (!productId) return null

   const contentProps = {
      product,
      quantity,
      setQuantity,
      isWishlisted,
      toggleWishlist,
      addToCart,
      buyNow,
      loading,
   }

   // Mobile: bottom sheet
   if (!isDesktop) {
      return (
         <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl p-0 overflow-hidden">
               <div className="relative h-full flex flex-col">
                  <button
                     onClick={() => onOpenChange(false)}
                     className="absolute right-3 top-3 z-20 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors shadow-sm"
                  >
                     <X className="h-5 w-5" />
                  </button>
                  <ProductDetailContent {...contentProps} />
               </div>
            </SheetContent>
         </Sheet>
      )
   }

   // Desktop: centered floating modal, single column
   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent
            className="max-w-2xl p-0 overflow-hidden rounded-xl border-0 shadow-2xl [&>button]:hidden"
         >
            <div className="relative max-h-[80vh] flex flex-col">
               <button
                  onClick={() => onOpenChange(false)}
                  className="absolute right-3 top-3 z-20 p-2 rounded-full bg-background/80 hover:bg-background transition-colors shadow-sm"
               >
                  <X className="h-5 w-5" />
               </button>
               <ProductDetailContent {...contentProps} />
            </div>
         </DialogContent>
      </Dialog>
   )
}