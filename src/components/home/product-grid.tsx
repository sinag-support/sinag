'use client'

import { useState } from 'react'
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
  category?: string
}

interface ProductGridProps {
  products: Product[]
  limit?: number
  scrollable?: boolean // Horizontal scroll on mobile
}

export function ProductGrid({ products, limit, scrollable = false }: ProductGridProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())

  const displayProducts = limit ? products.slice(0, limit) : products

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
      {/* Desktop: Grid */}
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

          return (
            <Card
              key={product.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative rounded-lg p-0 pt-0 border"
              onClick={() => openProductDetail(product.id)}
            >
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

              <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-t-lg">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
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

              <CardContent className="p-4 space-y-1">
                <h3 className="font-medium text-sm sm:text-base line-clamp-1">
                  {product.name}
                </h3>

                {product.category && (
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                )}

                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
                </div>

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
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Mobile/Tablet */}
      <div className="lg:hidden pb-0">
        {scrollable ? (
          /* Horizontal scrollable (for homepage) */
          <div
            className="flex gap-3 overflow-x-auto scroll-smooth pb-0 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayProducts.map((product) => {
              const discount = product.discount || 0
              const hasDiscount = discount > 0
              const finalPrice = product.price - (product.price * discount) / 100
              const isWishlisted = wishlist.has(product.id)

              return (
                <div key={product.id} className="flex-shrink-0 w-[150px] sm:w-[180px]">
                  <Card
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative h-full rounded-lg p-0 pt-0 border"
                    onClick={() => openProductDetail(product.id)}
                  >
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

                    <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-t-lg">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
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

                    <CardContent className="p-2.5 space-y-1">
                      <h3 className="font-medium text-xs line-clamp-1">{product.name}</h3>

                      {product.category && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {product.category}
                        </p>
                      )}

                      <div className="flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] font-medium">{product.rating.toFixed(1)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasDiscount ? (
                          <>
                            <span className="font-bold text-xs text-green-600 dark:text-green-400">
                              ₱{finalPrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-muted-foreground line-through">
                              ₱{product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-xs">
                            ₱{product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        ) : (
          /* Grid layout (for products page) */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4 sm:pb-0">
            {displayProducts.map((product) => {
              const discount = product.discount || 0
              const hasDiscount = discount > 0
              const finalPrice = product.price - (product.price * discount) / 100
              const isWishlisted = wishlist.has(product.id)

              return (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative rounded-lg p-0 pt-0 border"
                  onClick={() => openProductDetail(product.id)}
                >
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

                  <div className="relative aspect-square w-full bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-t-lg">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
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

                  <CardContent className="p-3 space-y-1">
                    <h3 className="font-medium text-xs sm:text-sm line-clamp-1">
                      {product.name}
                    </h3>

                    {product.category && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {product.category}
                      </p>
                    )}

                    <div className="flex items-center gap-1">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-[10px] font-medium">{product.rating.toFixed(1)}</span>
                    </div>

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