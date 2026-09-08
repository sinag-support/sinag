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
          getAll() {
            return cookieStore.getAll().map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {}
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

    if (user.role !== "RIDER") {
      return NextResponse.json(
        { error: "Forbidden: Rider access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const riderLat = parseFloat(body.riderLat);
    const riderLng = parseFloat(body.riderLng);

    if (isNaN(riderLat) || isNaN(riderLng)) {
      return NextResponse.json(
        { error: "Invalid or missing latitude/longitude numbers" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        riderId: true,
        status: true,
        userId: true,
        orderNumber: true,
        rider: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.riderId && order.riderId !== user.id) {
      return NextResponse.json(
        { error: "Not your assigned order" },
        { status: 403 },
      );
    }

    const updateData: any = {
      riderLat: riderLat,
      riderLng: riderLng,
      updatedAt: new Date(),
    };

    let statusChanged = false;

    if (!order.riderId) {
      updateData.riderId = user.id;

      if (
        order.status === "ASSIGNED_RIDER" ||
        order.status === "READY_FOR_PICKUP"
      ) {
        updateData.status = "OUT_FOR_DELIVERY";
        statusChanged = true;
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    if (statusChanged && order.userId) {
      const riderName = user.name || order.rider?.name || "Your rider";

      await createNotification(
        order.userId,
        `🚚 Your order #${order.orderNumber} is on the way!`,
        `Rider ${riderName} has started your delivery. Track your order in real-time.`,
        NotificationType.ORDER,
        `/orders/${order.orderNumber}`,
        {
          orderNumber: order.orderNumber,
          riderName: riderName,
          status: "OUT_FOR_DELIVERY",
          riderId: user.id,
        },
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      statusChanged: statusChanged,
      message: statusChanged
        ? "Order is now out for delivery"
        : "Location updated successfully",
    });
  } catch (error) {
    console.error("Error updating rider location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
