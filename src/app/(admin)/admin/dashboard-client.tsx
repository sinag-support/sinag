"use client";

import { useState, useEffect } from "react";
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
  RotateCcw,
  AlertTriangle,
  DollarSign as DollarSignIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface RiderOrderItem {
  id: string;
  orderNumber: number;
  total: number;
  status: string;
  createdAt: string;
  address: { city: string } | null;
  user: { name: string | null; email: string };
  rider?: { name: string | null; email: string } | null;
}

interface InitialStats {
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
  pendingOrders: number;
  outForDelivery: number;
  statusCounts: {
    completed: number;
    cancelled: number;
    returnRequested: number;
    returned: number;
    refundRequested: number;
    refunded: number;
  };
  revenueData: RevenuePoint[];
  monthlyRevenueData: RevenuePoint[];
  yearlyRevenueData: RevenuePoint[];
  riderOrdersData: RiderOrderItem[];
}

interface DashboardClientProps {
  role: string;
  initialStats: InitialStats;
}

type RevenuePeriod = "week" | "month" | "year" | "full";

export default function DashboardClient({
  role,
  initialStats,
}: DashboardClientProps) {
  const [viewRole, setViewRole] = useState<string>("ADMIN");
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("week");
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>(
    initialStats.revenueData,
  );

  const isAdmin = role === "ADMIN";
  const isStaff = role === "STAFF";
  const isRider = role === "RIDER";
  const activeRole = isAdmin ? viewRole : role;

  // No API call — data comes from server
  const stats = initialStats;

  useEffect(() => {
    switch (revenuePeriod) {
      case "week":
        setRevenueData(stats.revenueData);
        break;
      case "month":
        setRevenueData(stats.monthlyRevenueData);
        break;
      case "year":
      case "full":
        setRevenueData(stats.yearlyRevenueData);
        break;
    }
  }, [revenuePeriod, stats]);

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
    pending: stats.pendingOrders,
    inTransit: stats.outForDelivery,
    completed: stats.statusCounts.completed,
    cancelled: stats.statusCounts.cancelled,
    returnRequested: stats.statusCounts.returnRequested,
    returned: stats.statusCounts.returned,
    refundRequested: stats.statusCounts.refundRequested,
    refunded: stats.statusCounts.refunded,
  };

  const topLowStock = stats.lowStock.slice(0, 3);

  // Rider stats (own data if RIDER, aggregated if ADMIN)
  const riderOrders = stats.riderOrdersData;
  const riderStats = {
    total: riderOrders.length,
    assigned: riderOrders.filter(
      (o) => o.status === "ASSIGNED_RIDER" || o.status === "READY_FOR_PICKUP",
    ).length,
    outForDelivery: riderOrders.filter((o) => o.status === "OUT_FOR_DELIVERY")
      .length,
    delivered: riderOrders.filter((o) => o.status === "DELIVERED").length,
    recentOrders: riderOrders.slice(0, 5),
  };

  // Staff stats (aggregated)
  const staffStats = {
    total: stats.orders,
    pending: stats.pendingOrders,
    outForDelivery: stats.outForDelivery,
    completed: stats.statusCounts.completed,
  };

  return (
    <div className="flex-1 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h2>
          <div className="sm:hidden">
            <ThemeToggle />
          </div>
        </div>

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
            <StatCard title="Total Revenue" icon={DollarSign}>
              <div className="text-base sm:text-2xl font-bold">
                ₱
                {stats.revenue.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-[#59A630]" /> +12%
              </p>
            </StatCard>

            <StatCard title="Total Orders" icon={ShoppingCart}>
              <div className="text-base sm:text-2xl font-bold">
                {stats.orders}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                +5% from last month
              </p>
            </StatCard>

            <StatCard title="Active Products" icon={Package}>
              <div className="text-base sm:text-2xl font-bold">
                {stats.products}
              </div>
              <p
                className={cn(
                  "text-[10px] sm:text-xs mt-1",
                  stats.lowStock.length > 0
                    ? "text-destructive font-medium"
                    : "text-muted-foreground",
                )}
              >
                {stats.lowStock.length > 0
                  ? `${stats.lowStock.length} items low`
                  : "All inventory healthy"}
              </p>
            </StatCard>

            <StatCard title="Active Users" icon={Users}>
              <div className="text-base sm:text-2xl font-bold">
                {stats.users}
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
                />
                <OrderStatusItem
                  icon={Truck}
                  label="In Transit"
                  description="Out for delivery"
                  count={statusCounts.inTransit}
                />
                <OrderStatusItem
                  icon={CheckCircle}
                  label="Completed"
                  description="Successfully delivered"
                  count={statusCounts.completed}
                />
                <OrderStatusItem
                  icon={AlertCircle}
                  label="Cancelled"
                  description="Cancelled orders"
                  count={statusCounts.cancelled}
                />
                <OrderStatusItem
                  icon={AlertTriangle}
                  label="Return Requested"
                  description="Awaiting rider approval"
                  count={statusCounts.returnRequested}
                />
                <OrderStatusItem
                  icon={RotateCcw}
                  label="Returned"
                  description="Return accepted by rider"
                  count={statusCounts.returned}
                />
                <OrderStatusItem
                  icon={DollarSignIcon}
                  label="Refund Requested"
                  description="Awaiting admin approval"
                  count={statusCounts.refundRequested}
                />
                <OrderStatusItem
                  icon={DollarSignIcon}
                  label="Refunded"
                  description="Refund processed"
                  count={statusCounts.refunded}
                />
              </CardContent>
            </Card>
          </div>

          {stats.lowStock.length > 0 && (
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
                  {stats.lowStock.length} Items Need Restock
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
                {stats.lowStock.length > 3 && (
                  <div className="flex justify-center items-center text-xs bg-background p-2.5 rounded-lg border border-border text-muted-foreground">
                    +{stats.lowStock.length - 3} more items
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* --- STAFF VIEW (aggregated) --- */}
      {activeRole === "STAFF" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard title="Total Orders" icon={ShoppingCart}>
              <div className="text-base sm:text-2xl font-bold">
                {staffStats.total}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {isAdmin ? "Aggregated system orders" : "All orders"}
              </p>
            </StatCard>

            <StatCard title="Pending" icon={Clock}>
              <div className="text-base sm:text-2xl font-bold">
                {staffStats.pending}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Awaiting processing
              </p>
            </StatCard>

            <StatCard title="In Transit" icon={Truck}>
              <div className="text-base sm:text-2xl font-bold">
                {staffStats.outForDelivery}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Out for delivery
              </p>
            </StatCard>

            <StatCard title="Completed" icon={CheckCircle}>
              <div className="text-base sm:text-2xl font-bold">
                {staffStats.completed}
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
                {stats.recentOrders.slice(0, 5).map((order) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- RIDER VIEW (own data if rider, aggregated if admin) --- */}
      {activeRole === "RIDER" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard title="Total" icon={ClipboardList}>
              <div className="text-base sm:text-2xl font-bold">
                {riderStats.total}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {isAdmin ? "All riders combined" : "Your total deliveries"}
              </p>
            </StatCard>

            <StatCard title="Pickups Ready" icon={Package}>
              <div className="text-base sm:text-2xl font-bold">
                {riderStats.assigned}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Ready to pickup
              </p>
            </StatCard>

            <StatCard title="In Transit" icon={Truck}>
              <div className="text-base sm:text-2xl font-bold">
                {riderStats.outForDelivery}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                On the way
              </p>
            </StatCard>

            <StatCard title="Completed" icon={CheckCircle}>
              <div className="text-base sm:text-2xl font-bold">
                {riderStats.delivered}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Delivered
              </p>
            </StatCard>
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
                {riderStats.recentOrders.length > 0 ? (
                  riderStats.recentOrders.map((order) => (
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
                  ))
                ) : (
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
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function StatCard({ title, icon: Icon, children }: StatCardProps) {
  return (
    <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 px-2">
        <CardTitle className="text-xs sm:text-sm font-medium tracking-tight">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-0 px-2 pt-2">{children}</CardContent>
    </Card>
  );
}

interface OrderStatusItemProps {
  icon: React.ElementType;
  label: string;
  description: string;
  count: number;
}

function OrderStatusItem({
  icon: Icon,
  label,
  description,
  count,
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
      <span className="text-lg font-bold">{count}</span>
    </div>
  );
}
