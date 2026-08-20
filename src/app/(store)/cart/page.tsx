'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react'

// Sample cart data - replace with actual cart state later
const initialCartItems = [
   {
      id: 1,
      name: 'Wireless Headphones',
      price: 1299,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
      quantity: 2,
      maxStock: 10,
   },
   {
      id: 2,
      name: 'Smart Watch',
      price: 2499,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
      quantity: 1,
      maxStock: 5,
   },
   {
      id: 3,
      name: 'Laptop Backpack',
      price: 899,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
      quantity: 3,
      maxStock: 8,
   },
]

export const dynamic = 'force-dynamic'

export default function CartPage() {
   const router = useRouter()
   const [cartItems, setCartItems] = useState(initialCartItems)

   const updateQuantity = (id: number, delta: number) => {
      setCartItems((prev) =>
         prev.map((item) => {
            if (item.id === id) {
               const newQuantity = Math.max(1, item.quantity + delta)
               return { ...item, quantity: Math.min(newQuantity, item.maxStock) }
            }
            return item
         })
      )
   }

   const removeItem = (id: number) => {
      setCartItems((prev) => prev.filter((item) => item.id !== id))
   }

   const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
   const shipping = subtotal > 1000 ? 0 : 150
   const tax = subtotal * 0.12
   const total = subtotal + shipping + tax

   if (cartItems.length === 0) {
      return (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-7xl min-h-screen flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
               <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Your cart is empty</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
               Looks like you haven't added any items yet.
            </p>
            <Link href="/products">
               <Button className="mt-6">Start shopping</Button>
            </Link>
         </div>
      )
   }

   const goBack = () => {
      router.back()
   }

   return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto min-h-screen pb-28 md:pb-8">
         {/* Header */}
         <div className="flex items-center gap-3 mb-8">
            <button
               onClick={goBack}
               className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
               aria-label="Go back"
            >
               <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Cart</h1>
            <span className="text-sm text-muted-foreground ml-auto">
               {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
         </div>

         {/* Mobile: Cart Items stacked */}
         <div className="lg:hidden space-y-3">
            {cartItems.map((item) => (
               <CartItemMobile
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
               />
            ))}
         </div>

         {/* Mobile Sticky Order Summary */}
         <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t px-4 py-3 shadow-lg">
            <div className="flex items-center justify-between mb-1.5">
               <span className="text-sm font-medium">Total</span>
               <span className="text-lg font-bold">₱{total.toFixed(2)}</span>
            </div>
            <Button className="w-full" size="default">
               Proceed to Checkout
            </Button>
            <div className="text-xs text-muted-foreground text-center mt-1">
               Shipping & taxes calculated at checkout
            </div>
         </div>

         {/* Desktop: Side-by-side layout (unchanged) */}
         <div className="hidden lg:grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
               <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Subtotal</div>
               </div>
               {cartItems.map((item) => (
                  <CartItemDesktop
                     key={item.id}
                     item={item}
                     onUpdateQuantity={updateQuantity}
                     onRemove={removeItem}
                  />
               ))}
            </div>
            <div className="lg:col-span-1">
               <Card>
                  <CardContent className="p-6 space-y-4">
                     <h2 className="font-semibold text-lg">Order Summary</h2>
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                           <span className="text-muted-foreground">Subtotal</span>
                           <span>₱{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-muted-foreground">Shipping</span>
                           <span>{shipping === 0 ? 'Free' : `₱${shipping.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-muted-foreground">Tax (12%)</span>
                           <span>₱{tax.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                           <span>Total</span>
                           <span>₱{total.toFixed(2)}</span>
                        </div>
                     </div>
                     <Button className="w-full">Proceed to Checkout</Button>
                  </CardContent>
               </Card>
            </div>
         </div>

         {/* Tablet: stacked layout (kept as is) */}
         <div className="hidden md:block lg:hidden">
            <div className="space-y-3">
               {cartItems.map((item) => (
                  <CartItemTablet
                     key={item.id}
                     item={item}
                     onUpdateQuantity={updateQuantity}
                     onRemove={removeItem}
                  />
               ))}
            </div>
            <Card className="mt-6 mb-20">
               <CardContent className="p-6 space-y-3">
                  <h2 className="font-semibold text-lg">Order Summary</h2>
                  <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₱{subtotal.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{shipping === 0 ? 'Free' : `₱${shipping.toFixed(2)}`}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (12%)</span>
                        <span>₱{tax.toFixed(2)}</span>
                     </div>
                     <Separator />
                     <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span>₱{total.toFixed(2)}</span>
                     </div>
                  </div>
                  <Button className="w-full">Proceed to Checkout</Button>
               </CardContent>
            </Card>
         </div>
      </div>
   )
}

// --- Mobile Cart Item ---
function CartItemMobile({ item, onUpdateQuantity, onRemove }: any) {
   return (
      <Card>
         <CardContent className="p-3 flex gap-3">
            <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
               <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start gap-1">
                  <h3 className="font-medium text-sm truncate">{item.name}</h3>
                  <button
                     onClick={() => onRemove(item.id)}
                     className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                     <Trash2 className="h-4 w-4" />
                  </button>
               </div>
               <p className="text-sm font-semibold mt-0.5">₱{item.price.toFixed(2)}</p>
               <div className="flex items-center gap-2 mt-1.5">
                  <button
                     onClick={() => onUpdateQuantity(item.id, -1)}
                     className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                     disabled={item.quantity <= 1}
                  >
                     <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                  <button
                     onClick={() => onUpdateQuantity(item.id, 1)}
                     className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                     disabled={item.quantity >= item.maxStock}
                  >
                     <Plus className="h-3 w-3" />
                  </button>
                  <span className="text-xs text-muted-foreground ml-auto">
                     ₱{(item.price * item.quantity).toFixed(2)}
                  </span>
               </div>
            </div>
         </CardContent>
      </Card>
   )
}

// --- Desktop Cart Item (unchanged) ---
function CartItemDesktop({ item, onUpdateQuantity, onRemove }: any) {
   return (
      <div className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0">
         <div className="col-span-6 flex items-center gap-3">
            <div className="relative h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
               <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            <div>
               <h3 className="font-medium text-sm">{item.name}</h3>
               <button
                  onClick={() => onRemove(item.id)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 mt-0.5"
               >
                  <Trash2 className="h-3 w-3" /> Remove
               </button>
            </div>
         </div>
         <div className="col-span-2 text-center text-sm font-medium">
            ₱{item.price.toFixed(2)}
         </div>
         <div className="col-span-2 flex items-center justify-center gap-2">
            <button
               onClick={() => onUpdateQuantity(item.id, -1)}
               className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
               disabled={item.quantity <= 1}
            >
               <Minus className="h-3 w-3" />
            </button>
            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
            <button
               onClick={() => onUpdateQuantity(item.id, 1)}
               className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
               disabled={item.quantity >= item.maxStock}
            >
               <Plus className="h-3 w-3" />
            </button>
         </div>
         <div className="col-span-2 text-right font-semibold">
            ₱{(item.price * item.quantity).toFixed(2)}
         </div>
      </div>
   )
}

// --- Tablet Cart Item (unchanged) ---
function CartItemTablet({ item, onUpdateQuantity, onRemove }: any) {
   return (
      <Card>
         <CardContent className="p-4 flex gap-4">
            <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
               <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start">
                  <h3 className="font-medium">{item.name}</h3>
                  <button
                     onClick={() => onRemove(item.id)}
                     className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                     <Trash2 className="h-4 w-4" />
                  </button>
               </div>
               <div className="flex flex-wrap items-center justify-between mt-2 gap-2">
                  <span className="text-sm font-semibold">₱{item.price.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                     <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                        disabled={item.quantity <= 1}
                     >
                        <Minus className="h-3 w-3" />
                     </button>
                     <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                     <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                        disabled={item.quantity >= item.maxStock}
                     >
                        <Plus className="h-3 w-3" />
                     </button>
                  </div>
                  <span className="text-sm font-semibold">
                     ₱{(item.price * item.quantity).toFixed(2)}
                  </span>
               </div>
            </div>
         </CardContent>
      </Card>
   )
}