// app/api/orders/[id]/return/route.ts
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

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        rider: {
          select: { id: true, name: true, email: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Not your order" }, { status: 403 });
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Only delivered orders can be returned" },
        { status: 400 },
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "RETURN_REQUESTED",
      },
    });

    if (order.riderId) {
      await createNotification(
        order.riderId,
        `🔄 Return requested for order #${order.orderNumber}`,
        `Customer ${order.user?.name || "Customer"} has requested a return. Reason: ${reason || "No reason provided"}`,
        NotificationType.ORDER,
        `/admin/delivery`,
        {
          orderNumber: order.orderNumber,
          orderId: order.id,
          status: "RETURN_REQUESTED",
          reason: reason || "No reason provided",
          customerName: order.user?.name || "Customer",
        },
      );
    }

    await createNotification(
      order.userId,
      `🔄 Return requested for order #${order.orderNumber}`,
      `Your return request has been submitted. Waiting for rider confirmation.`,
      NotificationType.ORDER,
      `/profile/orders/${order.id}`,
      {
        orderNumber: order.orderNumber,
        status: "RETURN_REQUESTED",
      },
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: "Return request submitted successfully",
    });
  } catch (error) {
    console.error("Error processing return:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
