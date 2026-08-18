'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

export default function CartPage() {
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
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
               <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
               </div>
               <h1 className="text-2xl font-bold">Your cart is empty</h1>
               <p className="text-muted-foreground mt-2">
                  Looks like you haven't added any items to your cart yet.
               </p>
               <Link href="/products">
                  <Button className="mt-6">
                     Continue Shopping
                  </Button>
               </Link>
            </div>
         </div>
      )
   }

   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
         {/* Header */}
         <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
               <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">Shopping Cart</h1>
            <span className="text-sm text-muted-foreground ml-auto">
               {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
         </div>

         {/* Mobile: Cart Items stacked */}
         <div className="lg:hidden space-y-4">
            {cartItems.map((item) => (
               <CartItemMobile
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
               />
            ))}

            {/* Mobile Order Summary */}
            <Card className="mt-6">
               <CardContent className="p-4 space-y-3">
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
                  <Button className="w-full mt-2" size="lg">
                     Proceed to Checkout
                  </Button>
               </CardContent>
            </Card>
         </div>

         {/* Desktop/Tablet: Side-by-side layout */}
         <div className="hidden lg:grid lg:grid-cols-3 gap-8">
            {/* Cart Items - 2 columns */}
            <div className="lg:col-span-2 space-y-4">
               {/* Header row */}
               <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
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

            {/* Order Summary - 1 column */}
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
                     <Button className="w-full mt-2" size="lg">
                        Proceed to Checkout
                     </Button>
                  </CardContent>
               </Card>
            </div>
         </div>

         {/* Tablet: Side-by-side but stacked differently */}
         <div className="hidden md:block lg:hidden">
            <div className="space-y-4">
               {cartItems.map((item) => (
                  <CartItemTablet
                     key={item.id}
                     item={item}
                     onUpdateQuantity={updateQuantity}
                     onRemove={removeItem}
                  />
               ))}
            </div>

            <Card className="mt-6">
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
                  <Button className="w-full mt-2" size="lg">
                     Proceed to Checkout
                  </Button>
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
         <CardContent className="p-4 flex gap-4">
            <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
               <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start gap-2">
                  <h3 className="font-medium text-sm truncate">{item.name}</h3>
                  <button
                     onClick={() => onRemove(item.id)}
                     className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                     <Trash2 className="h-4 w-4" />
                  </button>
               </div>
               <p className="text-sm font-semibold mt-1">₱{item.price.toFixed(2)}</p>
               <div className="flex items-center gap-2 mt-2">
                  <button
                     onClick={() => onUpdateQuantity(item.id, -1)}
                     className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                     disabled={item.quantity <= 1}
                  >
                     <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
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

// --- Desktop Cart Item ---
function CartItemDesktop({ item, onUpdateQuantity, onRemove }: any) {
   return (
      <div className="grid grid-cols-12 gap-4 items-center py-4 border-b last:border-0">
         <div className="col-span-6 flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
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

// --- Tablet Cart Item ---
function CartItemTablet({ item, onUpdateQuantity, onRemove }: any) {
   return (
      <Card>
         <CardContent className="p-4">
            <div className="flex gap-4">
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
            </div>
         </CardContent>
      </Card>
   )
}