"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Extended CartItem type with option
interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  optionId: string | null;
  product: {
    id: string;
    title: string;
    price: number;
    discount: number;
    images: string[];
  };
  option?: {
    id: string;
    name: string;
    price: number;
    image?: string;
    stock: number;
  } | null;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/cart");
      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }
      const data = await response.json();
      setCartItems(data.items || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item,
      ),
    );

    setUpdating(itemId);
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        await fetchCart();
        throw new Error(data.error || "Failed to update quantity");
      }

      if (data.cartItem) {
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, quantity: data.cartItem.quantity }
              : item,
          ),
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update quantity");
      await fetchCart();
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));

    setUpdating(itemId);
    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        await fetchCart();
        throw new Error(data.error || "Failed to remove item");
      }

      toast.success("Item removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove item");
      await fetchCart();
    } finally {
      setUpdating(null);
    }
  };

  // Calculate subtotal – use option price if available, then apply product discount
  const subtotal = cartItems.reduce((sum, item) => {
    const basePrice = item.option ? item.option.price : item.product.price;
    const price =
      item.product.discount > 0
        ? basePrice * (1 - item.product.discount / 100)
        : basePrice;
    return sum + price * item.quantity;
  }, 0);

  const goBack = () => {
    router.back();
  };

  // --- Skeleton Loading State ---
  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto min-h-screen pb-28 md:pb-8">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-5 w-16 ml-auto" />
        </div>

        {/* Mobile skeletons (visible on small) */}
        <div className="lg:hidden space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-3 flex gap-3">
                <Skeleton className="h-20 w-20 rounded-md flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-1/2 mt-1" />
                  <Skeleton className="h-4 w-16 mt-2" />
                  <div className="flex items-center gap-2 mt-2">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-4 w-5" />
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tablet skeletons (visible on medium) */}
        <div className="hidden md:block lg:hidden">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 flex gap-4">
                  <Skeleton className="h-20 w-20 rounded-md flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-1/2 mt-1" />
                    <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
                      <Skeleton className="h-4 w-16" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-6" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Summary skeleton */}
          <Card className="mt-6 mb-20">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
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
            </CardContent>
          </Card>
        </div>

        {/* Desktop skeletons (visible on large) */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-12 gap-4 pb-2 border-b">
              <Skeleton className="col-span-6 h-4 w-16" />
              <Skeleton className="col-span-2 h-4 w-12 text-center" />
              <Skeleton className="col-span-2 h-4 w-12 text-center" />
              <Skeleton className="col-span-2 h-4 w-16 text-right" />
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0"
              >
                <div className="col-span-6 flex items-center gap-3">
                  <Skeleton className="h-14 w-14 rounded-md" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20 mt-1" />
                    <Skeleton className="h-3 w-16 mt-2" />
                  </div>
                </div>
                <Skeleton className="col-span-2 h-4 w-16 justify-self-center" />
                <div className="col-span-2 flex items-center justify-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="col-span-2 h-4 w-16 justify-self-end" />
              </div>
            ))}
          </div>
          <div>
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
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

        {/* Mobile summary skeleton (visible on small) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between mb-1.5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-3 w-48 mx-auto mt-1" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl min-h-screen flex flex-col">
        {/* Back button - same as when items exist */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={goBack}
            className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Cart
          </h1>
          <span className="text-sm text-muted-foreground ml-auto">0 items</span>
        </div>

        {/* Empty state content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            Your cart is empty
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Looks like you haven't added any items yet.
          </p>
          <Link href="/products">
            <Button className="mt-6">Start shopping</Button>
          </Link>
        </div>
      </div>
    );
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
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Cart
        </h1>
        <span className="text-sm text-muted-foreground ml-auto">
          {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
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
            updating={updating === item.id}
          />
        ))}
      </div>

      {/* Mobile Sticky Order Summary */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-bold">₱{subtotal.toFixed(2)}</span>
        </div>
        <Link href="/checkout">
          <Button className="w-full" size="default">
            Proceed to Checkout
          </Button>
        </Link>
        <div className="text-xs text-muted-foreground text-center mt-1">
          Shipping & taxes calculated at checkout
        </div>
      </div>

      {/* Desktop: Side-by-side layout */}
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
              updating={updating === item.id}
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
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
              </div>
              <Link href="/checkout">
                <Button className="w-full" size="default">
                  Proceed to Checkout
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center">
                Shipping & taxes calculated at checkout
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tablet: stacked layout */}
      <div className="hidden md:block lg:hidden">
        <div className="space-y-3">
          {cartItems.map((item) => (
            <CartItemTablet
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              updating={updating === item.id}
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
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
            </div>
            <Link href="/checkout">
              <Button className="w-full" size="default">
                Proceed to Checkout
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground text-center">
              Shipping & taxes calculated at checkout
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Shared helper to compute price ---
function getEffectivePrice(item: CartItem): number {
  const basePrice = item.option ? item.option.price : item.product.price;
  return item.product.discount > 0
    ? basePrice * (1 - item.product.discount / 100)
    : basePrice;
}

// --- Mobile Cart Item ---
function CartItemMobile({ item, onUpdateQuantity, onRemove, updating }: any) {
  const price = getEffectivePrice(item);
  const imageUrl = item.option?.image || item.product.images?.[0] || "";

  return (
    <Card>
      <CardContent className="p-3 flex gap-3">
        <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.product.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1">
            <div>
              <h3 className="font-medium text-sm truncate">
                {item.product.title}
              </h3>
              {item.option && (
                <p className="text-xs text-muted-foreground truncate">
                  {item.option.name}
                </p>
              )}
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              disabled={updating}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm font-semibold mt-0.5">₱{price.toFixed(2)}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
              disabled={item.quantity <= 1 || updating}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-sm font-medium w-5 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
              disabled={updating}
            >
              <Plus className="h-3 w-3" />
            </button>
            <span className="text-xs text-muted-foreground ml-auto">
              ₱{(price * item.quantity).toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Desktop Cart Item ---
function CartItemDesktop({ item, onUpdateQuantity, onRemove, updating }: any) {
  const price = getEffectivePrice(item);
  const imageUrl = item.option?.image || item.product.images?.[0] || "";

  return (
    <div className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-0">
      <div className="col-span-6 flex items-center gap-3">
        <div className="relative h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.product.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div>
          <h3 className="font-medium text-sm">{item.product.title}</h3>
          {item.option && (
            <p className="text-xs text-muted-foreground">{item.option.name}</p>
          )}
          <button
            onClick={() => onRemove(item.id)}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 mt-2"
            disabled={updating}
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        </div>
      </div>
      <div className="col-span-2 text-center text-sm font-medium">
        ₱{price.toFixed(2)}
      </div>
      <div className="col-span-2 flex items-center justify-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
          disabled={item.quantity <= 1 || updating}
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="text-sm font-medium w-6 text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
          disabled={updating}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className="col-span-2 text-right font-semibold">
        ₱{(price * item.quantity).toFixed(2)}
      </div>
    </div>
  );
}

// --- Tablet Cart Item ---
function CartItemTablet({ item, onUpdateQuantity, onRemove, updating }: any) {
  const price = getEffectivePrice(item);
  const imageUrl = item.option?.image || item.product.images?.[0] || "";

  return (
    <Card>
      <CardContent className="p-4 flex gap-4">
        <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.product.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{item.product.title}</h3>
              {item.option && (
                <p className="text-xs text-muted-foreground">
                  {item.option.name}
                </p>
              )}
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              disabled={updating}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between mt-2 gap-2">
            <span className="text-sm font-semibold">₱{price.toFixed(2)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                disabled={item.quantity <= 1 || updating}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-medium w-6 text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                disabled={updating}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="text-sm font-semibold">
              ₱{(price * item.quantity).toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
