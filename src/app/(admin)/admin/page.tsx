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
}

type RevenuePeriod = "week" | "month" | "year" | "full";

export default function AdminDashboard() {
  const { role } = useRole();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewRole, setViewRole] = useState<string | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("week");
  const [revenueData, setRevenueData] = useState<
    { date: string; revenue: number }[]
  >([]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (stats) {
      filterRevenueData(revenuePeriod);
    }
  }, [stats, revenuePeriod]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();

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

    if (!data || data.length === 0) {
      const days =
        period === "week"
          ? 7
          : period === "month"
            ? 30
            : period === "year"
              ? 365
              : 30;
      const sampleData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        sampleData.push({
          date: dateStr,
          revenue: Math.floor(Math.random() * 2000) + 500,
        });
      }
      setRevenueData(sampleData);
      return;
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

  const activeRole = viewRole || role;

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

  // Get only top 3 low stock items
  const topLowStock = lowStock.slice(0, 3);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h2>
          <div className="sm:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Tab switcher strictly visible for Admin users */}
          {role === "ADMIN" && (
            <Tabs
              value={viewRole || "ADMIN"}
              onValueChange={(value) =>
                setViewRole(value === "ADMIN" ? null : value)
              }
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
      </div>

      {/* --- ADMIN VIEW --- */}
      {activeRole === "ADMIN" && (
        <div className="space-y-4">
          {/* Stats Cards - 2x2 on mobile, 4 columns on desktop */}
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
                +{stats?.orders || 0}
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
                +{stats?.users || 0}
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

          {/* Low Stock Alert - Only show top 3 */}
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard
              title="Total Orders"
              icon={ShoppingCart}
              loading={loading}
            >
              <div className="text-base sm:text-2xl font-bold">
                {stats?.orders || 0}
              </div>
            </StatCard>

            <StatCard title="Pending Orders" icon={Clock} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {stats?.pendingOrders || 0}
              </div>
            </StatCard>

            <StatCard title="Out for Delivery" icon={Truck} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {stats?.outForDelivery || 0}
              </div>
            </StatCard>
          </div>

          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4">
            <CardHeader className="p-0 px-2 pb-4">
              <CardTitle className="text-base font-semibold">
                Orders Queue
              </CardTitle>
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard title="Pickups Ready" icon={Package} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {stats?.pendingOrders || 0}
              </div>
            </StatCard>

            <StatCard title="In Transit" icon={Truck} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {stats?.outForDelivery || 0}
              </div>
            </StatCard>

            <StatCard title="Completed" icon={CheckCircle} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {recentOrders.filter((o) => o.status === "DELIVERED").length}
              </div>
            </StatCard>
          </div>

          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4">
            <CardHeader className="p-0 px-2 pb-4">
              <CardTitle className="text-base font-semibold">
                Assigned Deliveries
              </CardTitle>
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
                          variant="outline"
                          className="text-xs border-border font-normal"
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
