"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  MapPin,
  Package,
  CheckCircle,
  Search,
  RefreshCw,
  Navigation,
  Truck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Ban,
  RotateCcw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeliveryOrderDetail } from "@/components/admin/delivery-order-detail";

interface DeliveryOrder {
  id: string;
  orderNumber: number;
  user: { name: string | null; email: string; phone?: string };
  rider?: { id: string; name: string | null; email: string } | null;
  address: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    lat?: number;
    lng?: number;
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
    quantity: number;
    price: number;
  }[];
}

interface Rider {
  id: string;
  name: string | null;
  email: string;
}

interface PaginatedResponse {
  orders: DeliveryOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  "Lipa City": { lat: 13.9411, lng: 121.1633 },
  "Batangas City": { lat: 13.7565, lng: 121.0583 },
  Tanauan: { lat: 14.0863, lng: 121.1499 },
  "Santo Tomas": { lat: 14.1079, lng: 121.1412 },
  Malvar: { lat: 14.0431, lng: 121.1331 },
  Bauan: { lat: 13.7916, lng: 121.0088 },
  "San Jose": { lat: 13.8781, lng: 121.1063 },
};

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
};

export default function DeliveryPage() {
  const { role } = useRole();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Admin specific states
  const [selectedRiderId, setSelectedRiderId] = useState<string>("all");

  const fetchRiders = async () => {
    if (role !== "ADMIN") return;
    setLoadingRiders(true);
    try {
      const res = await fetch("/api/admin/users?role=RIDER");
      if (res.ok) {
        const data = await res.json();
        setRiders(Array.isArray(data) ? data : []);
      } else {
        setRiders([]);
      }
    } catch (error) {
      console.error("Error fetching riders:", error);
      setRiders([]);
    } finally {
      setLoadingRiders(false);
    }
  };

  const fetchDeliveryOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (role === "RIDER") {
        params.append(
          "status",
          "ASSIGNED_RIDER,OUT_FOR_DELIVERY,READY_FOR_PICKUP",
        );
      }

      if (role === "ADMIN" && selectedRiderId !== "all") {
        params.append("riderId", selectedRiderId);
        params.append(
          "status",
          "ASSIGNED_RIDER,OUT_FOR_DELIVERY,READY_FOR_PICKUP",
        );
      }

      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data: PaginatedResponse = await res.json();

      const ordersWithCoords = (data.orders || []).map(
        (order: DeliveryOrder) => ({
          ...order,
          address: {
            ...order.address,
            lat: cityCoordinates[order.address?.city]?.lat || 13.9411,
            lng: cityCoordinates[order.address?.city]?.lng || 121.1633,
          },
        }),
      );

      setOrders(ordersWithCoords);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load delivery orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "ADMIN") {
      fetchRiders();
    }
  }, [role]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedRiderId]);

  useEffect(() => {
    fetchDeliveryOrders();
  }, [role, page, selectedRiderId]);

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("Delivery status updated");
        fetchDeliveryOrders();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = search.toLowerCase();
    return (
      order.orderNumber.toString().includes(search) ||
      order.user?.name?.toLowerCase().includes(searchLower) ||
      order.user?.email?.toLowerCase().includes(searchLower) ||
      order.address?.city?.toLowerCase().includes(searchLower)
    );
  });

  const totalOrders = orders.length;
  const assignedOrders = orders.filter(
    (o) => o.status === "ASSIGNED_RIDER",
  ).length;
  const outForDelivery = orders.filter(
    (o) => o.status === "OUT_FOR_DELIVERY",
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED").length;

  const getRiderName = (
    rider: { name: string | null; email: string } | null | undefined,
  ) => {
    if (!rider) return "Not assigned";
    return rider.name || rider.email || "Unknown Rider";
  };

  if (loading) {
    return <DeliverySkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Delivery Management</h1>
        <p className="text-muted-foreground">
          {role === "ADMIN"
            ? "Manage all deliveries and filter by rider"
            : role === "RIDER"
              ? "Manage your assigned deliveries"
              : "Delivery management"}
        </p>
      </div>

      {/* Stats Cards with py-4 px-2 on Card */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="py-4 px-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All deliveries</p>
          </CardContent>
        </Card>

        <Card className="py-4 px-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{assignedOrders}</div>
            <p className="text-xs text-muted-foreground">Ready to pick up</p>
          </CardContent>
        </Card>

        <Card className="py-4 px-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Out for Delivery
            </CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{outForDelivery}</div>
            <p className="text-xs text-muted-foreground">On the way</p>
          </CardContent>
        </Card>

        <Card className="py-4 px-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, customer, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full"
          />
        </div>

        {/* Rider Filter - Admin only */}
        {role === "ADMIN" && (
          <div className="flex items-center gap-2">
            <Select
              value={selectedRiderId}
              onValueChange={(value) => setSelectedRiderId(value)}
            >
              <SelectTrigger className="w-[200px] h-8">
                <SelectValue placeholder="All Riders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Riders</SelectItem>
                {Array.isArray(riders) &&
                  riders.map((rider) => (
                    <SelectItem key={rider.id} value={rider.id}>
                      {rider.name || rider.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedRiderId !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRiderId("all")}
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        <Button
          variant="outline"
          onClick={fetchDeliveryOrders}
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Results count with rider filter info */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "delivery" : "deliveries"} found
          {selectedRiderId !== "all" &&
            ` for ${riders.find((r) => r.id === selectedRiderId)?.name || "selected rider"}`}
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                {role === "ADMIN" && <TableHead>Rider</TableHead>}
                <TableHead>Address</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={role === "ADMIN" ? 7 : 6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {search
                      ? "No deliveries found matching your search"
                      : "No deliveries found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.orderNumber}
                    </TableCell>
                    <TableCell>
                      {order.user?.name || order.user?.email}
                    </TableCell>

                    {/* Rider column - Admin only */}
                    {role === "ADMIN" && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getRiderName(order.rider)}
                        </Badge>
                      </TableCell>
                    )}

                    <TableCell>{order.address?.city}</TableCell>
                    <TableCell>₱{order.payable.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusColors[order.status] ||
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {order.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      {/* View Button - Both Admin and Rider */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailOpen(true);
                        }}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>

                      {/* ADMIN ACTIONS - Only view and cancel */}
                      {role === "ADMIN" && (
                        <>
                          {/* Cancel Delivery - Only for OUT_FOR_DELIVERY status */}
                          {order.status === "OUT_FOR_DELIVERY" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() =>
                                updateStatus(order.id, "CANCELLED")
                              }
                              disabled={isUpdating}
                            >
                              <Ban className="h-3.5 w-3.5 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </>
                      )}

                      {/* RIDER ACTIONS */}
                      {role === "RIDER" && (
                        <>
                          {/* Start Delivery - Only for ASSIGNED_RIDER status */}
                          {order.status === "ASSIGNED_RIDER" && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                              onClick={() =>
                                updateStatus(order.id, "OUT_FOR_DELIVERY")
                              }
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Start Delivery"
                              )}
                            </Button>
                          )}

                          {/* Deliver - Only for OUT_FOR_DELIVERY status */}
                          {order.status === "OUT_FOR_DELIVERY" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-medium"
                                onClick={() =>
                                  updateStatus(order.id, "DELIVERED")
                                }
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Mark Delivered"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  updateStatus(order.id, "CANCELLED")
                                }
                                disabled={isUpdating}
                              >
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                Cancel Delivery
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700"
                                onClick={() =>
                                  updateStatus(order.id, "RETURNED")
                                }
                                disabled={isUpdating}
                              >
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                Return
                              </Button>
                            </>
                          )}

                          {/* Return - Only for DELIVERED status (customer wants to return) */}
                          {order.status === "DELIVERED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700"
                              onClick={() => updateStatus(order.id, "RETURNED")}
                              disabled={isUpdating}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Return
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 py-2">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)}{" "}
            of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className="h-8 w-8 p-0 text-sm"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Order Detail Dialog */}
      <DeliveryOrderDetail
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusUpdate={updateStatus}
        isUpdating={isUpdating}
      />
    </div>
  );
}

function DeliverySkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-24 ml-auto" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
