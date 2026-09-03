import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

async function createNotification(
  userId: string,
  title: string,
  description: string,
  type: NotificationType,
  link?: string,
  metadata?: any,
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        description,
        type,
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

    // ✅ Only RIDER can mark orders as paid
    if (user.role !== "RIDER") {
      return NextResponse.json(
        { error: "Forbidden - Only riders can mark orders as paid" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const { isPaid } = await request.json();

    // Get the order with rider info
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        rider: {
          select: { id: true, name: true, email: true },
        },
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ✅ Verify this order is assigned to the rider
    if (order.riderId !== user.id) {
      return NextResponse.json(
        { error: "This order is not assigned to you" },
        { status: 403 },
      );
    }

    // ✅ Only allow marking as paid if order is DELIVERED or OUT_FOR_DELIVERY
    if (!["DELIVERED", "OUT_FOR_DELIVERY"].includes(order.status)) {
      return NextResponse.json(
        {
          error: "Order must be delivered or out for delivery to mark as paid",
        },
        { status: 400 },
      );
    }

    // ✅ Check if payment method is COD (only COD orders can be marked as paid by rider)
    const payment = order.payments[0];
    if (!payment || payment.method !== "COD") {
      return NextResponse.json(
        { error: "Only COD orders can be marked as paid by the rider" },
        { status: 400 },
      );
    }

    // ✅ Update order isPaid status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { isPaid },
    });

    // ✅ Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID" },
    });

    // ✅ Create notification for customer
    if (isPaid && order.userId) {
      await createNotification(
        order.userId,
        `💰 Order #${order.orderNumber} payment confirmed!`,
        `Your payment of ₱${order.payable.toFixed(2)} for order #${order.orderNumber} has been confirmed. Thank you for your purchase!`,
        NotificationType.ORDER,
        `/profile/orders/${order.id}`,
        {
          orderNumber: order.orderNumber,
          isPaid: true,
        },
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: isPaid ? "Order marked as paid" : "Order marked as unpaid",
    });
  } catch (error) {
    console.error("❌ PATCH /api/admin/orders/[id]/payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
