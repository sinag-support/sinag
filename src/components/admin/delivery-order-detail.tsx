"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Flag,
  Loader2,
  Package,
  User,
  MapPin,
  Ban,
  RotateCcw,
  Maximize2,
  Minimize2,
  Truck,
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import { OrderMap, useRiderLocationTracker } from "./order-map";

interface DeliveryOrder {
  id: string;
  orderNumber: number;
  user: { name: string | null; email: string; phone?: string };
  rider?: { id: string; name: string | null; email: string } | null;
  riderLat?: number | null;
  riderLng?: number | null;
  address: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    lat?: number;
    lng?: number;
    landmark?: string | null;
  };
  payable: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    product: {
      id: string;
      title: string;
      price: number;
      images: string[];
    };
    option?: {
      id: string;
      name: string;
    } | null;
    quantity: number;
    price: number;
  }[];
}

interface DeliveryOrderDetailProps {
  order: DeliveryOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (orderId: string, status: string) => Promise<void>;
  isUpdating: boolean;
  onRefreshOrder?: () => Promise<DeliveryOrder | null>;
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DeliveryOrderDetail({
  order,
  open,
  onOpenChange,
  onStatusUpdate,
  isUpdating,
  onRefreshOrder,
}: DeliveryOrderDetailProps) {
  const { role } = useRole();
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  const [showFullscreenDialog, setShowFullscreenDialog] = useState(false);
  const [showStartDeliveryDialog, setShowStartDeliveryDialog] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{
    orderId: string;
    status: string;
  } | null>(null);
  const [currentOrder, setCurrentOrder] = useState<DeliveryOrder | null>(order);

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  const isRiderTrackingActive =
    (role === "RIDER" || role === "ADMIN") &&
    currentOrder?.status === "OUT_FOR_DELIVERY";

  useRiderLocationTracker(currentOrder?.id, isRiderTrackingActive);

  if (!currentOrder) return null;

  const handleStatusUpdate = async (orderId: string, status: string) => {
    await onStatusUpdate(orderId, status);
    if (onRefreshOrder) {
      const refreshedOrder = await onRefreshOrder();
      if (refreshedOrder) {
        setCurrentOrder(refreshedOrder);
      }
    }
  };

  // ✅ Handle Start Delivery click - show confirmation dialog
  const handleStartDeliveryClick = (orderId: string) => {
    setPendingStatusUpdate({ orderId, status: "OUT_FOR_DELIVERY" });
    setShowStartDeliveryDialog(true);
  };

  // ✅ Confirm start delivery - then ask for fullscreen
  const confirmStartDelivery = async () => {
    if (!pendingStatusUpdate) return;
    setShowStartDeliveryDialog(false);

    // Start the delivery
    await handleStatusUpdate(
      pendingStatusUpdate.orderId,
      pendingStatusUpdate.status,
    );
    setPendingStatusUpdate(null);

    // ✅ Ask for fullscreen after delivery starts
    setShowFullscreenDialog(true);
  };

  const shouldShowActions = () => {
    if (role === "ADMIN") {
      return currentOrder.status === "OUT_FOR_DELIVERY";
    }
    if (role === "RIDER") {
      return ["ASSIGNED_RIDER", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
        currentOrder.status,
      );
    }
    return false;
  };

  const getActionButtons = () => {
    if (role === "ADMIN" && currentOrder.status === "OUT_FOR_DELIVERY") {
      return (
        <Button
          variant="destructive"
          className="w-full font-medium text-sm"
          onClick={() => handleStatusUpdate(currentOrder.id, "CANCELLED")}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Ban className="mr-2 h-4 w-4" />
          )}
          Cancel Delivery
        </Button>
      );
    }

    if (role === "RIDER") {
      if (currentOrder.status === "ASSIGNED_RIDER") {
        return (
          <Button
            className="w-full font-medium text-sm"
            variant="default"
            onClick={() => handleStartDeliveryClick(currentOrder.id)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Start Delivery"
            )}
          </Button>
        );
      }

      if (currentOrder.status === "OUT_FOR_DELIVERY") {
        return (
          <div className="flex flex-col gap-2 w-full">
            <Button
              className="w-full font-medium text-sm"
              variant="default"
              onClick={() => handleStatusUpdate(currentOrder.id, "DELIVERED")}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Mark Delivered"
              )}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1 font-medium text-sm"
                onClick={() => handleStatusUpdate(currentOrder.id, "CANCELLED")}
                disabled={isUpdating}
              >
                <Ban className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="outline"
                className="flex-1 font-medium text-sm text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700 !bg-background"
                onClick={() => handleStatusUpdate(currentOrder.id, "RETURNED")}
                disabled={isUpdating}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Return
              </Button>
            </div>
          </div>
        );
      }

      if (currentOrder.status === "DELIVERED") {
        return (
          <Button
            variant="outline"
            className="w-full font-medium text-sm text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700 !bg-background"
            onClick={() => handleStatusUpdate(currentOrder.id, "RETURNED")}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Return
          </Button>
        );
      }
    }

    return null;
  };

  const handleFullscreenToggle = () => {
    if (isFullscreenMap) {
      setIsFullscreenMap(false);
    } else {
      setShowFullscreenDialog(true);
    }
  };

  const confirmFullscreen = () => {
    setShowFullscreenDialog(false);
    setIsFullscreenMap(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden !bg-background",
            isFullscreenMap && "hidden",
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Delivery Details
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <OrderMap
                order={currentOrder}
                onFullscreenToggle={handleFullscreenToggle}
              />
            </div>

            <div className="space-y-4 flex flex-col">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-4 !bg-background shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <User className="h-3.5 w-3.5" />
                    Customer
                  </div>
                  <p className="font-medium text-sm truncate">
                    {currentOrder.user?.name || "Guest Customer"}
                  </p>
                  {currentOrder.user?.phone && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      {currentOrder.user.phone}
                    </p>
                  )}
                </div>

                <div className="border border-border rounded-lg p-4 !bg-background shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Address
                  </div>
                  <p className="font-medium text-sm truncate">
                    {currentOrder.address?.address}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentOrder.address?.city},{" "}
                    {currentOrder.address?.province}
                  </p>
                  {currentOrder.address?.landmark && (
                    <div className="flex items-center gap-1.5 mt-2 p-2 rounded-md bg-muted/50">
                      <Flag className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        <span className="font-medium">Landmark:</span>{" "}
                        {currentOrder.address.landmark}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 !bg-background shadow-sm flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Package className="h-3.5 w-3.5" />
                  Order Items ({currentOrder.items?.length || 0})
                </div>

                <div className="space-y-2">
                  {currentOrder.items?.map((item) => {
                    const imageUrl = item.product?.images?.[0] || null;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 text-xs p-1.5 rounded-md hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-9 w-9 rounded-md border border-border overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.product?.title || "Product"}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="truncate">
                            <p className="font-medium text-foreground truncate">
                              {item.product?.title || "Product"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.option?.name && (
                                <span className="inline-block px-1.5 py-0.2 text-[10px] font-medium bg-muted text-muted-foreground rounded border border-border">
                                  {item.option.name}
                                </span>
                              )}
                              <span className="text-[11px] text-muted-foreground">
                                Qty: {item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="font-semibold text-foreground flex-shrink-0">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                  {(!currentOrder.items || currentOrder.items.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No items found
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Total
                  </span>
                  <span className="text-lg font-bold text-primary">
                    ₱{currentOrder.payable.toFixed(2)}
                  </span>
                </div>
              </div>

              {shouldShowActions() && (
                <div className="space-y-2">{getActionButtons()}</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Map Dialog */}
      <Dialog open={isFullscreenMap} onOpenChange={setIsFullscreenMap}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] p-0 !bg-background border-0 rounded-none [&>button]:hidden">
          <div className="relative w-full h-full">
            <OrderMap
              order={currentOrder}
              isFullscreen={true}
              onFullscreenToggle={handleFullscreenToggle}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Confirmation Dialog (after start delivery) */}
      <Dialog
        open={showFullscreenDialog}
        onOpenChange={setShowFullscreenDialog}
      >
        <DialogContent className="max-w-md !bg-background">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Maximize2 className="h-5 w-5 text-primary" />
              Fullscreen Map
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {role === "RIDER"
                ? "Would you like to go fullscreen for better navigation while driving?"
                : "Would you like to view the map in fullscreen for a better view?"}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 !bg-background hover:!bg-accent"
                onClick={() => setShowFullscreenDialog(false)}
              >
                No, keep current view
              </Button>
              <Button className="flex-1" onClick={confirmFullscreen}>
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Delivery Confirmation Dialog */}
      <Dialog
        open={showStartDeliveryDialog}
        onOpenChange={setShowStartDeliveryDialog}
      >
        <DialogContent className="max-w-md !bg-background">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Start Delivery
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to start delivery for Order #
              {currentOrder.orderNumber}?
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Your location will be tracked in real-time and shared with the
              customer.
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 !bg-background hover:!bg-accent"
                onClick={() => setShowStartDeliveryDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={confirmStartDelivery}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Delivery"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
