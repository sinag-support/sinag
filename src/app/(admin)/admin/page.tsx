import { getCurrentUserRole } from "@/lib/role";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import DashboardClient from "./dashboard-client";

async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {}
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch {}
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) return null;

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    return dbUser?.id || null;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
}

export default async function AdminPage() {
  const role = await getCurrentUserRole();
  if (!role || role === "USER") {
    redirect("/login");
  }

  const userId = await getCurrentUserId();

  // ============ CORE STATS (for all roles) ============
  const [
    revenueAgg,
    totalOrders,
    totalProducts,
    totalUsers,
    recentOrders,
    lowStock,
    pendingCount,
    outForDeliveryCount,
    deliveredCount,
    cancelledCount,
    returnRequestedCount,
    returnedCount,
    refundRequestedCount,
    refundedCount,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { payable: true },
      where: { isPaid: true },
    }),
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count({ where: { role: { not: "ADMIN" } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        payable: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.product.findMany({
      where: { stock: { lt: 10 } },
      orderBy: { stock: "asc" },
      take: 10,
      select: { id: true, title: true, stock: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.count({ where: { status: "RETURN_REQUESTED" } }),
    prisma.order.count({ where: { status: "RETURNED" } }),
    prisma.order.count({ where: { status: "REFUND_REQUESTED" } }),
    prisma.order.count({ where: { status: "REFUNDED" } }),
  ]);

  // ============ RIDER DATA ============
  // For RIDER: only THEIR assigned orders
  // For ADMIN: ALL riders' orders (aggregated)
  let riderOrdersData: any[] = [];

  if (role === "RIDER" && userId) {
    // Own rider data only
    const orders = await prisma.order.findMany({
      where: { riderId: userId },
      include: {
        user: { select: { name: true, email: true } },
        address: { select: { city: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    riderOrdersData = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: o.payable,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      address: o.address,
      user: o.user,
    }));
  } else if (role === "ADMIN") {
    // Aggregated across ALL riders
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: [
            "ASSIGNED_RIDER",
            "OUT_FOR_DELIVERY",
            "READY_FOR_PICKUP",
            "DELIVERED",
            "RETURN_REQUESTED",
            "RETURNED",
            "REFUND_REQUESTED",
            "REFUNDED",
          ],
        },
      },
      include: {
        user: { select: { name: true, email: true } },
        rider: { select: { name: true, email: true } },
        address: { select: { city: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    riderOrdersData = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: o.payable,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      address: o.address,
      user: o.user,
      rider: o.rider,
    }));
  }

  // ============ REVENUE CHART DATA ============
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now);
  monthStart.setDate(now.getDate() - 29);
  monthStart.setHours(0, 0, 0, 0);

  const yearStart = new Date(now);
  yearStart.setMonth(now.getMonth() - 11);
  yearStart.setDate(1);
  yearStart.setHours(0, 0, 0, 0);

  const [weeklyOrders, monthlyOrders, yearlyOrders] = await Promise.all([
    prisma.order.findMany({
      where: { isPaid: true, createdAt: { gte: weekStart } },
      select: { payable: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { isPaid: true, createdAt: { gte: monthStart } },
      select: { payable: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { isPaid: true, createdAt: { gte: yearStart } },
      select: { payable: true, createdAt: true },
    }),
  ]);

  // Weekly (7 days)
  const revenueData: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    const dayRevenue = weeklyOrders
      .filter((o) => o.createdAt.toISOString().split("T")[0] === dateKey)
      .reduce((sum, o) => sum + o.payable, 0);
    revenueData.push({ date: dateKey, revenue: dayRevenue });
  }

  // Monthly (30 days)
  const monthlyRevenueData: { date: string; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    const dayRevenue = monthlyOrders
      .filter((o) => o.createdAt.toISOString().split("T")[0] === dateKey)
      .reduce((sum, o) => sum + o.payable, 0);
    monthlyRevenueData.push({ date: dateKey, revenue: dayRevenue });
  }

  // Yearly (12 months)
  const yearlyRevenueData: { date: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthRevenue = yearlyOrders
      .filter(
        (o) =>
          o.createdAt.getFullYear() === year &&
          o.createdAt.getMonth() === month,
      )
      .reduce((sum, o) => sum + o.payable, 0);
    yearlyRevenueData.push({ date: monthKey, revenue: monthRevenue });
  }

  return (
    <DashboardClient
      role={role}
      initialStats={{
        revenue: revenueAgg._sum.payable || 0,
        orders: totalOrders,
        products: totalProducts,
        users: totalUsers,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          total: o.payable,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
        })),
        lowStock,
        pendingOrders: pendingCount,
        outForDelivery: outForDeliveryCount,
        statusCounts: {
          completed: deliveredCount,
          cancelled: cancelledCount,
          returnRequested: returnRequestedCount,
          returned: returnedCount,
          refundRequested: refundRequestedCount,
          refunded: refundedCount,
        },
        revenueData,
        monthlyRevenueData,
        yearlyRevenueData,
        riderOrdersData,
      }}
    />
  );
}
