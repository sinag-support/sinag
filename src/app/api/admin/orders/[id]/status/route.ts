// app/api/admin/orders/[id]/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ✅ Import the NotificationType enum from Prisma
import { NotificationType } from "@prisma/client";

async function getAuthUser() {
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
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true, role: true },
    });

    return dbUser;
  } catch (error) {
    console.error("Error in getAuthUser:", error);
    return null;
  }
}

// ✅ FIXED: Direct database insert for notification (no API call)
async function createNotification(
  userId: string,
  title: string,
  description: string,
  type: NotificationType, // ✅ Use the enum type
  link?: string,
  metadata?: any,
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        description,
        type, // ✅ Now correctly typed
        link,
        metadata,
      },
    });
    console.log("✅ Notification created:", notification.id);
    return notification;
  } catch (error) {
    console.error("❌ Failed to create notification:", error);
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN, STAFF, and RIDER can update order status
    if (
      user.role !== "ADMIN" &&
      user.role !== "STAFF" &&
      user.role !== "RIDER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "PACKED",
      "READY_FOR_PICKUP",
      "ASSIGNED_RIDER",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get the order with user and rider info
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        rider: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ✅ Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    console.log("📦 Order updated:", {
      orderId: order.id,
      status,
      userId: order.userId,
    });

    // ✅ Send notification to customer when OUT_FOR_DELIVERY
    if (status === "OUT_FOR_DELIVERY" && order.userId) {
      const riderName = order.rider?.name || "Your rider";

      console.log(
        "📤 Creating OUT_FOR_DELIVERY notification for user:",
        order.userId,
      );

      await createNotification(
        order.userId,
        `🚚 Your order #${order.orderNumber} is on the way!`,
        `Rider ${riderName} has started your delivery. Track your order in real-time.`,
        NotificationType.ORDER, // ✅ Use the enum value
        `/orders/${order.orderNumber}`,
        {
          orderNumber: order.orderNumber,
          riderName,
          status: "OUT_FOR_DELIVERY",
          riderId: order.riderId,
        },
      );
    }

    // ✅ Send notification to customer when DELIVERED
    if (status === "DELIVERED" && order.userId) {
      const riderName = order.rider?.name || "Your rider";

      console.log("📤 Creating DELIVERED notification for user:", order.userId);

      await createNotification(
        order.userId,
        `✅ Order #${order.orderNumber} delivered!`,
        `Your order has been successfully delivered by ${riderName}. Thank you for shopping with us!`,
        NotificationType.ORDER, // ✅ Use the enum value
        `/orders/${order.orderNumber}`,
        {
          orderNumber: order.orderNumber,
          riderName,
          status: "DELIVERED",
        },
      );
    }

    // ✅ Send notification when order is cancelled
    if (status === "CANCELLED" && order.userId) {
      console.log("📤 Creating CANCELLED notification for user:", order.userId);

      await createNotification(
        order.userId,
        `❌ Order #${order.orderNumber} cancelled`,
        `Your order has been cancelled. If you have any questions, please contact support.`,
        NotificationType.ORDER, // ✅ Use the enum value
        `/orders/${order.orderNumber}`,
        {
          orderNumber: order.orderNumber,
          status: "CANCELLED",
        },
      );
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("❌ PATCH /api/admin/orders/[id]/status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
