"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  Calendar,
  Package,
  ShoppingBag,
  ArrowLeft,
  Clock,
  MapPin,
} from "lucide-react";
import { OrderDetailSheet } from "@/components/orders/order-detail-sheet";
import type { Order } from "@/types/order";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PREPARING: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  PACKED: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  READY_FOR_PICKUP: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  ASSIGNED_RIDER: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  OUT_FOR_DELIVERY: "bg-[#8EC801]/10 text-[#429801] border-[#8EC801]/20",
  DELIVERED: "bg-green-500/10 text-green-600 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
  REFUNDED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  PACKED: "Packed",
  READY_FOR_PICKUP: "Ready for Pickup",
  ASSIGNED_RIDER: "Assigned Rider",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  CONFIRMED: Package,
  PREPARING: Package,
  PACKED: Package,
  READY_FOR_PICKUP: MapPin,
  ASSIGNED_RIDER: MapPin,
  OUT_FOR_DELIVERY: MapPin,
  DELIVERED: Package,
  CANCELLED: Package,
  REFUNDED: Package,
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/orders");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setSheetOpen(true);
  };

  const goBack = () => {
    router.back();
  };

  const formatOrderNumber = (num: number) => {
    return `Order #SNG-${String(num).padStart(4, "0")}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={goBack}
            className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            My Orders
          </h1>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            When you place an order, it will appear here.
          </p>
          <Link
            href="/products"
            className="mt-6 text-sm font-medium text-primary hover:underline"
          >
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={goBack}
          className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          My Orders
        </h1>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const StatusIcon = statusIcons[order.status] || Package;
          const statusColor =
            statusColors[order.status] || statusColors.PENDING;
          const statusLabel = statusLabels[order.status] || order.status;
          const items = order.items;
          const itemCount = items.length;

          // Get up to 3 items for stacking
          const displayItems = items.slice(0, 3);
          const remainingCount = itemCount - 3;

          return (
            <Card
              key={order.id}
              className="hover:shadow-sm hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => openOrderDetail(order)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Stacked Product Images */}
                  <div className="relative h-16 w-16 flex-shrink-0">
                    {displayItems.map((item, index) => {
                      const imageUrl = item.product.images?.[0];
                      const offset = index * 5;
                      const zIndex = displayItems.length - index;

                      return (
                        <div
                          key={item.id}
                          className="absolute rounded-md overflow-hidden bg-muted border-2 border-background shadow-sm"
                          style={{
                            width: "calc(100% - 10px)",
                            height: "calc(100% - 10px)",
                            top: `${offset}px`,
                            left: `${offset}px`,
                            zIndex: zIndex,
                          }}
                        >
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
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {remainingCount > 0 && (
                      <div
                        className="absolute rounded-md bg-muted flex items-center justify-center border-2 border-background text-[10px] font-medium text-muted-foreground"
                        style={{
                          width: "calc(100% - 10px)",
                          height: "calc(100% - 10px)",
                          top: `${displayItems.length * 5}px`,
                          left: `${displayItems.length * 5}px`,
                          zIndex: 0,
                        }}
                      >
                        +{remainingCount}
                      </div>
                    )}
                  </div>

                  {/* Structured Order Info Stack */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Row 1: Order Number & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm sm:text-base tracking-tight truncate">
                        {formatOrderNumber(order.orderNumber)}
                      </p>
                      <Badge
                        className={`${statusColor} border px-2 py-0.5 text-[10px] font-medium shrink-0 inline-flex items-center`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusLabel}
                      </Badge>
                    </div>

                    {/* Row 2: Item Count & Price */}
                    <p className="text-xs text-muted-foreground font-medium">
                      {itemCount} {itemCount === 1 ? "item" : "items"} • ₱
                      {order.payable.toFixed(2)}
                    </p>

                    {/* Row 3: Date */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>
                        {new Date(order.createdAt).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <OrderDetailSheet
        order={selectedOrder}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
