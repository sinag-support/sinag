"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface RiderOrder {
  id: string;
  orderNumber: number;
  total: number;
  status: string;
  createdAt: string;
  address: { city: string };
  user: { name: string | null; email: string };
  rider?: { name: string | null; email: string };
}

interface RiderStats {
  total: number;
  assigned: number;
  outForDelivery: number;
  delivered: number;
  recentOrders: RiderOrder[];
}

interface StaffStats {
  total: number;
  pending: number;
  outForDelivery: number;
  completed: number;
}

interface Stats {
  revenue: number;
  orders: number;
  products: number;
  users: number;
  recentOrders: {
    id: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  lowStock: { id: string; title: string; stock: number }[];
  pendingOrders?: number;
  outForDelivery?: number;
  ordersByStatus?: { status: string; count: number }[];
  revenueData?: { date: string; revenue: number }[];
  monthlyRevenueData?: { date: string; revenue: number }[];
  yearlyRevenueData?: { date: string; revenue: number }[];
  riderOrders?: RiderStats;
  staffOrders?: StaffStats;
  allRiderStats?: RiderStats;
}

type RevenuePeriod = "week" | "month" | "year" | "full";

export default function AdminDashboard() {
  const { role } = useRole();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewRole, setViewRole] = useState<string>("ADMIN");
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("week");
  const [revenueData, setRevenueData] = useState<
    { date: string; revenue: number }[]
  >([]);

  const isAdmin = role === "ADMIN";
  const isStaff = role === "STAFF";
  const isRider = role === "RIDER";

  // Active view role selection logic
  const activeRole = isAdmin ? viewRole : role;

  useEffect(() => {
    if (role) {
      fetchStats();
    }
  }, [role, viewRole]);

  useEffect(() => {
    if (stats) {
      filterRevenueData(revenuePeriod);
    }
  }, [stats, revenuePeriod]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();

      let riderOrdersData: RiderStats | undefined = undefined;
      let allRiderOrdersData: RiderStats | undefined = undefined;
      let staffOrdersData: StaffStats | undefined = undefined;

      // RIDER VIEW: Individual rider's assigned orders
      if (isRider) {
        try {
          const url =
            "/api/admin/orders?status=ASSIGNED_RIDER,OUT_FOR_DELIVERY,READY_FOR_PICKUP,DELIVERED";
          const riderOrdersRes = await fetch(url);
          if (riderOrdersRes.ok) {
            const riderOrders = await riderOrdersRes.json();
            const orders = riderOrders.orders || [];

            riderOrdersData = {
              total: orders.length,
              assigned: orders.filter(
                (o: any) =>
                  o.status === "ASSIGNED_RIDER" ||
                  o.status === "READY_FOR_PICKUP",
              ).length,
              outForDelivery: orders.filter(
                (o: any) => o.status === "OUT_FOR_DELIVERY",
              ).length,
              delivered: orders.filter((o: any) => o.status === "DELIVERED")
                .length,
              recentOrders: orders.slice(0, 5).map((o: any) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                total: o.payable,
                status: o.status,
                createdAt: o.createdAt,
                address: o.address,
                user: o.user,
              })),
            };
          }
        } catch (err) {
          console.error("Error fetching rider orders:", err);
        }
      }

      // ADMIN VIEWING RIDER TAB: Aggregated data for ALL riders
      if (isAdmin && activeRole === "RIDER") {
        try {
          const url =
            "/api/admin/orders?status=ASSIGNED_RIDER,OUT_FOR_DELIVERY,READY_FOR_PICKUP,DELIVERED";
          const riderOrdersRes = await fetch(url);
          if (riderOrdersRes.ok) {
            const riderOrders = await riderOrdersRes.json();
            const orders = riderOrders.orders || [];

            allRiderOrdersData = {
              total: orders.length,
              assigned: orders.filter(
                (o: any) =>
                  o.status === "ASSIGNED_RIDER" ||
                  o.status === "READY_FOR_PICKUP",
              ).length,
              outForDelivery: orders.filter(
                (o: any) => o.status === "OUT_FOR_DELIVERY",
              ).length,
              delivered: orders.filter((o: any) => o.status === "DELIVERED")
                .length,
              recentOrders: orders.slice(0, 5).map((o: any) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                total: o.payable,
                status: o.status,
                createdAt: o.createdAt,
                address: o.address,
                user: o.user,
                rider: o.rider,
              })),
            };
          }
        } catch (err) {
          console.error("Error fetching all rider orders:", err);
        }
      }

      // STAFF OR ADMIN VIEWING STAFF TAB: Aggregated ALL staff stats
      if (isStaff || (isAdmin && activeRole === "STAFF")) {
        staffOrdersData = {
          total: data.orders ?? 0,
          pending: data.pendingOrders ?? 0,
          outForDelivery: data.outForDelivery ?? 0,
          completed:
            data.recentOrders?.filter((o: any) => o.status === "DELIVERED")
              .length ?? 0,
        };
      }

      setStats({
        revenue: data.revenue ?? 0,
        orders: data.orders ?? 0,
        products: data.products ?? 0,
        users: data.users ?? 0,
        recentOrders: data.recentOrders ?? [],
        lowStock: data.lowStock ?? [],
        pendingOrders: data.pendingOrders ?? 0,
        outForDelivery: data.outForDelivery ?? 0,
        ordersByStatus: data.ordersByStatus ?? [],
        revenueData: data.revenueData ?? [],
        monthlyRevenueData: data.monthlyRevenueData ?? [],
        yearlyRevenueData: data.yearlyRevenueData ?? [],
        riderOrders: riderOrdersData,
        allRiderStats: allRiderOrdersData,
        staffOrders: staffOrdersData,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const filterRevenueData = (period: RevenuePeriod) => {
    if (!stats) return;

    let data: { date: string; revenue: number }[] = [];

    switch (period) {
      case "week":
        data = stats.revenueData || [];
        break;
      case "month":
        data = stats.monthlyRevenueData || [];
        break;
      case "year":
        data = stats.yearlyRevenueData || [];
        break;
      case "full":
        data = stats.yearlyRevenueData || stats.revenueData || [];
        break;
      default:
        data = stats.revenueData || [];
    }

    setRevenueData(data);
  };

  const recentOrders = stats?.recentOrders || [];
  const lowStock = stats?.lowStock || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  const formatLongDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatStatus = (statusStr: string) => {
    return statusStr
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const statusCounts = {
    pending:
      stats?.pendingOrders ||
      recentOrders.filter((o) => o.status === "PENDING").length,
    inTransit:
      stats?.outForDelivery ||
      recentOrders.filter((o) => o.status === "OUT_FOR_DELIVERY").length,
    completed: recentOrders.filter((o) => o.status === "DELIVERED").length,
    cancelled: recentOrders.filter((o) => o.status === "CANCELLED").length,
  };

  const topLowStock = lowStock.slice(0, 3);

  return (
    <div className="flex-1 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h2>
          <div className="sm:hidden">
            <ThemeToggle />
          </div>
        </div>

        {/* Tab switcher - ONLY Visible for Admin */}
        {isAdmin && (
          <Tabs
            value={viewRole}
            onValueChange={(value) => setViewRole(value)}
            className="w-auto"
          >
            <TabsList className="bg-background border border-border p-1 rounded-lg w-auto">
              <TabsTrigger
                value="ADMIN"
                className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md font-medium"
              >
                Admin
              </TabsTrigger>
              <TabsTrigger
                value="STAFF"
                className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md font-medium"
              >
                Staff
              </TabsTrigger>
              <TabsTrigger
                value="RIDER"
                className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md font-medium"
              >
                Rider
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* --- ADMIN VIEW --- */}
      {activeRole === "ADMIN" && isAdmin && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Revenue" icon={DollarSign} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                ₱
                {stats?.revenue.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-[#59A630]" /> +12%
              </p>
            </StatCard>

            <StatCard
              title="Total Orders"
              icon={ShoppingCart}
              loading={loading}
            >
              <div className="text-base sm:text-2xl font-bold">
                {stats?.orders || 0}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                +5% from last month
              </p>
            </StatCard>

            <StatCard title="Active Products" icon={Package} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {stats?.products || 0}
              </div>
              <p
                className={cn(
                  "text-[10px] sm:text-xs mt-1",
                  lowStock.length > 0
                    ? "text-destructive font-medium"
                    : "text-muted-foreground",
                )}
              >
                {lowStock.length > 0
                  ? `${lowStock.length} items low`
                  : "All inventory healthy"}
              </p>
            </StatCard>

            <StatCard title="Active Users" icon={Users} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {stats?.users || 0}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                +3% from last month
              </p>
            </StatCard>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 rounded-xl bg-background text-card-foreground shadow-none px-2 py-4">
              <CardHeader className="flex flex-row items-center justify-between pb-4 p-0 px-2">
                <CardTitle className="text-base font-semibold">
                  Revenue Analytics
                </CardTitle>
                <Tabs
                  value={revenuePeriod}
                  onValueChange={(v) => setRevenuePeriod(v as RevenuePeriod)}
                >
                  <TabsList className="h-8 p-1 bg-background border border-border">
                    <TabsTrigger value="week" className="text-xs px-2 h-6">
                      Week
                    </TabsTrigger>
                    <TabsTrigger value="month" className="text-xs px-2 h-6">
                      Month
                    </TabsTrigger>
                    <TabsTrigger value="year" className="text-xs px-2 h-6">
                      Year
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="pt-2 px-2">
                <div className="h-[250px] sm:h-[350px]">
                  {loading ? (
                    <Skeleton className="w-full h-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={revenueData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="date"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={formatDate}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `₱${value}`}
                        />
                        <Tooltip
                          formatter={(value: any) => [
                            `₱${Number(value).toFixed(2)}`,
                            "Revenue",
                          ]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="#59A630"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-4 md:col-span-2 lg:col-span-3 rounded-xl bg-background text-card-foreground shadow-none px-2 py-4">
              <CardHeader className="p-0 px-2 pb-4">
                <CardTitle className="text-base font-semibold">
                  Order Fulfillment Summary
                </CardTitle>
                <CardDescription>
                  Current status breakdown for processing orders.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 px-2 space-y-3">
                <OrderStatusItem
                  icon={Clock}
                  label="Pending Orders"
                  description="Awaiting processing"
                  count={statusCounts.pending}
                  loading={loading}
                />
                <OrderStatusItem
                  icon={Truck}
                  label="In Transit"
                  description="Out for delivery"
                  count={statusCounts.inTransit}
                  loading={loading}
                />
                <OrderStatusItem
                  icon={CheckCircle}
                  label="Completed"
                  description="Successfully delivered"
                  count={statusCounts.completed}
                  loading={loading}
                />
                <OrderStatusItem
                  icon={AlertCircle}
                  label="Cancelled"
                  description="Returned or cancelled"
                  count={statusCounts.cancelled}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </div>

          {!loading && lowStock.length > 0 && (
            <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4">
              <CardHeader className="p-0 px-2 pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Low Stock Alert
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-destructive border-destructive/30 text-[10px] font-medium"
                >
                  {lowStock.length} Items Need Restock
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-0 px-2">
                {topLowStock.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center text-xs bg-background p-2.5 rounded-lg border border-border"
                  >
                    <span className="font-medium truncate text-muted-foreground flex-1 mr-2">
                      {product.title}
                    </span>
                    <span className="text-destructive font-semibold text-[11px] whitespace-nowrap">
                      {product.stock} left
                    </span>
                  </div>
                ))}
                {lowStock.length > 3 && (
                  <div className="flex justify-center items-center text-xs bg-background p-2.5 rounded-lg border border-border text-muted-foreground">
                    +{lowStock.length - 3} more items
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* --- STAFF VIEW --- */}
      {activeRole === "STAFF" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              title="Total Orders"
              icon={ShoppingCart}
              loading={loading}
            >
              <div className="text-base sm:text-2xl font-bold">
                {stats?.staffOrders?.total || 0}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {isAdmin ? "Aggregated system orders" : "All orders"}
              </p>
            </StatCard>

            <StatCard title="Pending" icon={Clock} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {stats?.staffOrders?.pending || 0}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Awaiting processing
              </p>
            </StatCard>

            <StatCard title="In Transit" icon={Truck} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {stats?.staffOrders?.outForDelivery || 0}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Out for delivery
              </p>
            </StatCard>

            <StatCard title="Completed" icon={CheckCircle} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {stats?.staffOrders?.completed || 0}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Delivered orders
              </p>
            </StatCard>
          </div>

          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4">
            <CardHeader className="p-0 px-2 pb-4">
              <CardTitle className="text-base font-semibold">
                Orders Queue
              </CardTitle>
              <CardDescription>Recent orders for processing</CardDescription>
            </CardHeader>
            <CardContent className="p-0 px-2">
              <div className="space-y-6">
                {loading ? (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0 gap-2"
                      >
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  recentOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0 gap-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Order #{order.id.slice(-6)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatLongDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold">
                          ₱{order.total.toFixed(2)}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {formatStatus(order.status)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- RIDER VIEW --- */}
      {activeRole === "RIDER" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {isAdmin ? (
              // ADMIN VIEWING RIDER TAB: Aggregated ALL riders data
              <>
                <StatCard title="Total" icon={ClipboardList} loading={loading}>
                  <div className="text-base sm:text-2xl font-bold">
                    {stats?.allRiderStats?.total || 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    All riders combined
                  </p>
                </StatCard>

                <StatCard
                  title="Pickups Ready"
                  icon={Package}
                  loading={loading}
                >
                  <div className="text-base sm:text-2xl font-bold">
                    {stats?.allRiderStats?.assigned || 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Ready to pickup
                  </p>
                </StatCard>

                <StatCard title="In Transit" icon={Truck} loading={loading}>
                  <div className="text-base sm:text-2xl font-bold">
                    {stats?.allRiderStats?.outForDelivery || 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    On the way
                  </p>
                </StatCard>

                <StatCard
                  title="Completed"
                  icon={CheckCircle}
                  loading={loading}
                >
                  <div className="text-base sm:text-2xl font-bold">
                    {stats?.allRiderStats?.delivered || 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Delivered
                  </p>
                </StatCard>
              </>
            ) : (
              // RIDER LOGGED IN: Individual rider stats
              <>
                <StatCard title="Total" icon={ClipboardList} loading={loading}>
                  <div className="text-base sm:text-2xl font-bold">
                    {stats?.riderOrders?.total || 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Your total deliveries
                  </p>
                </StatCard>

                <StatCard
                  title="Pickups Ready"
                  icon={Package}
                  loading={loading}
                >
                  <div className="text-base sm:text-2xl font-bold">
                    {stats?.riderOrders?.assigned || 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Ready to pickup
                  </p>
                </StatCard>

                <StatCard title="In Transit" icon={Truck} loading={loading}>
                  <div className="text-base sm:text-2xl font-bold">
                    {stats?.riderOrders?.outForDelivery || 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    On the way
                  </p>
                </StatCard>

                <StatCard
                  title="Completed"
                  icon={CheckCircle}
                  loading={loading}
                >
                  <div className="text-base sm:text-2xl font-bold">
                    {stats?.riderOrders?.delivered || 0}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    Delivered
                  </p>
                </StatCard>
              </>
            )}
          </div>

          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4">
            <CardHeader className="p-0 px-2 pb-4">
              <CardTitle className="text-base font-semibold">
                {isAdmin ? "All Riders Deliveries" : "Your Assigned Deliveries"}
              </CardTitle>
              <CardDescription>
                {isAdmin
                  ? "Overview of all deliveries assigned to riders"
                  : "Orders assigned to you for delivery"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 px-2">
              <div className="space-y-6">
                {loading ? (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0 gap-2"
                      >
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {(() => {
                      const ordersToShow = isAdmin
                        ? stats?.allRiderStats?.recentOrders
                        : stats?.riderOrders?.recentOrders;

                      if (ordersToShow && ordersToShow.length > 0) {
                        return ordersToShow.map((order) => (
                          <div
                            key={order.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0 gap-2"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                Order #{order.orderNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.user?.name || order.user?.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.address?.city}
                              </p>
                              {isAdmin && order.rider && (
                                <p className="text-xs text-muted-foreground">
                                  Rider: {order.rider.name || order.rider.email}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-bold">
                                ₱{order.total.toFixed(2)}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-xs font-normal"
                              >
                                {formatStatus(order.status)}
                              </Badge>
                            </div>
                          </div>
                        ));
                      } else {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>
                              {isAdmin
                                ? "No rider deliveries yet"
                                : "No assigned deliveries yet"}
                            </p>
                            <p className="text-xs mt-1">
                              {isAdmin
                                ? "Orders will appear here once assigned to riders"
                                : "You'll see orders here once they're assigned to you"}
                            </p>
                          </div>
                        );
                      }
                    })()}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper Components
interface StatCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  loading: boolean;
}

function StatCard({ title, icon: Icon, children, loading }: StatCardProps) {
  return (
    <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 px-2">
        <CardTitle className="text-xs sm:text-sm font-medium tracking-tight">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-0 px-2 pt-2">
        {loading ? (
          <>
            <Skeleton className="h-6 sm:h-8 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

interface OrderStatusItemProps {
  icon: React.ElementType;
  label: string;
  description: string;
  count: number;
  loading: boolean;
}

function OrderStatusItem({
  icon: Icon,
  label,
  description,
  count,
  loading,
}: OrderStatusItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-6 w-8" />
      ) : (
        <span className="text-lg font-bold">{count}</span>
      )}
    </div>
  );
}
