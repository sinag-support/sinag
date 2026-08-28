'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Trash2, ShoppingCart, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface WishlistItem {
  id: string
  product: {
    id: string
    title: string
    price: number
    discount: number
    images: string[]
    stock: number
    category?: {
      title: string
    } | null
    reviews?: {
      rating: number
    }[]
  }
  createdAt: string
}

export default function WishlistPage() {
  const router = useRouter()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirect=/profile/wishlist')
        return
      }

      const response = await fetch('/api/wishlist')
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist')
      }
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      toast.error('Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (productId: string, wishlistItemId: string) => {
    setRemoving(wishlistItemId)
    try {
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('Delete response error:', text)
        throw new Error(`Failed to delete: ${response.status}`)
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError)
        data = { removed: true }
      }

      setItems((prev) => prev.filter((item) => item.id !== wishlistItemId))
      toast.success('Removed from wishlist')
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to remove from wishlist')
    } finally {
      setRemoving(null)
    }
  }

  const addToCart = async (productId: string) => {
    setAddingToCart(productId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
          optionId: null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add to cart')
      }

      toast.success('Added to cart!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(null)
    }
  }

  const goBack = () => router.back()

  const calculateRating = (reviews?: { rating: number }[]) => {
    if (!reviews || reviews.length === 0) return null
    const total = reviews.reduce((sum, r) => sum + r.rating, 0)
    return (total / reviews.length).toFixed(1)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="ml-auto h-5 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-3 sm:p-4">
                <Skeleton className="aspect-square w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-4 w-1/2 mt-1" />
                <Skeleton className="h-4 w-1/3 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 max-w-3xl">
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

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={goBack}
          className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Wishlist</h1>
        <span className="ml-auto text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {items.map((item) => {
          const product = item.product
          const imageUrl = product.images?.[0] || '/placeholder.png'
          const hasDiscount = product.discount > 0
          const finalPrice = hasDiscount
            ? product.price - (product.price * product.discount) / 100
            : product.price
          const isOutOfStock = product.stock === 0
          const rating = calculateRating(product.reviews)

          return (
            <Card 
              key={item.id} 
              className="overflow-hidden group hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-3 sm:p-4">
                {/* Product Image */}
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative aspect-square bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.png'
                      }}
                    />
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                        -{product.discount}%
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="mt-2 space-y-1">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        ₱{finalPrice.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₱{product.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {product.category && (
                        <p className="text-xs text-muted-foreground truncate">
                          {product.category.title}
                        </p>
                      )}
                      {rating && (
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs font-medium"
                    onClick={() => addToCart(product.id)}
                    disabled={isOutOfStock || addingToCart === product.id}
                  >
                    {addingToCart === product.id ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <>
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(product.id, item.id)}
                    disabled={removing === item.id}
                  >
                    {removing === item.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Continue Shopping Button */}
      <div className="mt-6 text-center">
        <Link
          href="/products"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Continue shopping →
        </Link>
      </div>
    </div>
  )
}