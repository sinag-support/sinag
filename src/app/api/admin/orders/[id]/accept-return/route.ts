// app/api/admin/orders/[id]/accept-return/route.ts
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

    if (user.role !== "RIDER") {
      return NextResponse.json(
        { error: "Forbidden - Rider only" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.riderId !== user.id) {
      return NextResponse.json(
        { error: "Not your assigned order" },
        { status: 403 },
      );
    }

    if (order.status !== "RETURN_REQUESTED") {
      return NextResponse.json(
        { error: "Order must be in RETURN_REQUESTED status" },
        { status: 400 },
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "RETURNED",
      },
    });

    await createNotification(
      order.userId,
      `✅ Return accepted for order #${order.orderNumber}`,
      `Your return has been accepted by the rider.`,
      NotificationType.ORDER,
      `/profile/orders/${order.id}`,
      {
        orderNumber: order.orderNumber,
        status: "RETURNED",
      },
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: "Return accepted successfully",
    });
  } catch (error) {
    console.error("Error accepting return:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
