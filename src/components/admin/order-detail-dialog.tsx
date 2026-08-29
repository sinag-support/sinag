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
  UserCog,
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
  user: { name: string | null; email: string };
  rider?: Rider | null;
  total: number;
  payable: number;
  status: string;
  createdAt: string;
  isPaid: boolean;
  address?: { address: string; city: string; province: string };
  items?: OrderItem[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-indigo-100 text-indigo-800",
  PACKED: "bg-purple-100 text-purple-800",
  READY_FOR_PICKUP: "bg-cyan-100 text-cyan-800",
  ASSIGNED_RIDER: "bg-orange-100 text-orange-800",
  OUT_FOR_DELIVERY: "bg-pink-100 text-pink-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  RETURNED: "bg-gray-100 text-gray-800",
  REFUNDED: "bg-gray-100 text-gray-800",
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

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  loading,
}: OrderDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
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
              {/* Order Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <User className="h-3 w-3" />
                    Customer
                  </div>
                  <p className="font-medium text-sm truncate">
                    {order.user.name || order.user.email}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <CreditCard className="h-3 w-3" />
                    Payment
                  </div>
                  <p className="font-medium text-sm">
                    {order.isPaid ? "Paid" : "Unpaid"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₱{order.payable.toFixed(2)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    Date
                  </div>
                  <p className="font-medium text-sm">
                    {formatDate(order.createdAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(order.createdAt)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Badge
                      className={
                        statusColors[order.status] + " text-xs px-2 py-0"
                      }
                    >
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">Status</p>
                </div>
              </div>

              {/* Rider Info - Show if assigned */}
              {order.rider && (
                <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Assigned Rider:{" "}
                    <span className="font-medium">
                      {order.rider.name || order.rider.email}
                    </span>
                  </span>
                </div>
              )}

              {/* Address */}
              {order.address && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Delivery Address
                  </p>
                  <p className="text-sm">
                    {order.address.address}, {order.address.city},{" "}
                    {order.address.province}
                  </p>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Items ({order.items?.length || 0})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[280px]">Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => {
                          const imageUrl = item.product?.images?.[0] || null;

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  {imageUrl ? (
                                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border bg-white">
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
                                        <Package className="h-5 w-5 text-muted-foreground" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border bg-muted">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex flex-col gap-1">
                                    <span className="font-medium truncate">
                                      {item.product?.title || "Unknown Product"}
                                    </span>
                                    {item.option && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs w-fit"
                                      >
                                        {item.option.name}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                ×{item.quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                ₱{item.price.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ₱{(item.price * item.quantity).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No items found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total Section with border-top */}
              <div className="flex justify-end">
                <div className="w-full md:w-1/3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      Total
                    </span>
                    <span className="text-lg font-bold text-primary">
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
    <div className="space-y-6 py-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>

      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-32" />
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
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-8 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
