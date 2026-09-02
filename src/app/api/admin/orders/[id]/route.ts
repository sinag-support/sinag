import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserRole } from "@/lib/role";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = await getCurrentUserRole();
  if (!role || role === "USER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      rider: { select: { id: true, name: true, email: true } },
      address: true,
      items: {
        include: {
          product: {
            select: {
              title: true,
              price: true,
              images: true,
            },
          },
          option: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },
      payments: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

// ✅ ADD DELETE endpoint
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const role = await getCurrentUserRole();
    // Only ADMIN can delete orders
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Delete all order items first (cascade should handle this, but explicit is safer)
    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    });

    // Delete all payments
    await prisma.payment.deleteMany({
      where: { orderId: id },
    });

    // Delete the order
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/admin/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
