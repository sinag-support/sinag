import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserRole } from "@/lib/role";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = await getCurrentUserRole();
  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden - Admin only" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const { riderId } = await request.json();

  // Allow null or empty string to remove rider
  if (riderId === undefined) {
    return NextResponse.json(
      { error: "Rider ID is required" },
      { status: 400 },
    );
  }

  // If riderId is null or empty string, we're removing the rider
  if (!riderId) {
    // Update the order by removing rider assignment
    const order = await prisma.order.update({
      where: { id },
      data: {
        riderId: null,
        // Only change status if it's ASSIGNED_RIDER, otherwise keep current status
        ...(await prisma.order
          .findUnique({ where: { id }, select: { status: true } })
          .then((order) =>
            order?.status === "ASSIGNED_RIDER"
              ? { status: "READY_FOR_PICKUP" }
              : {},
          )),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true, // ✅ Add phone to user select
          },
        },
        rider: { select: { id: true, name: true, email: true } },
        address: true,
      },
    });

    return NextResponse.json({
      success: true,
      order,
      message: "Rider removed from order",
    });
  }

  // Check if rider exists and has RIDER role
  const rider = await prisma.user.findUnique({
    where: { id: riderId },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!rider) {
    return NextResponse.json({ error: "Rider not found" }, { status: 404 });
  }

  if (rider.role !== "RIDER") {
    return NextResponse.json({ error: "User is not a rider" }, { status: 400 });
  }

  // Update the order with rider assignment
  const order = await prisma.order.update({
    where: { id },
    data: {
      riderId: riderId,
      status: "ASSIGNED_RIDER",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true, // ✅ Add phone to user select
        },
      },
      rider: { select: { id: true, name: true, email: true } },
      address: true,
    },
  });

  return NextResponse.json({
    success: true,
    order,
    message: `Order assigned to ${rider.name || rider.email}`,
  });
}
