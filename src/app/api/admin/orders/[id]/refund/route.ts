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
    if (error || !user || !user.email) {
      return null;
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, role: true, name: true },
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
    return await prisma.notification.create({
      data: {
        userId,
        title,
        description,
        type,
        link,
        metadata,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN" && user.role !== "STAFF") {
      return NextResponse.json(
        { error: "Forbidden - Admin or Staff only" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve' or 'reject'" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "REFUND_REQUESTED") {
      return NextResponse.json(
        { error: "Order must be in REFUND_REQUESTED status" },
        { status: 400 },
      );
    }

    let updatedOrder;
    let message;

    if (action === "approve") {
      updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: "REFUNDED",
          isPaid: false,
        },
      });

      // Update payment status to REFUNDED
      await prisma.payment.updateMany({
        where: { orderId: id },
        data: { status: "REFUNDED" },
      });

      message = "Refund approved successfully";

      await createNotification(
        order.userId,
        `✅ Refund approved for order #${order.orderNumber}`,
        `Your refund of ₱${order.payable.toFixed(2)} has been approved and processed.`,
        NotificationType.ORDER,
        `/profile/orders/${order.id}`,
        {
          orderNumber: order.orderNumber,
          status: "REFUNDED",
          amount: order.payable,
        },
      );
    } else {
      updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: "DELIVERED",
        },
      });

      message = "Refund rejected";

      await createNotification(
        order.userId,
        `❌ Refund request rejected for order #${order.orderNumber}`,
        `Your refund request has been rejected. Please contact support for more information.`,
        NotificationType.ORDER,
        `/profile/orders/${order.id}`,
        {
          orderNumber: order.orderNumber,
          status: "DELIVERED",
          amount: order.payable,
        },
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
