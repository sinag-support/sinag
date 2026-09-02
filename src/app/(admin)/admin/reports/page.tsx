"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/hooks/use-role";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ReportData {
  revenue: number;
  orders: number;
  products: number;
  users: number;
  revenueGrowth: number;
  ordersGrowth: number;
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  categorySales: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
}

// Professional chart colors
const CHART_COLORS = [
  "#2563eb", // blue
  "#7c3aed", // purple
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // red
  "#0891b2", // cyan
  "#db2777", // pink
];

const PIE_COLORS = [
  "#2563eb", // blue
  "#7c3aed", // purple
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // red
  "#0891b2", // cyan
  "#db2777", // pink
  "#4f46e5", // indigo
  "#ea580c", // orange
];

type ViewMode = "admin" | "staff";

export default function ReportsPage() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [viewMode, setViewMode] = useState<ViewMode>("admin");

  if (role === "RIDER") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          You don't have permission to view reports. Please contact your
          administrator.
        </p>
      </div>
    );
  }

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?range=${timeRange}`);
      const data = await res.json();
      setData(data);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!data) return;

    const currentDate = new Date().toLocaleString();
    const range = timeRange;

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>SINAG Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 24px; color: #1a1a2e; }
          .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th { background: #f1f5f9; border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; font-weight: bold; }
          td { border: 1px solid #d1d5db; padding: 8px 12px; }
          .total-row { background: #f8fafc; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>🌱 SINAG E-Commerce Report</h1>
        <div class="meta">Generated: ${currentDate} | Time Range: ${range}</div>

        <!-- Summary -->
        <table>
          <tr><th colspan="2">SUMMARY</th></tr>
          <tr><td>Total Revenue</td><td>₱${data.revenue.toFixed(2)}</td></tr>
          <tr><td>Total Orders</td><td>${data.orders}</td></tr>
          <tr><td>Products</td><td>${data.products}</td></tr>
          <tr><td>Customers</td><td>${data.users}</td></tr>
          <tr><td>Revenue Growth</td><td>${data.revenueGrowth > 0 ? "+" : ""}${data.revenueGrowth}%</td></tr>
          <tr><td>Orders Growth</td><td>${data.ordersGrowth > 0 ? "+" : ""}${data.ordersGrowth}%</td></tr>
        </table>

        <!-- Daily Revenue -->
        <table>
          <tr><th colspan="3">DAILY REVENUE</th></tr>
          <tr><th>Date</th><th>Revenue</th><th>Orders</th></tr>
          ${data.dailyRevenue
            .map(
              (item) => `
            <tr>
              <td>${item.date}</td>
              <td>₱${item.revenue.toFixed(2)}</td>
              <td>${item.orders}</td>
            </tr>
          `,
            )
            .join("")}
          <tr class="total-row">
            <td>TOTAL</td>
            <td>₱${data.revenue.toFixed(2)}</td>
            <td>${data.orders}</td>
          </tr>
        </table>

        <!-- Category Sales -->
        <table>
          <tr><th colspan="2">CATEGORY SALES</th></tr>
          <tr><th>Category</th><th>Sales</th></tr>
          ${data.categorySales
            .map(
              (item) => `
            <tr><td>${item.name}</td><td>₱${item.value.toFixed(2)}</td></tr>
          `,
            )
            .join("")}
        </table>

        <!-- Order Status -->
        <table>
          <tr><th colspan="2">ORDER STATUS DISTRIBUTION</th></tr>
          <tr><th>Status</th><th>Count</th></tr>
          ${data.statusDistribution
            .map(
              (item) => `
            <tr><td>${item.name}</td><td>${item.value}</td></tr>
          `,
            )
            .join("")}
        </table>

        <!-- Top Products -->
        <table>
          <tr><th colspan="4">TOP SELLING PRODUCTS</th></tr>
          <tr><th>#</th><th>Product</th><th>Sales</th><th>Revenue</th></tr>
          ${data.topProducts
            .map(
              (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.name}</td>
              <td>${item.sales}</td>
              <td>₱${item.revenue.toFixed(2)}</td>
            </tr>
          `,
            )
            .join("")}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `sinag-report-${new Date().toISOString().split("T")[0]}.xls`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Report exported as Excel!");
  };

  const handlePrint = () => {
    if (!data) return;

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const currentDate = new Date().toLocaleString();
    const reportData = data;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SINAG Report - ${new Date().toISOString().split("T")[0]}</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
            color: #1a1a2e;
          }
          h1 {
            font-size: 28px;
            color: #1a1a2e;
            border-bottom: 3px solid #e5e7eb;
            padding-bottom: 10px;
          }
          .meta {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 30px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: #ffffff;
            padding: 16px 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .summary-card .label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #1a1a2e;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            font-size: 20px;
            color: #1a1a2e;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table th {
            background: #f8fafc;
            text-align: left;
            padding: 10px 12px;
            font-weight: 600;
            font-size: 14px;
            border-bottom: 2px solid #e5e7eb;
          }
          table td {
            padding: 8px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }
          .total-row {
            font-weight: bold;
            background: #fafafa;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #f1f5f9;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>📊 SINAG E-Commerce Report</h1>
        <div class="meta">
          Generated: ${currentDate} | Time Range: ${timeRange}
        </div>

        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">Total Revenue</div>
            <div class="value">₱${reportData.revenue.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Orders</div>
            <div class="value">${reportData.orders}</div>
          </div>
          <div class="summary-card">
            <div class="label">Products</div>
            <div class="value">${reportData.products}</div>
          </div>
          <div class="summary-card">
            <div class="label">Customers</div>
            <div class="value">${reportData.users}</div>
          </div>
        </div>

        <!-- Growth -->
        <div class="section">
          <h2>📈 Growth Metrics</h2>
          <table>
            <tr>
              <th>Metric</th>
              <th>Growth</th>
            </tr>
            <tr>
              <td>Revenue Growth</td>
              <td>${reportData.revenueGrowth > 0 ? "+" : ""}${reportData.revenueGrowth}%</td>
            </tr>
            <tr>
              <td>Orders Growth</td>
              <td>${reportData.ordersGrowth > 0 ? "+" : ""}${reportData.ordersGrowth}%</td>
            </tr>
          </table>
        </div>

        <!-- Daily Revenue -->
        <div class="section">
          <h2>📅 Daily Revenue</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>Revenue</th>
              <th>Orders</th>
            </tr>
            ${reportData.dailyRevenue
              .map(
                (item) => `
              <tr>
                <td>${item.date}</td>
                <td>₱${item.revenue.toFixed(2)}</td>
                <td>${item.orders}</td>
              </tr>
            `,
              )
              .join("")}
            <tr class="total-row">
              <td>Total</td>
              <td>₱${reportData.revenue.toFixed(2)}</td>
              <td>${reportData.orders}</td>
            </tr>
          </table>
        </div>

        <!-- Category Sales -->
        <div class="section">
          <h2>📂 Category Sales</h2>
          <table>
            <tr>
              <th>Category</th>
              <th>Sales</th>
            </tr>
            ${reportData.categorySales
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td>₱${item.value.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
        </div>

        <!-- Order Status -->
        <div class="section">
          <h2>📋 Order Status Distribution</h2>
          <table>
            <tr>
              <th>Status</th>
              <th>Count</th>
            </tr>
            ${reportData.statusDistribution
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.value}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
        </div>

        <!-- Top Products -->
        <div class="section">
          <h2>🏆 Top Selling Products</h2>
          <table>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Sales</th>
              <th>Revenue</th>
            </tr>
            ${reportData.topProducts
              .map(
                (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.sales}</td>
                <td>₱${item.revenue.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
        </div>

        <div class="footer">
          Generated by SINAG E-Commerce Platform | ${currentDate}
        </div>

        <div class="no-print" style="text-align:center;margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 30px;background:#1a1a2e;color:#fff;border:none;border-radius:6px;font-size:16px;cursor:pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
  };

  if (loading) {
    return <ReportsSkeleton role={role} viewMode={viewMode} />;
  }

  if (!data) {
    return <div className="text-center py-12">Failed to load report data</div>;
  }

  const activeView = role === "ADMIN" ? viewMode : "staff";

  return (
    <div className="space-y-6">
      {/* Header with View Switcher - Always visible for Admin */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-3xl font-bold tracking-tight">
          {activeView === "admin"
            ? "Reports & Analytics"
            : "Product & Order Reports"}
        </h2>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Switcher - Always visible for Admin users */}
          {role === "ADMIN" && (
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as ViewMode)}
              className="w-auto"
            >
              <TabsList className="bg-background border border-border p-1 rounded-lg w-auto h-8">
                <TabsTrigger
                  value="admin"
                  className="text-xs px-3 py-1 rounded-md font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Admin
                </TabsTrigger>
                <TabsTrigger
                  value="staff"
                  className="text-xs px-3 py-1 rounded-md font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Staff
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <Select
            value={timeRange}
            onValueChange={(val: string | null) => val && setTimeRange(val)}
          >
            <SelectTrigger className="w-40 h-8 !bg-background">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent className="!bg-background">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="outline"
                className="gap-2 h-8 !bg-background hover:!bg-accent"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="!bg-background">
              <DropdownMenuItem onClick={exportExcel} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2 h-8 !bg-background hover:!bg-accent"
          >
            <Printer className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* --- ADMIN VIEW --- */}
      {activeView === "admin" && role === "ADMIN" && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Revenue" icon={DollarSign} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                ₱{data.revenue.toFixed(2)}
              </div>
              <p
                className={`text-[10px] sm:text-xs ${data.revenueGrowth >= 0 ? "text-emerald-600" : "text-destructive"} flex items-center gap-1`}
              >
                {data.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {data.revenueGrowth > 0 ? "+" : ""}
                {data.revenueGrowth}%
              </p>
            </StatCard>

            <StatCard
              title="Total Orders"
              icon={ShoppingCart}
              loading={loading}
            >
              <div className="text-base sm:text-2xl font-bold">
                {data.orders}
              </div>
              <p
                className={`text-[10px] sm:text-xs ${data.ordersGrowth >= 0 ? "text-emerald-600" : "text-destructive"} flex items-center gap-1`}
              >
                {data.ordersGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {data.ordersGrowth > 0 ? "+" : ""}
                {data.ordersGrowth}%
              </p>
            </StatCard>

            <StatCard title="Products" icon={Package} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {data.products}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Total catalog items
              </p>
            </StatCard>

            <StatCard title="Customers" icon={Users} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {data.users}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Registered users
              </p>
            </StatCard>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
              <CardHeader className="pb-2 p-0 px-2">
                <CardTitle className="text-base font-semibold">
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 h-[250px] sm:h-[300px] p-0 px-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="Revenue (₱)"
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
              <CardHeader className="pb-2 p-0 px-2">
                <CardTitle className="text-base font-semibold">
                  Category Sales Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 h-[250px] sm:h-[300px] p-0 px-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categorySales}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {data.categorySales.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Order Status Distribution */}
          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
            <CardHeader className="pb-2 p-0 px-2">
              <CardTitle className="text-base font-semibold">
                Order Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 h-[250px] sm:h-[300px] p-0 px-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#059669">
                    {data.statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
            <CardHeader className="pb-2 p-0 px-2">
              <CardTitle className="text-base font-semibold">
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-0 px-2">
              <div className="space-y-4">
                {data.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 border-b pb-3 last:border-0"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sales} sales
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₱{product.revenue.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- STAFF VIEW --- */}
      {activeView === "staff" && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard title="Total Products" icon={Package} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                {data.products}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Catalog items
              </p>
            </StatCard>

            <StatCard
              title="Total Orders"
              icon={ShoppingCart}
              loading={loading}
            >
              <div className="text-base sm:text-2xl font-bold">
                {data.orders}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                All time orders
              </p>
            </StatCard>

            <StatCard title="Revenue" icon={DollarSign} loading={loading}>
              <div className="text-base sm:text-2xl font-bold">
                ₱{data.revenue.toFixed(2)}
              </div>
              <p
                className={`text-[10px] sm:text-xs ${data.revenueGrowth >= 0 ? "text-emerald-600" : "text-destructive"} flex items-center gap-1`}
              >
                {data.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {data.revenueGrowth > 0 ? "+" : ""}
                {data.revenueGrowth}%
              </p>
            </StatCard>
          </div>

          {/* Top Products */}
          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
            <CardHeader className="pb-2 p-0 px-2">
              <CardTitle className="text-base font-semibold">
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-0 px-2">
              <div className="space-y-4">
                {data.topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 border-b pb-3 last:border-0"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sales} sales
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₱{product.revenue.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
            <CardHeader className="pb-2 p-0 px-2">
              <CardTitle className="text-base font-semibold">
                Order Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 h-[250px] sm:h-[300px] p-0 px-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]}>
                    {data.statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
  loading: boolean;
}

function StatCard({ title, icon: Icon, children, loading }: StatCardProps) {
  return (
    <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
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

function ReportsSkeleton({
  role,
  viewMode,
}: {
  role?: string | null;
  viewMode?: string;
}) {
  const isAdmin = role === "ADMIN";
  const activeView = isAdmin ? viewMode : "staff";

  return (
    <div className="space-y-6">
      {/* Header - Always visible with skeleton values */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              <div className="h-8 w-auto flex items-center gap-1 px-3 py-1 rounded-md border border-border bg-background">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
              </div>
            </>
          )}
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Stats Cards - Only values have skeletons, titles visible */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Revenue", icon: DollarSign },
          { title: "Total Orders", icon: ShoppingCart },
          { title: "Products", icon: Package },
          { title: "Customers", icon: Users },
        ].map((stat, i) => (
          <Card
            key={i}
            className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0 px-2">
              <CardTitle className="text-xs sm:text-sm font-medium tracking-tight">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 px-2 pt-2">
              <Skeleton className="h-6 sm:h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts - Full skeletons */}
      {activeView === "admin" && isAdmin && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
              <CardHeader className="pb-2 p-0 px-2">
                <CardTitle className="text-base font-semibold">
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 h-[250px] sm:h-[300px] p-0 px-2">
                <Skeleton className="w-full h-full" />
              </CardContent>
            </Card>
            <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
              <CardHeader className="pb-2 p-0 px-2">
                <CardTitle className="text-base font-semibold">
                  Category Sales Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 h-[250px] sm:h-[300px] p-0 px-2">
                <Skeleton className="w-full h-full" />
              </CardContent>
            </Card>
          </div>
          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
            <CardHeader className="pb-2 p-0 px-2">
              <CardTitle className="text-base font-semibold">
                Order Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 h-[250px] sm:h-[300px] p-0 px-2">
              <Skeleton className="w-full h-full" />
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
            <CardHeader className="pb-2 p-0 px-2">
              <CardTitle className="text-base font-semibold">
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-0 px-2">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 border-b pb-3 last:border-0"
                  >
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeView === "staff" && (
        <>
          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
            <CardHeader className="pb-2 p-0 px-2">
              <CardTitle className="text-base font-semibold">
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-0 px-2">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 border-b pb-3 last:border-0"
                  >
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-background text-card-foreground shadow-none px-2 py-4 !bg-background">
            <CardHeader className="pb-2 p-0 px-2">
              <CardTitle className="text-base font-semibold">
                Order Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 h-[250px] sm:h-[300px] p-0 px-2">
              <Skeleton className="w-full h-full" />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
