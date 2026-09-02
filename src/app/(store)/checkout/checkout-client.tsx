"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  ChevronLeft,
  MapPin,
  Plus,
  ShoppingBag,
  CheckCircle2,
  Package,
} from "lucide-react";

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
    stock: number;
  } | null;
}

// ✅ Add landmark to Address interface
interface Address {
  id: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  landmark?: string | null;
}

interface BuyNowItem {
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
    stock: number;
  } | null;
}

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [isBuyNow, setIsBuyNow] = useState(false);

  // ✅ Success dialog states
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedOrderNumber, setPlacedOrderNumber] = useState<number | null>(
    null,
  );

  // Selected address
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false);

  // Payment - Only COD for now
  const [paymentMethod, setPaymentMethod] = useState<"COD">("COD");

  // Check if this is a buy now purchase
  useEffect(() => {
    const isBuyNowParam = searchParams.get("buyNow");
    const productId = searchParams.get("productId");
    const quantity = parseInt(searchParams.get("quantity") || "1");
    const optionId = searchParams.get("optionId") || null;

    if (isBuyNowParam === "true" && productId) {
      setIsBuyNow(true);
      fetchBuyNowProduct(productId, quantity, optionId);
    } else {
      fetchCart();
      fetchAddresses();
    }
  }, [searchParams]);

  const fetchBuyNowProduct = async (
    productId: string,
    quantity: number,
    optionId: string | null,
  ) => {
    try {
      const response = await fetch("/api/checkout/buy-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, optionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch product");
      }

      const data = await response.json();
      setBuyNowItem({
        productId: data.product.id,
        quantity: data.quantity,
        optionId: optionId,
        product: data.product,
        option: data.option,
      });

      await fetchAddresses();
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching buy now product:", error);
      toast.error(error.message || "Failed to load product");
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/cart");
      if (!response.ok) throw new Error("Failed to fetch cart");
      const data = await response.json();
      setCartItems(data.items || []);
      await fetchAddresses();
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load cart");
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/addresses");
      if (!response.ok) {
        setAddressesLoaded(true);
        return;
      }
      const data = await response.json();
      setSavedAddresses(data);
      setAddressesLoaded(true);

      const defaultAddr = data.find((a: Address) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setSelectedAddress(defaultAddr);
      } else if (data.length > 0) {
        setSelectedAddressId(data[0].id);
        setSelectedAddress(data[0]);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setAddressesLoaded(true);
    }
  };

  const handleAddressSelect = (value: string | null) => {
    if (!value) return;
    setSelectedAddressId(value);
    const addr = savedAddresses.find((a) => a.id === value);
    if (addr) setSelectedAddress(addr);
  };

  const getCheckoutItems = () => {
    if (isBuyNow && buyNowItem) {
      return [
        {
          id: "buy-now-" + Date.now(),
          productId: buyNowItem.productId,
          quantity: buyNowItem.quantity,
          optionId: buyNowItem.optionId,
          product: buyNowItem.product,
          option: buyNowItem.option,
        },
      ];
    }
    return cartItems;
  };

  const checkoutItems = getCheckoutItems();

  const subtotal = checkoutItems.reduce((sum, item) => {
    const basePrice = item.option ? item.option.price : item.product.price;
    const price =
      item.product.discount > 0
        ? basePrice * (1 - item.product.discount / 100)
        : basePrice;
    return sum + price * item.quantity;
  }, 0);

  const shipping = 60;
  const vat = 0;
  const total = subtotal + shipping + vat;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    if (checkoutItems.length === 0) {
      toast.error("No items to checkout");
      return;
    }

    setPlacingOrder(true);
    try {
      const orderPayload = {
        address: selectedAddress.address,
        city: selectedAddress.city,
        province: selectedAddress.province,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country,
        landmark: selectedAddress.landmark || null,
        paymentMethod,
        shipping,
        vat,
        isBuyNow,
        items: isBuyNow
          ? checkoutItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              optionId: item.optionId,
              price: item.option ? item.option.price : item.product.price,
            }))
          : undefined,
      };

      console.log("📦 Placing order with payload:", orderPayload);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();
      console.log("📦 Order response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      // ✅ Store order info and show success dialog
      setPlacedOrderId(data.orderId);
      setPlacedOrderNumber(data.orderNumber);
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error("❌ Order error:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

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
    );
  }

  // --- Empty checkout ---
  if (checkoutItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <h1 className="text-2xl font-bold">No items to checkout</h1>
        <p className="text-muted-foreground mt-2">
          Add items before checking out.
        </p>
        <Link href="/products">
          <Button className="mt-4">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  // --- No saved addresses ---
  if (addressesLoaded && savedAddresses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl pb-24 md:pb-8">
        <div className="flex items-center gap-2 mb-6">
          <Link
            href={isBuyNow ? "/products" : "/cart"}
            className="text-muted-foreground hover:text-foreground"
          >
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
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl pb-24 md:pb-8 overflow-x-hidden">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Link
            href={isBuyNow ? "/products" : "/cart"}
            className="text-muted-foreground hover:text-foreground"
          >
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
          <div className="md:col-span-2 space-y-6 min-w-0">
            <Card>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-semibold text-base sm:text-lg">
                    Shipping Address
                  </h2>
                  <Link
                    href="/profile/addresses"
                    className="text-sm text-primary hover:underline"
                  >
                    Manage Addresses
                  </Link>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Select Address</Label>
                  <Select
                    value={selectedAddressId}
                    onValueChange={handleAddressSelect}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue>
                        {selectedAddress
                          ? `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.province}`
                          : "Select a saved address"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start">
                      {savedAddresses.map((addr) => (
                        <SelectItem key={addr.id} value={addr.id}>
                          {addr.address}, {addr.city}, {addr.province}
                          {addr.isDefault && " (Default)"}
                          {addr.landmark && ` (${addr.landmark})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAddress?.landmark && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="font-medium">Landmark:</span>{" "}
                    {selectedAddress.landmark}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <h2 className="font-semibold text-base sm:text-lg">
                  Payment Method
                </h2>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(val) => setPaymentMethod(val as "COD")}
                  className="flex flex-col space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="COD" id="cod" />
                    <Label
                      htmlFor="cod"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <img
                        src="/cod.jpg"
                        alt="Cash on Delivery"
                        className="w-6 h-6 object-contain"
                      />
                      Cash on Delivery (COD)
                    </Label>
                  </div>
                  {/* GCash disabled for now */}
                  <div className="flex items-center space-x-3 opacity-50 cursor-not-allowed">
                    <RadioGroupItem value="GCASH" id="gcash" disabled />
                    <Label
                      htmlFor="gcash"
                      className="flex items-center gap-2 cursor-not-allowed"
                    >
                      <img
                        src="/gcash.png"
                        alt="GCash"
                        className="w-6 h-6 object-contain"
                      />
                      GCash (Coming Soon)
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className="md:col-span-1 min-w-0">
            <Card>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-base sm:text-lg">
                    Order Summary
                  </h2>
                  {isBuyNow && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Buy Now
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {checkoutItems.map((item) => {
                    const basePrice = item.option
                      ? item.option.price
                      : item.product.price;
                    const price =
                      item.product.discount > 0
                        ? basePrice * (1 - item.product.discount / 100)
                        : basePrice;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-0.5 py-1 border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center justify-between w-full min-w-0">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <span className="text-xs font-medium text-muted-foreground shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="text-sm truncate">
                              {item.product.title}
                            </span>
                          </div>
                          <span className="text-sm font-medium shrink-0 ml-2">
                            ₱{(price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        {item.option && (
                          <div className="text-xs text-muted-foreground pl-5">
                            {item.option.name}
                          </div>
                        )}
                      </div>
                    );
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
                    "Place Order"
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

      {/* ✅ Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md !bg-background">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">
              Order Placed! 🎉
            </DialogTitle>
            <DialogDescription className="text-center">
              Your order has been successfully placed and is being processed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-lg font-bold text-primary">
                #SNG-{String(placedOrderNumber || 0).padStart(4, "0")}
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Package className="h-4 w-4 shrink-0" />
              <span>You will receive a confirmation email shortly.</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => {
                  setShowSuccessDialog(false);
                  router.push("/profile/orders");
                }}
              >
                View My Orders
              </Button>
              <Button
                variant="outline"
                className="flex-1 !bg-background hover:!bg-accent"
                onClick={() => {
                  setShowSuccessDialog(false);
                  router.push("/products");
                }}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
