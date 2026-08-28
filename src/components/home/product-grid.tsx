'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, Star } from 'lucide-react'
import { ProductDetailSheet } from '@/components/products/product-detail-sheet'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  price: number
  image: string
  rating?: number
  reviewCount?: number
  discount?: number
  category?: string
}

interface ProductGridProps {
  products: Product[]
  limit?: number
  scrollable?: boolean
  initialProductId?: string | null
}

export function ProductGrid({
  products,
  limit,
  scrollable = false,
  initialProductId = null,
}: ProductGridProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [wishlistLoading, setWishlistLoading] = useState<Set<string>>(new Set())

  // Fetch wishlist status on mount
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const response = await fetch('/api/wishlist')
        if (response.ok) {
          const data = await response.json()
          const wishlistIds = new Set<string>(data.map((item: any) => item.productId))
          setWishlist(wishlistIds)
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error)
      }
    }
    fetchWishlist()
  }, [])

  useEffect(() => {
    if (!initialProductId) return
    const productExists = products.some((p) => p.id === initialProductId)
    if (productExists) {
      setSelectedProductId(initialProductId)
      setSheetOpen(true)
    }
  }, [initialProductId, products])

  const displayProducts = limit ? products.slice(0, limit) : products

  const openProductDetail = (productId: string) => {
    setSelectedProductId(productId)
    setSheetOpen(true)
  }

  const toggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Please login to add to wishlist')
      return
    }

    // Prevent multiple clicks
    if (wishlistLoading.has(productId)) return

    // Set loading state
    setWishlistLoading(prev => new Set(prev).add(productId))

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Update wishlist state
        setWishlist(prev => {
          const newSet = new Set(prev)
          if (data.added) {
            newSet.add(productId)
          } else {
            newSet.delete(productId)
          }
          return newSet
        })
        toast.success(data.added ? 'Added to wishlist ❤️' : 'Removed from wishlist')
      } else {
        toast.error(data.error || 'Failed to update wishlist')
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error)
      toast.error('Failed to update wishlist')
    } finally {
      setWishlistLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No products available</p>
        <p className="text-sm">Check back later for new arrivals</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Grid */}
      <div
        className="hidden lg:grid gap-4 pb-0"
        style={{
          gridTemplateColumns: limit
            ? 'repeat(5, 1fr)'
            : 'repeat(auto-fill, minmax(200px, 1fr))',
        }}
      >
        {displayProducts.map((product) => {
          const discount = product.discount || 0
          const hasDiscount = discount > 0
          const finalPrice = product.price - (product.price * discount) / 100
          const isWishlisted = wishlist.has(product.id)
          const isLoading = wishlistLoading.has(product.id)
          const rating = product.rating ?? 0
          const reviewCount = product.reviewCount ?? 0

          return (
            <Card
              key={product.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative rounded-lg p-0 pt-0 border"
              onClick={() => openProductDetail(product.id)}
            >
              <button
                onClick={(e) => toggleWishlist(e, product.id)}
                disabled={isLoading}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 transition-colors disabled:opacity-50"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${
                    isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
                  }`}
                />
              </button>

              <div className="relative aspect-square w-full bg-white dark:bg-black overflow-hidden rounded-t-lg">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No image</span>
                  </div>
                )}
                {hasDiscount && (
                  <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                    -{discount}%
                  </div>
                )}
              </div>

              <CardContent className="p-4 space-y-2">
                <h3 className="font-medium text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                
                <div className="flex items-center gap-2">
                  {hasDiscount ? (
                    <>
                      <span className="font-bold text-sm sm:text-base text-green-600 dark:text-green-400">
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

                {/* Rating */}
                <div className="flex items-center gap-1 pt-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    {reviewCount > 0 ? `(${reviewCount})` : '(No reviews)'}
                  </span>
                </div>

                {product.category && (
                  <p className="text-xs text-muted-foreground pt-1">
                    {product.category}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Mobile/Tablet – scrollable or grid */}
      <div className="lg:hidden pb-0">
        {scrollable ? (
          <div
            className="flex gap-3 overflow-x-auto scroll-smooth pb-0 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayProducts.map((product) => {
              const discount = product.discount || 0
              const hasDiscount = discount > 0
              const finalPrice = product.price - (product.price * discount) / 100
              const isWishlisted = wishlist.has(product.id)
              const isLoading = wishlistLoading.has(product.id)
              const rating = product.rating ?? 0
              const reviewCount = product.reviewCount ?? 0

              return (
                <div key={product.id} className="flex-shrink-0 w-[150px] sm:w-[180px]">
                  <Card
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative h-full rounded-lg p-0 pt-0 border"
                    onClick={() => openProductDetail(product.id)}
                  >
                    <button
                      onClick={(e) => toggleWishlist(e, product.id)}
                      disabled={isLoading}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 transition-colors disabled:opacity-50"
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
                        }`}
                      />
                    </button>
                    <div className="relative aspect-square w-full bg-white dark:bg-black overflow-hidden rounded-t-lg">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                          <span className="text-gray-400 dark:text-gray-500 text-sm">No image</span>
                        </div>
                      )}
                      {hasDiscount && (
                        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                          -{discount}%
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2.5 space-y-2">
                      <h3 className="font-medium text-xs sm:text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        {hasDiscount ? (
                          <>
                            <span className="font-bold text-xs sm:text-sm text-green-600 dark:text-green-400">
                              ₱{finalPrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-muted-foreground line-through">
                              ₱{product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-xs sm:text-sm">
                            ₱{product.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 pt-0.5">
                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] font-medium">{rating.toFixed(1)}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {reviewCount > 0 ? `(${reviewCount})` : '(No reviews)'}
                        </span>
                      </div>

                      {product.category && (
                        <p className="text-[10px] text-muted-foreground pt-0.5 truncate">
                          {product.category}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4 sm:pb-0">
            {displayProducts.map((product) => {
              const discount = product.discount || 0
              const hasDiscount = discount > 0
              const finalPrice = product.price - (product.price * discount) / 100
              const isWishlisted = wishlist.has(product.id)
              const isLoading = wishlistLoading.has(product.id)
              const rating = product.rating ?? 0
              const reviewCount = product.reviewCount ?? 0

              return (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative rounded-lg p-0 pt-0 border"
                  onClick={() => openProductDetail(product.id)}
                >
                  <button
                    onClick={(e) => toggleWishlist(e, product.id)}
                    disabled={isLoading}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 transition-colors disabled:opacity-50"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
                      }`}
                    />
                  </button>
                  <div className="relative aspect-square w-full bg-white dark:bg-black overflow-hidden rounded-t-lg">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-gray-400 dark:text-gray-500 text-sm">No image</span>
                      </div>
                    )}
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                        -{discount}%
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <h3 className="font-medium text-xs sm:text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      {hasDiscount ? (
                        <>
                          <span className="font-bold text-xs sm:text-sm text-green-600 dark:text-green-400">
                            ₱{finalPrice.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-muted-foreground line-through">
                            ₱{product.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-xs sm:text-sm">
                          ₱{product.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 pt-0.5">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-[10px] font-medium">{rating.toFixed(1)}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {reviewCount > 0 ? `(${reviewCount})` : '(No reviews)'}
                      </span>
                    </div>

                    {product.category && (
                      <p className="text-xs text-muted-foreground pt-0.5 truncate">
                        {product.category}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <ProductDetailSheet
        productId={selectedProductId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}