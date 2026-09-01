"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  ShoppingBag,
  User,
  Calendar,
  CreditCard,
  Truck,
  MapPin,
  Flag,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderItem {
  id: string;
  productId: string;
  product: {
    title: string;
    price: number;
    images: string[];
  };
  option?: {
    id: string;
    name: string;
    price: number;
  } | null;
  quantity: number;
  price: number;
  discount: number;
}

interface Rider {
  id: string;
  name: string | null;
  email: string;
}

interface Order {
  id: string;
  orderNumber: number;
  user: { name: string | null; email: string; phone?: string };
  rider?: Rider | null;
  total: number;
  payable: number;
  status: string;
  createdAt: string;
  isPaid: boolean;
  address?: { address: string; city: string; province: string };
  items?: OrderItem[];
}

// Use the same status colors as the Orders page
const statusColors: Record<string, string> = {
  PENDING: "text-yellow-600",
  CONFIRMED: "text-blue-600",
  PREPARING: "text-indigo-600",
  PACKED: "text-purple-600",
  READY_FOR_PICKUP: "text-cyan-600",
  ASSIGNED_RIDER: "text-orange-600",
  OUT_FOR_DELIVERY: "text-pink-600",
  DELIVERED: "text-green-600",
  CANCELLED: "text-red-600",
  RETURNED: "text-gray-600",
  REFUNDED: "text-gray-600",
};

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  loading: boolean;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  loading,
}: OrderDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide !bg-background">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Order #{order?.orderNumber || "..."}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <OrderDetailSkeleton />
        ) : (
          order && (
            <div className="space-y-6 py-2">
              {/* Row 1: Customer, Payment, Date - 3 columns */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                <div className="!bg-background border rounded-lg p-2.5 md:p-3">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
                    <User className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    Customer
                  </div>
                  <p className="font-medium text-xs md:text-sm truncate">
                    {order.user.name || order.user.email}
                  </p>
                  {order.user.phone && (
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                      {order.user.phone}
                    </p>
                  )}
                </div>

                <div className="!bg-background border rounded-lg p-2.5 md:p-3">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
                    <CreditCard className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    Payment
                  </div>
                  <p className="font-medium text-xs md:text-sm">
                    {order.isPaid ? "Paid" : "Unpaid"}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    ₱{order.payable.toFixed(2)}
                  </p>
                </div>

                <div className="!bg-background border rounded-lg p-2.5 md:p-3 col-span-2 md:col-span-1">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
                    <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    Date
                  </div>
                  <p className="font-medium text-xs md:text-sm">
                    {formatDate(order.createdAt)}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    {formatTime(order.createdAt)}
                  </p>
                </div>
              </div>

              {/* Row 2: Status, Rider, Address - 4 columns (Address takes 2 columns) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3">
                <div className="!bg-background border rounded-lg p-2.5 md:p-3">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
                    <Flag className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    Status
                  </div>
                  <p
                    className={`font-medium text-xs md:text-sm ${statusColors[order.status] || "text-foreground"}`}
                  >
                    {formatStatus(order.status)}
                  </p>
                </div>

                <div className="!bg-background border rounded-lg p-2.5 md:p-3">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
                    <Truck className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    Assigned Rider
                  </div>
                  <p className="font-medium text-xs md:text-sm">
                    {order.rider
                      ? order.rider.name || order.rider.email
                      : "Not assigned"}
                  </p>
                </div>

                <div className="!bg-background border rounded-lg p-2.5 md:p-3 md:col-span-2">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
                    <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    Delivery Address
                  </div>
                  {order.address ? (
                    <p className="font-medium text-xs md:text-sm truncate">
                      {order.address.address}, {order.address.city},{" "}
                      {order.address.province}
                    </p>
                  ) : (
                    <p className="text-xs md:text-sm text-muted-foreground">
                      No address provided
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-sm md:text-base mb-2 md:mb-3 flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Order Items ({order.items?.length || 0})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px] md:min-w-[280px] text-xs md:text-sm">
                          Product
                        </TableHead>
                        <TableHead className="text-right text-xs md:text-sm">
                          Qty
                        </TableHead>
                        <TableHead className="text-right text-xs md:text-sm">
                          Price
                        </TableHead>
                        <TableHead className="text-right text-xs md:text-sm">
                          Subtotal
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => {
                          const imageUrl = item.product?.images?.[0] || null;
                          const isLastItem = index === order.items!.length - 1;

                          return (
                            <TableRow
                              key={item.id}
                              className={
                                isLastItem ? "border-b-2 border-border" : ""
                              }
                            >
                              <TableCell>
                                <div className="flex items-center gap-2 md:gap-3">
                                  {imageUrl ? (
                                    <div className="relative h-10 w-10 md:h-12 md:w-12 flex-shrink-0 overflow-hidden rounded-md border bg-white">
                                      <Image
                                        src={imageUrl}
                                        alt={item.product?.title || "Product"}
                                        width={48}
                                        height={48}
                                        className="h-full w-full object-cover"
                                        unoptimized={imageUrl.startsWith(
                                          "http",
                                        )}
                                        onError={(e) => {
                                          const parent =
                                            e.currentTarget.parentElement;
                                          if (parent) {
                                            parent.style.display = "none";
                                            const fallback =
                                              parent.parentElement?.querySelector(
                                                ".fallback-icon",
                                              );
                                            if (fallback) {
                                              fallback.classList.remove(
                                                "hidden",
                                              );
                                            }
                                          }
                                        }}
                                      />
                                      <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center bg-muted">
                                        <Package className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-md border bg-muted">
                                      <Package className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-xs md:text-sm truncate max-w-[100px] md:max-w-none">
                                      {item.product?.title || "Unknown Product"}
                                    </span>
                                    {item.option && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[9px] md:text-xs w-fit"
                                      >
                                        {item.option.name}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-xs md:text-sm">
                                ×{item.quantity}
                              </TableCell>
                              <TableCell className="text-right text-xs md:text-sm">
                                ₱{item.price.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-xs md:text-sm">
                                ₱{(item.price * item.quantity).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-6 md:py-8 text-muted-foreground text-sm"
                          >
                            No items found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total Section */}
              <div className="flex justify-end">
                <div className="w-full md:w-1/3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">
                      Total
                    </span>
                    <span className="text-base md:text-lg font-bold text-primary">
                      ₱{order.payable.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6 py-2">
      {/* Row 1: Customer, Payment, Date - Skeleton only for values */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        <div className="!bg-background border rounded-lg p-2.5 md:p-3">
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
            <User className="h-3 w-3 md:h-3.5 md:w-3.5" />
            Customer
          </div>
          <Skeleton className="h-4 w-24 md:h-5 md:w-32" />
          <Skeleton className="h-3 w-28 md:h-3.5 md:w-36 mt-1" />
        </div>
        <div className="!bg-background border rounded-lg p-2.5 md:p-3">
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
            <CreditCard className="h-3 w-3 md:h-3.5 md:w-3.5" />
            Payment
          </div>
          <Skeleton className="h-4 w-16 md:h-5 md:w-20" />
          <Skeleton className="h-3 w-16 md:h-3.5 md:w-20 mt-1" />
        </div>
        <div className="!bg-background border rounded-lg p-2.5 md:p-3 col-span-2 md:col-span-1">
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
            <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" />
            Date
          </div>
          <Skeleton className="h-4 w-32 md:h-5 md:w-40" />
          <Skeleton className="h-3 w-20 md:h-3.5 md:w-24 mt-1" />
        </div>
      </div>

      {/* Row 2: Status, Rider, Address - Skeleton only for values */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3">
        <div className="!bg-background border rounded-lg p-2.5 md:p-3">
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
            <Flag className="h-3 w-3 md:h-3.5 md:w-3.5" />
            Status
          </div>
          <Skeleton className="h-4 w-20 md:h-5 md:w-24" />
        </div>
        <div className="!bg-background border rounded-lg p-2.5 md:p-3">
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
            <Truck className="h-3 w-3 md:h-3.5 md:w-3.5" />
            Assigned Rider
          </div>
          <Skeleton className="h-4 w-28 md:h-5 md:w-36" />
        </div>
        <div className="!bg-background border rounded-lg p-2.5 md:p-3 md:col-span-2">
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground mb-0.5">
            <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" />
            Delivery Address
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>

      {/* Order Items */}
      <div>
        <div className="flex items-center gap-2 mb-2 md:mb-3">
          <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          <span className="font-semibold text-sm md:text-base">
            Order Items
          </span>
          <Skeleton className="h-3 w-8 md:h-4 md:w-10 inline-block" />
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2 md:gap-3">
                      <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-md" />
                      <Skeleton className="h-4 w-24 md:h-5 md:w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-6 md:h-5 md:w-8 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-12 md:h-5 md:w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 md:h-5 md:w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-end">
        <div className="w-full md:w-1/3">
          <div className="flex justify-between items-center">
            <span className="text-xs md:text-sm font-medium text-muted-foreground">
              Total
            </span>
            <Skeleton className="h-5 w-20 md:h-6 md:w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}
