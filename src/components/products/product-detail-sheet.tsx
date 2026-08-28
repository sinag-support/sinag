'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, ShoppingCart, Minus, Plus, Star, X, Check } from 'lucide-react'
import { useMediaQuery } from 'react-responsive'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProductOption {
  id: string
  name: string
  price: number
  image?: string
  stock: number
}

interface ProductDetailSheetProps {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Shared content component – with robust null guards
function ProductDetailContent({
  product,
  quantity,
  setQuantity,
  isWishlisted,
  toggleWishlist,
  wishlistLoading,
  addToCart,
  buyNow,
  loading,
  isAdding,
  selectedOptionId,
  setSelectedOptionId,
  options,
  hasOptions,
  selectedOption,
  displayPrice,
  hasDiscount,
  finalPrice,
  currentStock,
  isOutOfStock,
  isMaxQuantity,
  currentImage,
  isDesktop,
  onClose,
}: any) {
  // Early return for loading
  if (loading) {
    return (
      <div className={cn(
        "flex-1 overflow-y-auto scrollbar-hide",
        isDesktop && "flex flex-row"
      )}>
        <Skeleton className={cn(
          "aspect-video w-full rounded-none",
          isDesktop && "h-full w-1/2"
        )} />
        <div className={cn(
          "p-4 sm:p-6 space-y-3 pb-6",
          isDesktop && "w-1/2"
        )}>
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

  // Early return if product is null
  if (!product) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    )
  }

  // Use selected option image or fallback to product image
  const imageUrl = currentImage || product.images?.[0] || ''

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleIncrement = () => {
    if (!isOutOfStock && quantity < currentStock) {
      setQuantity(quantity + 1)
    }
  }

  // Desktop layout: split into two columns
  if (isDesktop) {
    return (
      <div className="flex flex-row h-full">
        {/* Left: Image - sticky */}
        <div className="relative w-1/2 h-full bg-gray-100 overflow-hidden flex-shrink-0 sticky top-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="w-full h-full object-cover"
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
            <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
              -{product.discount}%
            </div>
          )}
        </div>

        {/* Right: Content - scrollable */}
        <div className="w-1/2 p-6 space-y-4 overflow-y-auto">
          <div>
            <h2 className="text-2xl font-bold leading-tight">{product.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {product.rating?.toFixed(1) ?? 'N/A'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount ?? 0} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            {hasDiscount ? (
              <>
                <span className="text-2xl font-bold">₱{finalPrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through">
                  ₱{displayPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold">₱{finalPrice.toFixed(2)}</span>
            )}
            {!isOutOfStock && (
              <span className="text-xs text-muted-foreground ml-auto">
                Stock: {currentStock}
              </span>
            )}
          </div>

          {/* Product Options */}
          {hasOptions && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Select Option</p>
              <div className="grid grid-cols-2 gap-2">
                {options.map((opt: ProductOption) => {
                  const isSelected = selectedOptionId === opt.id
                  const isOptOutOfStock = opt.stock === 0

                  return (
                    <button
                      key={opt.id}
                      onClick={() => !isOptOutOfStock && setSelectedOptionId(opt.id)}
                      disabled={isOptOutOfStock}
                      className={cn(
                        'relative flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50',
                        isOptOutOfStock && 'opacity-50 cursor-not-allowed bg-muted/30'
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="text-sm font-medium">{opt.name}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        ₱{opt.price.toFixed(2)}
                      </span>
                      {isOptOutOfStock ? (
                        <span className="text-xs text-red-500 mt-0.5 font-medium">Out of stock</span>
                      ) : (
                        opt.stock < 5 && (
                          <span className="text-xs text-orange-500 mt-0.5">
                            Only {opt.stock} left
                          </span>
                        )
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Qty</span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full"
                  onClick={handleDecrement}
                  disabled={quantity <= 1 || isOutOfStock}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full"
                  onClick={handleIncrement}
                  disabled={isMaxQuantity || isOutOfStock}
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
              disabled={wishlistLoading}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 gap-2 h-11 px-6 text-sm font-semibold"
              onClick={addToCart}
              disabled={isOutOfStock || isAdding}
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>
            <Button
              variant="default"
              className="flex-1 h-11 px-6 text-sm font-semibold"
              onClick={buyNow}
              disabled={isOutOfStock || isAdding}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Mobile layout (original)
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      {/* Image with discount badge */}
      <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
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
          <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            -{product.discount}%
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold leading-tight">{product.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {product.rating?.toFixed(1) ?? 'N/A'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount ?? 0} {product.reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-3">
          {hasDiscount ? (
            <>
              <span className="text-xl sm:text-2xl font-bold">₱{finalPrice.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through">
                ₱{displayPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-xl sm:text-2xl font-bold">₱{finalPrice.toFixed(2)}</span>
          )}
          {!isOutOfStock && (
            <span className="text-xs text-muted-foreground ml-auto">
              Stock: {currentStock}
            </span>
          )}
        </div>

        {/* Product Options */}
        {hasOptions && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select Option</p>
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt: ProductOption) => {
                const isSelected = selectedOptionId === opt.id
                const isOptOutOfStock = opt.stock === 0

                return (
                  <button
                    key={opt.id}
                    onClick={() => !isOptOutOfStock && setSelectedOptionId(opt.id)}
                    disabled={isOptOutOfStock}
                    className={cn(
                      'relative flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50',
                      isOptOutOfStock && 'opacity-50 cursor-not-allowed bg-muted/30'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{opt.name}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      ₱{opt.price.toFixed(2)}
                    </span>
                    {isOptOutOfStock ? (
                      <span className="text-xs text-red-500 mt-0.5 font-medium">Out of stock</span>
                    ) : (
                      opt.stock < 5 && (
                        <span className="text-xs text-orange-500 mt-0.5">
                          Only {opt.stock} left
                        </span>
                      )
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Quantity Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Qty</span>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full"
                onClick={handleDecrement}
                disabled={quantity <= 1 || isOutOfStock}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-6 text-center">{quantity}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full"
                onClick={handleIncrement}
                disabled={isMaxQuantity || isOutOfStock}
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
            disabled={wishlistLoading}
          >
            <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 h-11 px-3 sm:px-6 text-sm font-semibold"
            onClick={addToCart}
            disabled={isOutOfStock || isAdding}
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </Button>
          <Button
            variant="default"
            className="flex-1 h-11 px-3 sm:px-6 text-sm font-semibold"
            onClick={buyNow}
            disabled={isOutOfStock || isAdding}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProductDetailSheet({ productId, open, onOpenChange }: ProductDetailSheetProps) {
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const isDesktop = useMediaQuery({ minWidth: 1024 })

  // Fetch product data
  useEffect(() => {
    if (productId && open) {
      setLoading(true)
      fetch(`/api/products/${productId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Product not found')
          return res.json()
        })
        .then((data) => {
          setProduct(data)
          setQuantity(1)

          // Create options array with base product as first option
          let allOptions = []

          // Always include base product as the default option
          const baseOption = {
            id: 'base_' + data.id,
            name: 'Regular',
            price: data.price,
            image: data.images?.[0] || null,
            stock: data.stock || 0,
            isBase: true,
          }
          allOptions.push(baseOption)

          // Add product options if they exist
          if (data.options && data.options.length > 0) {
            allOptions = allOptions.concat(data.options)
          }

          // Set the product with combined options
          setProduct({
            ...data,
            combinedOptions: allOptions,
          })

          // Auto-select base option
          setSelectedOptionId(baseOption.id)
          setCurrentImage(data.images?.[0] || null)
          setLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setProduct(null)
          setLoading(false)
        })
    }
  }, [productId, open])

  // Check wishlist status when product loads
  useEffect(() => {
    if (productId && open && product) {
      const checkWishlist = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setIsWishlisted(false)
          return
        }
        try {
          const res = await fetch(`/api/wishlist/check?productId=${productId}`)
          if (res.ok) {
            const data = await res.json()
            setIsWishlisted(data.isWishlisted)
          }
        } catch (error) {
          console.error('Error checking wishlist:', error)
        }
      }
      checkWishlist()
    }
  }, [productId, open, product])

  // Update image when selected option changes
  useEffect(() => {
    if (!product) return
    if (!selectedOptionId) {
      setCurrentImage(product.images?.[0] || null)
      return
    }

    // Check if it's the base option
    if (selectedOptionId === 'base_' + product.id) {
      setCurrentImage(product.images?.[0] || null)
      return
    }

    const selectedOpt = product.options?.find((opt: any) => opt.id === selectedOptionId)
    if (selectedOpt?.image) {
      setCurrentImage(selectedOpt.image)
    } else {
      setCurrentImage(product.images?.[0] || null)
    }
  }, [selectedOptionId, product])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return false
    }
    return true
  }

  const getSelectedOption = () => {
    if (!product) return null
    if (!selectedOptionId) return null

    // Check if it's the base option
    if (selectedOptionId === 'base_' + product.id) {
      return {
        id: selectedOptionId,
        name: 'Regular',
        price: product.price,
        image: product.images?.[0] || null,
        stock: product.stock || 0,
        isBase: true,
      }
    }

    return product.options?.find((opt: any) => opt.id === selectedOptionId) || null
  }

  // Toggle wishlist
  const toggleWishlist = async () => {
    // Check authentication first
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Please login to add to wishlist')
      router.push('/login')
      return
    }

    if (wishlistLoading) return
    setWishlistLoading(true)

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsWishlisted(data.added)
        toast.success(data.added ? 'Added to wishlist ❤️' : 'Removed from wishlist')
      } else {
        toast.error(data.error || 'Failed to update wishlist')
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error)
      toast.error('Failed to update wishlist')
    } finally {
      setWishlistLoading(false)
    }
  }

  // Prepare computed values for the content component
  const options = product?.combinedOptions || []
  const hasOptions = options.length > 1 // More than just the base option
  const selectedOption = getSelectedOption()
  const displayPrice = selectedOption ? selectedOption.price : product?.price || 0
  const hasDiscount = product?.discount && product.discount > 0
  const finalPrice = hasDiscount
    ? displayPrice - (displayPrice * product.discount) / 100
    : displayPrice
  const currentStock = selectedOption ? selectedOption.stock : product?.stock || 0
  const isOutOfStock = currentStock === 0
  const isMaxQuantity = quantity >= currentStock

  const addToCart = async () => {
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) return

    if (!productId) {
      toast.error('Product not found')
      return
    }

    if (isOutOfStock) {
      toast.error('Selected option is out of stock')
      return
    }

    setIsAdding(true)
    try {
      const payload = {
        productId,
        quantity,
        // Only send optionId if it's not the base option
        optionId: selectedOptionId && selectedOptionId.startsWith('base_') ? null : selectedOptionId,
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to add to cart')
        return
      }

      toast.success('Added to cart!')
      onOpenChange(false)
    } catch (error) {
      console.error('Add to cart error:', error)
      toast.error('Failed to add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  const buyNow = async () => {
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) return

    if (!productId) {
      toast.error('Product not found')
      return
    }

    if (isOutOfStock) {
      toast.error('Selected option is out of stock')
      return
    }

    setIsAdding(true)
    try {
      // Build the checkout URL with product details as query params
      const params = new URLSearchParams({
        productId: productId,
        quantity: quantity.toString(),
        optionId: selectedOptionId && selectedOptionId.startsWith('base_') ? '' : (selectedOptionId || ''),
        buyNow: 'true',
      })
      
      // Close the sheet and navigate to checkout with params
      onOpenChange(false)
      router.push(`/checkout?${params.toString()}`)
    } catch (error) {
      console.error('Buy now error:', error)
      toast.error('Failed to proceed')
    } finally {
      setIsAdding(false)
    }
  }

  if (!productId) return null

  const contentProps = {
    product,
    quantity,
    setQuantity,
    isWishlisted,
    toggleWishlist,
    wishlistLoading,
    addToCart,
    buyNow,
    loading,
    isAdding,
    selectedOptionId,
    setSelectedOptionId,
    options,
    hasOptions,
    selectedOption,
    displayPrice,
    hasDiscount,
    finalPrice,
    currentStock,
    isOutOfStock,
    isMaxQuantity,
    currentImage,
    isDesktop,
  }

  // Mobile: bottom sheet
  if (!isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[70vh] rounded-t-2xl p-0 overflow-hidden [&>button]:hidden"
        >
          <div className="relative h-full flex flex-col">
            {/* Single close button for mobile */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-3 top-3 z-20 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
            <ProductDetailContent {...contentProps} onClose={() => onOpenChange(false)} />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: split layout like OrderDetailSheet
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl p-0 overflow-hidden rounded-xl border-0 shadow-2xl [&>button]:hidden"
      >
        <div className="relative max-h-[85vh] flex flex-col">
          {/* Single close button for desktop */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 z-20 p-2 rounded-full bg-background/80 hover:bg-background transition-colors shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>
          <ProductDetailContent {...contentProps} onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}