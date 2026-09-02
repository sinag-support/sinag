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
import { cn } from "@/lib/utils";

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
  role?: string;
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

const deliveryStatusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "ASSIGNED_RIDER", label: "Assigned" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURNED", label: "Returned" },
];

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

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

  const [selectedRiderId, setSelectedRiderId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isAdmin = role === "ADMIN";
  const isRider = role === "RIDER";

  const fetchRiders = async () => {
    if (role !== "ADMIN") return;
    setLoadingRiders(true);
    try {
      const res = await fetch("/api/admin/users?role=RIDER");
      if (res.ok) {
        const data = await res.json();
        const ridersOnly = Array.isArray(data)
          ? data.filter((user: any) => user.role === "RIDER")
          : [];
        setRiders(ridersOnly);
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

      if (isRider) {
        params.append(
          "status",
          "ASSIGNED_RIDER,OUT_FOR_DELIVERY,READY_FOR_PICKUP",
        );
      }

      if (isAdmin && selectedRiderId !== "all") {
        params.append("riderId", selectedRiderId);
        params.append(
          "status",
          "ASSIGNED_RIDER,OUT_FOR_DELIVERY,READY_FOR_PICKUP",
        );
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
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

  // ✅ Function to fetch a single order - THIS IS THE FIX!
  const fetchOrderById = async (
    orderId: string,
  ): Promise<DeliveryOrder | null> => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) return null;
      const data = await res.json();
      // Add coordinates to the order
      if (data.address) {
        data.address.lat = cityCoordinates[data.address?.city]?.lat || 13.9411;
        data.address.lng = cityCoordinates[data.address?.city]?.lng || 121.1633;
      }
      return data;
    } catch (error) {
      console.error("Error fetching order:", error);
      return null;
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRiders();
    }
  }, [role]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedRiderId, statusFilter]);

  useEffect(() => {
    fetchDeliveryOrders();
  }, [role, page, selectedRiderId, statusFilter]);

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // ✅ UPDATED: Refresh selectedOrder after status update
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
        await fetchDeliveryOrders(); // Refresh table

        // ✅ KEY FIX: Refresh the selected order so dialog buttons update
        if (selectedOrder?.id === orderId) {
          const refreshedOrder = await fetchOrderById(orderId);
          if (refreshedOrder) {
            setSelectedOrder(refreshedOrder);
          }
        }
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

  const truncateText = (text: string | null, maxLength: number = 30) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        {isAdmin && (
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
        )}
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-20" />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: 4 }).map((_, i) => (
      <Card
        key={i}
        className="overflow-hidden !bg-background shadow-none border-border"
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16 flex-shrink-0" />
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  const renderStatCard = (
    title: string,
    value: number | string,
    icon: React.ElementType,
    subtitle: string,
  ) => {
    const Icon = icon;
    if (loading) {
      return (
        <Card className="py-4 px-2 !bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20 mt-1" />
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="py-4 px-2 !bg-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </CardContent>
      </Card>
    );
  };

  const DeliveryCard = ({ order }: { order: DeliveryOrder }) => {
    const statusColor =
      statusColors[order.status] || "bg-gray-100 text-gray-800";

    return (
      <Card className="overflow-hidden !bg-background shadow-none border-border">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  #{order.orderNumber}
                </span>
                <Badge
                  className={cn(
                    "text-[10px] px-2 py-0 h-5 flex-shrink-0",
                    statusColor,
                  )}
                >
                  {formatStatus(order.status)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {order.user?.name || order.user?.email}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {order.address?.city}
                </span>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Truck className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground truncate">
                    {getRiderName(order.rider)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold">₱{order.payable.toFixed(2)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
              {/* View Button */}
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 !bg-background hover:!bg-accent flex-shrink-0"
                onClick={() => {
                  setSelectedOrder(order);
                  setDetailOpen(true);
                }}
              >
                <MapPin className="h-3.5 w-3.5" />
              </Button>

              {/* Admin Actions */}
              {isAdmin && order.status === "OUT_FOR_DELIVERY" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 !bg-background flex-shrink-0"
                  onClick={() => updateStatus(order.id, "CANCELLED")}
                  disabled={isUpdating}
                >
                  <Ban className="h-3.5 w-3.5" />
                </Button>
              )}

              {/* Rider Actions */}
              {isRider && (
                <>
                  {order.status === "ASSIGNED_RIDER" && (
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium flex-shrink-0"
                      onClick={() => {
                        setSelectedOrder(order);
                        setDetailOpen(true);
                      }}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Start"
                      )}
                    </Button>
                  )}

                  {order.status === "OUT_FOR_DELIVERY" && (
                    <>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white font-medium flex-shrink-0"
                        onClick={() => updateStatus(order.id, "DELIVERED")}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Deliver"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 !bg-background flex-shrink-0"
                        onClick={() => updateStatus(order.id, "CANCELLED")}
                        disabled={isUpdating}
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700 !bg-background flex-shrink-0"
                        onClick={() => updateStatus(order.id, "RETURNED")}
                        disabled={isUpdating}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {order.status === "DELIVERED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700 !bg-background flex-shrink-0"
                      onClick={() => updateStatus(order.id, "RETURNED")}
                      disabled={isUpdating}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
          Delivery Management
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Manage all deliveries and filter by rider"
            : "Manage your assigned deliveries"}
        </p>
      </div>

      {/* Stats Cards - Admin only */}
      {isAdmin && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {renderStatCard(
            "Total",
            loading ? "" : totalOrders,
            Package,
            "All deliveries",
          )}
          {renderStatCard(
            "Assigned",
            loading ? "" : assignedOrders,
            Truck,
            "Ready to pick up",
          )}
          {renderStatCard(
            "Out for Delivery",
            loading ? "" : outForDelivery,
            Navigation,
            "On the way",
          )}
          {renderStatCard(
            "Delivered",
            loading ? "" : deliveredOrders,
            CheckCircle,
            "Completed",
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        {/* Mobile: Search + Refresh inline */}
        <div className="flex items-center gap-2 sm:hidden flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order #, customer, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-full !bg-background"
            />
          </div>
          <Button
            variant="outline"
            onClick={fetchDeliveryOrders}
            className="!bg-background hover:!bg-accent w-10 h-10 flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Desktop: Original layout */}
        <div className="relative flex-1 sm:max-w-sm hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order #, customer, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full !bg-background"
          />
        </div>

        {/* Desktop Refresh Button */}
        <Button
          variant="outline"
          onClick={fetchDeliveryOrders}
          className="hidden sm:inline-flex !bg-background hover:!bg-accent"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>

        {/* Mobile: Status + Rider Filter (Admin only) - inline with equal width */}
        <div className="flex sm:hidden gap-2 w-full">
          {/* Status Filter - Mobile */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="flex-1 h-8 !bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="!bg-background">
              {deliveryStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Rider Filter - Admin only on mobile */}
          {isAdmin && (
            <Select
              value={selectedRiderId}
              onValueChange={(value) => setSelectedRiderId(value)}
            >
              <SelectTrigger className="flex-1 h-8 !bg-background">
                <SelectValue placeholder="Rider" />
              </SelectTrigger>
              <SelectContent className="!bg-background">
                <SelectItem value="all">All Riders</SelectItem>
                {riders.map((rider) => (
                  <SelectItem key={rider.id} value={rider.id}>
                    {rider.name || rider.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Desktop: Rider Filter + Status Filter - Admin only */}
        {isAdmin && (
          <div className="hidden sm:flex items-center gap-2">
            <Select
              value={selectedRiderId}
              onValueChange={(value) => setSelectedRiderId(value)}
            >
              <SelectTrigger className="w-[200px] h-8 !bg-background">
                <SelectValue placeholder="All Riders" />
              </SelectTrigger>
              <SelectContent className="!bg-background">
                <SelectItem value="all">All Riders</SelectItem>
                {riders.map((rider) => (
                  <SelectItem key={rider.id} value={rider.id}>
                    {rider.name || rider.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px] h-8 !bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="!bg-background">
                {deliveryStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Desktop: Status Filter only for Rider */}
        {isRider && (
          <div className="hidden sm:block">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px] h-8 !bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="!bg-background">
                {deliveryStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-48 inline-block" />
        ) : (
          <>
            {total} {total === 1 ? "delivery" : "deliveries"} found
            {selectedRiderId !== "all" &&
              ` for ${riders.find((r) => r.id === selectedRiderId)?.name || "selected rider"}`}
            {statusFilter !== "all" &&
              ` with status ${statusFilter.replace(/_/g, " ")}`}
            {search && ` matching "${search}"`}
          </>
        )}
      </div>

      {/* Mobile: Cards View */}
      <div className="md:hidden space-y-2 -mx-4 px-4">
        {loading ? (
          renderSkeletonCards()
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search
              ? "No deliveries found matching your search"
              : "No deliveries found"}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <DeliveryCard key={order.id} order={order} />
          ))
        )}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden w-full">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[80px]">Order #</TableHead>
                <TableHead className="min-w-[120px]">Customer</TableHead>
                {isAdmin && (
                  <TableHead className="min-w-[120px]">Rider</TableHead>
                )}
                <TableHead className="min-w-[120px]">Address</TableHead>
                <TableHead className="min-w-[80px]">Amount</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="text-right min-w-[180px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderSkeletonRows()
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 7 : 6}
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
                    {isAdmin && (
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
                        {formatStatus(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      {/* View Button - Both Admin and Rider */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="!bg-background hover:!bg-accent"
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailOpen(true);
                        }}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>

                      {/* ADMIN ACTIONS - Only view and cancel */}
                      {isAdmin && (
                        <>
                          {/* Cancel Delivery - Only for OUT_FOR_DELIVERY status */}
                          {order.status === "OUT_FOR_DELIVERY" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 !bg-background"
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
                      {isRider && (
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
                                className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 !bg-background"
                                onClick={() =>
                                  updateStatus(order.id, "CANCELLED")
                                }
                                disabled={isUpdating}
                              >
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700 !bg-background"
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

                          {/* Return - Only for DELIVERED status */}
                          {order.status === "DELIVERED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700 !bg-background"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            {loading ? (
              <Skeleton className="h-4 w-32 inline-block" />
            ) : (
              `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, total)} of ${total}`
            )}
          </div>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1 || loading}
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
                    disabled={loading}
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
              disabled={page === totalPages || loading}
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
        onRefreshOrder={() =>
          selectedOrder
            ? fetchOrderById(selectedOrder.id)
            : Promise.resolve(null)
        }
      />
    </div>
  );
}
