'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, ChevronLeft, MapPin, Plus, ShoppingBag } from 'lucide-react'

interface CartItem {
  id: string
  productId: string
  quantity: number
  optionId: string | null
  product: {
    id: string
    title: string
    price: number
    discount: number
    images: string[]
  }
  option?: {
    id: string
    name: string
    price: number
    stock: number
  } | null
}

interface Address {
  id: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
  isDefault: boolean
}

interface BuyNowItem {
  productId: string
  quantity: number
  optionId: string | null
  product: {
    id: string
    title: string
    price: number
    discount: number
    images: string[]
  }
  option?: {
    id: string
    name: string
    price: number
    stock: number
  } | null
}

export default function CheckoutClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [isBuyNow, setIsBuyNow] = useState(false)

  // Selected address
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [addressesLoaded, setAddressesLoaded] = useState(false)

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'GCASH'>('COD')

  // Check if this is a buy now purchase
  useEffect(() => {
    const isBuyNowParam = searchParams.get('buyNow')
    const productId = searchParams.get('productId')
    const quantity = parseInt(searchParams.get('quantity') || '1')
    const optionId = searchParams.get('optionId') || null

    if (isBuyNowParam === 'true' && productId) {
      setIsBuyNow(true)
      fetchBuyNowProduct(productId, quantity, optionId)
    } else {
      fetchCart()
      fetchAddresses()
    }
  }, [searchParams])

  const fetchBuyNowProduct = async (productId: string, quantity: number, optionId: string | null) => {
    try {
      const response = await fetch('/api/checkout/buy-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, optionId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch product')
      }

      const data = await response.json()
      setBuyNowItem({
        productId: data.product.id,
        quantity: data.quantity,
        optionId: optionId,
        product: data.product,
        option: data.option,
      })
      
      // Still fetch addresses
      await fetchAddresses()
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching buy now product:', error)
      toast.error(error.message || 'Failed to load product')
      setLoading(false)
    }
  }

  const fetchCart = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/cart')
      if (!response.ok) throw new Error('Failed to fetch cart')
      const data = await response.json()
      setCartItems(data.items || [])
      await fetchAddresses()
      setLoading(false)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load cart')
      setLoading(false)
    }
  }

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/addresses')
      if (!response.ok) {
        setAddressesLoaded(true)
        return
      }
      const data = await response.json()
      setSavedAddresses(data)
      setAddressesLoaded(true)

      // Auto-select default address
      const defaultAddr = data.find((a: Address) => a.isDefault)
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id)
        setSelectedAddress(defaultAddr)
      } else if (data.length > 0) {
        // If no default, select the first one
        setSelectedAddressId(data[0].id)
        setSelectedAddress(data[0])
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setAddressesLoaded(true)
    }
  }

  const handleAddressSelect = (value: string | null) => {
    if (!value) return
    setSelectedAddressId(value)
    const addr = savedAddresses.find((a) => a.id === value)
    if (addr) setSelectedAddress(addr)
  }

  // Get items for checkout (either cart items or buy now item)
  const getCheckoutItems = () => {
    if (isBuyNow && buyNowItem) {
      // Convert buy now item to cart item format
      return [{
        id: 'buy-now-' + Date.now(),
        productId: buyNowItem.productId,
        quantity: buyNowItem.quantity,
        optionId: buyNowItem.optionId,
        product: buyNowItem.product,
        option: buyNowItem.option,
      }]
    }
    return cartItems
  }

  const checkoutItems = getCheckoutItems()

  // Compute totals
  const subtotal = checkoutItems.reduce((sum, item) => {
    const basePrice = item.option ? item.option.price : item.product.price
    const price = item.product.discount > 0
      ? basePrice * (1 - item.product.discount / 100)
      : basePrice
    return sum + price * item.quantity
  }, 0)

  const shipping = 60 // flat rate
  const vat = 0 // 0% VAT
  const total = subtotal + shipping + vat

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address')
      return
    }

    if (checkoutItems.length === 0) {
      toast.error('No items to checkout')
      return
    }

    setPlacingOrder(true)
    try {
      // For buy now, we need to use a different API endpoint or pass the items directly
      const orderPayload = {
        address: selectedAddress.address,
        city: selectedAddress.city,
        province: selectedAddress.province,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country,
        paymentMethod,
        shipping,
        vat,
        isBuyNow,
        items: isBuyNow ? checkoutItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          optionId: item.optionId,
          price: item.option ? item.option.price : item.product.price,
        })) : undefined,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order')
      }

      toast.success('Order placed successfully!')
      router.push(`/profile/orders/${data.orderId}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order')
    } finally {
      setPlacingOrder(false)
    }
  }

  // --- Skeleton Loading State ---
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl pb-24 md:pb-8">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-8 w-32" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // --- Empty checkout ---
  if (checkoutItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <h1 className="text-2xl font-bold">No items to checkout</h1>
        <p className="text-muted-foreground mt-2">Add items before checking out.</p>
        <Link href="/products">
          <Button className="mt-4">Continue Shopping</Button>
        </Link>
      </div>
    )
  }

  // --- No saved addresses ---
  if (addressesLoaded && savedAddresses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl pb-24 md:pb-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href={isBuyNow ? '/products' : '/cart'} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No shipping address</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                You need to add a shipping address before checking out.
              </p>
              <Link href="/profile/addresses">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-1" /> Add Address
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-24 md:pb-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href={isBuyNow ? '/products' : '/cart'} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Checkout</h1>
        {isBuyNow && (
          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            Buy Now
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left: Address & Payment */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Shipping Address</h2>
                <Link
                  href="/profile/addresses"
                  className="text-sm text-primary hover:underline"
                >
                  Manage Addresses
                </Link>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Select Address</Label>
                <Select value={selectedAddressId} onValueChange={handleAddressSelect}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue>
                      {selectedAddress ? (
                        `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.province}`
                      ) : (
                        'Select a saved address'
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start">
                    {savedAddresses.map((addr) => (
                      <SelectItem key={addr.id} value={addr.id}>
                        {addr.address}, {addr.city}, {addr.province}
                        {addr.isDefault && ' (Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Payment Method</h2>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as 'COD' | 'GCASH')}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="COD" id="cod" />
                  <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                    <img
                      src="/cod.jpg"
                      alt="Cash on Delivery"
                      className="w-6 h-6 object-contain"
                    />
                    Cash on Delivery (COD)
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="GCASH" id="gcash" />
                  <Label htmlFor="gcash" className="flex items-center gap-2 cursor-pointer">
                    <img
                      src="/gcash.png"
                      alt="GCash"
                      className="w-6 h-6 object-contain"
                    />
                    GCash
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Right: Order Summary */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Order Summary</h2>
                {isBuyNow && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Buy Now
                  </span>
                )}
              </div>

              {/* Show items in checkout */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {checkoutItems.map((item) => {
                  const basePrice = item.option ? item.option.price : item.product.price
                  const price = item.product.discount > 0
                    ? basePrice * (1 - item.product.discount / 100)
                    : basePrice
                  
                  return (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate">
                        {item.quantity}x {item.product.title}
                        {item.option && ` (${item.option.name})`}
                      </span>
                      <span>₱{(price * item.quantity).toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>₱{shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (0%)</span>
                  <span>₱0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By placing your order, you agree to our Terms of Service.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}