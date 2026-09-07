import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
            } catch (error) {
              // Server component write protection safe-catch
            }
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
      select: { id: true, role: true },
    });

    return dbUser;
  } catch (error) {
    console.error("Error in getAuthUser:", error);
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

    // Verify order exists and get current state
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, riderId: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if rider is assigned OR auto-assign
    if (order.riderId && order.riderId !== user.id) {
      return NextResponse.json(
        { error: "Not your assigned order" },
        { status: 403 },
      );
    }

    // Perform database update with explicit field names
    const updateData: any = {
      riderLat: riderLat,
      riderLng: riderLng,
      updatedAt: new Date(),
    };

    // Auto-bind rider if missing
    if (!order.riderId) {
      updateData.riderId = user.id;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating rider location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
