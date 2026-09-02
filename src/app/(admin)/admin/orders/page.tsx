"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Eye,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
  DollarSign,
  Package,
  User,
  Calendar,
  CreditCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { OrderDetailDialog } from "@/components/admin/order-detail-dialog";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const statusOptions = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "PACKED",
  "READY_FOR_PICKUP",
  "ASSIGNED_RIDER",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

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

interface OrderItem {
  id: string;
  productId: string;
  product: {
    title: string;
    price: number;
    images: string[];
  };
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

interface PaginatedResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function OrdersPage() {
  const { role } = useRole();
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editRiderId, setEditRiderId] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundingOrder, setRefundingOrder] = useState<Order | null>(null);
  const [refunding, setRefunding] = useState(false);

  // ✅ Fetch only RIDER users
  const fetchRiders = async () => {
    if (role !== "ADMIN") return;
    setLoadingRiders(true);
    try {
      const res = await fetch("/api/admin/users?role=RIDER");
      if (res.ok) {
        const data = await res.json();
        // ✅ Filter to only show RIDER role
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data: PaginatedResponse = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [role]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, page]);

  const fetchOrderDetail = async (orderId: string) => {
    setDetailOpen(true);
    setLoadingDetail(true);
    setSelectedOrder(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      setSelectedOrder(data);
    } catch (error) {
      console.error("Failed to load order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success("Order status updated");
        fetchOrders();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleRefundOrder = async () => {
    if (!refundingOrder) return;

    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/orders/${refundingOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REFUNDED" }),
      });

      if (res.ok) {
        toast.success("Order refunded successfully");
        setRefundDialogOpen(false);
        setRefundingOrder(null);
        fetchOrders();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to refund order");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setRefunding(false);
    }
  };

  const openRefundDialog = (order: Order) => {
    setRefundingOrder(order);
    setRefundDialogOpen(true);
  };

  const handleEditOrder = async () => {
    if (!editingOrder) return;

    setUpdating(true);
    try {
      if (editStatus !== editingOrder.status) {
        await handleStatusUpdate(editingOrder.id, editStatus);
      }

      if (role === "ADMIN" && editRiderId !== (editingOrder.rider?.id || "")) {
        const riderIdToAssign = editRiderId || null;

        const res = await fetch(
          `/api/admin/orders/${editingOrder.id}/assign-rider`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ riderId: riderIdToAssign }),
          },
        );

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to update rider");
          setUpdating(false);
          return;
        } else {
          toast.success(
            riderIdToAssign ? "Rider assigned successfully" : "Rider removed",
          );
        }
      }

      setEditDialogOpen(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${deletingOrder.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Order deleted successfully");
        setDeleteDialogOpen(false);
        setDeletingOrder(null);
        fetchOrders();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    } finally {
      setDeleting(false);
    }
  };

  function formatStatus(status: string) {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const openDeleteDialog = (order: Order) => {
    setDeletingOrder(order);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (order: Order) => {
    setEditingOrder(order);
    setEditStatus(order.status);
    setEditRiderId(order.rider?.id || "");
    setEditDialogOpen(true);
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getRiderName = (rider: Rider | null | undefined) => {
    if (!rider) return "Not assigned";
    return rider.name || rider.email || "Unknown Rider";
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
        {role === "ADMIN" && (
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
        )}
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Card
        key={i}
        className="overflow-hidden !bg-background shadow-none border-border"
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const statusColor =
      statusColors[order.status] || "bg-gray-100 text-gray-800";
    const isAdmin = role === "ADMIN";
    const isStaff = role === "STAFF";

    return (
      <Card className="overflow-hidden !bg-background shadow-none border-border">
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-sm">#{order.orderNumber}</h3>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {order.user.name || order.user.email}
                </p>
              </div>
            </div>
            <Badge className={statusColor}>{formatStatus(order.status)}</Badge>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                ₱{order.payable.toFixed(2)}
              </span>
              <Badge
                variant={order.isPaid ? "default" : "secondary"}
                className="text-[10px] px-2 py-0 h-5"
              >
                {order.isPaid ? "Paid" : "Unpaid"}
              </Badge>
              {isAdmin && (
                <span className="text-[10px]">{getRiderName(order.rider)}</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 !bg-background hover:!bg-accent"
                onClick={() => fetchOrderDetail(order.id)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              {(isAdmin || isStaff) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 !bg-background hover:!bg-accent"
                  onClick={() => openEditDialog(order)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {(isAdmin || isStaff) &&
                order.status === "RETURNED" &&
                !order.isPaid && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700 !bg-background"
                    onClick={() => openRefundDialog(order)}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                  </Button>
                )}
              {isAdmin && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 w-7 p-0"
                  onClick={() => openDeleteDialog(order)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            {role === "ADMIN" && "Full order management with rider assignment"}
            {role === "STAFF" && "Process and manage orders"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24 ml-auto" />
        </div>
        <div className="md:hidden space-y-2">{renderSkeletonCards()}</div>
        <div className="hidden md:block border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                {role === "ADMIN" && <TableHead>Assigned Rider</TableHead>}
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderSkeletonRows()}</TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          {role === "ADMIN" && "Full order management with rider assignment"}
          {role === "STAFF" && "Process and manage orders"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or customer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full !bg-background"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val: string | null) => setStatusFilter(val || "ALL")}
        >
          <SelectTrigger className="w-40 h-8 !bg-background">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="!bg-background">
            <SelectItem value="ALL">All statuses</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={fetchOrders}
          className="ml-auto !bg-background hover:!bg-accent"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-32 inline-block" />
        ) : (
          <>
            {total} {total === 1 ? "order" : "orders"} found
            {statusFilter !== "ALL" &&
              ` with status ${statusFilter.replace("_", " ")}`}
            {search && ` matching "${search}"`}
          </>
        )}
      </div>

      {/* Mobile: Cards View */}
      <div className="md:hidden space-y-2">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search || statusFilter !== "ALL"
              ? "No orders found matching your filters"
              : "No orders found"}
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                {role === "ADMIN" && <TableHead>Assigned Rider</TableHead>}
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={role === "ADMIN" ? 8 : 7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {search || statusFilter !== "ALL"
                      ? "No orders found matching your filters"
                      : "No orders found"}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.orderNumber}
                    </TableCell>
                    <TableCell>{order.user.name || order.user.email}</TableCell>

                    {/* Rider Column - Admin only */}
                    {role === "ADMIN" && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getRiderName(order.rider)}
                        </Badge>
                      </TableCell>
                    )}

                    <TableCell>₱{order.payable.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {formatStatus(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.isPaid ? "default" : "secondary"}>
                        {order.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      {/* View Button - Everyone */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="!bg-background hover:!bg-accent"
                        onClick={() => fetchOrderDetail(order.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit Button - Admin and Staff */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="!bg-background hover:!bg-accent"
                        onClick={() => openEditDialog(order)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Refund Button - Admin and Staff for RETURNED status only */}
                      {(role === "ADMIN" || role === "STAFF") &&
                        order.status === "RETURNED" &&
                        !order.isPaid && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700 !bg-background"
                            onClick={() => openRefundDialog(order)}
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-1" />
                            Refund
                          </Button>
                        )}

                      {/* Delete Button - Admin only */}
                      {role === "ADMIN" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(order)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      {/* Edit Order Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialogOpen(false);
            setEditingOrder(null);
          }
        }}
      >
        <DialogContent className="max-w-md !bg-background">
          <DialogHeader>
            <DialogTitle>Edit Order #{editingOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Update the status{role === "ADMIN" && " or assign a rider"} to
              this order.
            </DialogDescription>
          </DialogHeader>

          {editingOrder && (
            <div className="space-y-4 py-2">
              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger id="status" className="w-full !bg-background">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="!bg-background">
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {formatStatus(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rider Assignment - Admin only */}
              {role === "ADMIN" && (
                <div className="space-y-2">
                  <Label htmlFor="rider">Assign Rider</Label>
                  <Select value={editRiderId} onValueChange={setEditRiderId}>
                    <SelectTrigger id="rider" className="w-full !bg-background">
                      <SelectValue placeholder="Select a rider" />
                    </SelectTrigger>
                    <SelectContent className="!bg-background">
                      <SelectItem value="">None</SelectItem>
                      {riders.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id}>
                          {rider.name || rider.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Current Info */}
              <div className="!bg-background border rounded-lg p-3 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Customer:</span>{" "}
                  {editingOrder.user.name || editingOrder.user.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Total:</span> ₱
                  {editingOrder.payable.toFixed(2)}
                </p>
                <p>
                  <span className="text-muted-foreground">Current Rider:</span>{" "}
                  {getRiderName(editingOrder.rider)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingOrder(null);
                  }}
                  disabled={updating}
                  className="!bg-background hover:!bg-accent"
                >
                  Cancel
                </Button>
                <Button onClick={handleEditOrder} disabled={updating}>
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Admin only */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="!bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Order #{deletingOrder?.orderNumber}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be
              undone.
              {deletingOrder && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>{" "}
                    {deletingOrder.user.name || deletingOrder.user.email}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span> ₱
                    {deletingOrder.payable.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {deletingOrder.status.replace("_", " ")}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="!bg-background hover:!bg-accent"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent className="!bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Refund Order #{refundingOrder?.orderNumber}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund this order? This will mark the
              order as refunded and process the refund.
              {refundingOrder && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>{" "}
                    {refundingOrder.user.name || refundingOrder.user.email}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span> ₱
                    {refundingOrder.payable.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {refundingOrder.status.replace("_", " ")}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={refunding}
              className="!bg-background hover:!bg-accent"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefundOrder}
              disabled={refunding}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {refunding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refunding...
                </>
              ) : (
                "Confirm Refund"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        order={selectedOrder}
        loading={loadingDetail}
      />
    </div>
  );
}
