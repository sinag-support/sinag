import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserRole } from "@/lib/role";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const role = await getCurrentUserRole();
  if (!role || role === "USER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;
  const riderId = searchParams.get("riderId") || undefined;

  const where: any = {};

  // Status filter
  if (status) {
    const statuses = status.split(",").filter(Boolean);
    if (statuses.length > 0) {
      where.status = { in: statuses };
    }
  }

  // Rider filter - for riders only showing their assigned orders
  if (role === "RIDER") {
    const userId = await getCurrentUserId();
    where.riderId = userId;
    // Only show these statuses for riders
    if (!status) {
      where.status = {
        in: ["ASSIGNED_RIDER", "OUT_FOR_DELIVERY", "READY_FOR_PICKUP"],
      };
    }
  }

  // Admin filtering by specific rider
  if (role === "ADMIN" && riderId) {
    where.riderId = riderId;
  }

  // Search filter
  if (search) {
    const num = parseInt(search);
    const conditions = [];
    if (!isNaN(num)) {
      conditions.push({ orderNumber: num });
    }
    conditions.push(
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { phone: { contains: search, mode: "insensitive" } } }, // ✅ Add phone search
    );
    where.OR = conditions;
  }

  // Get total count for pagination
  const total = await prisma.order.count({ where });

  // Get orders with pagination
  const orders = await prisma.order.findMany({
    where,
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
      items: {
        include: {
          product: {
            select: {
              id: true,
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
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return NextResponse.json({
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

// Helper function to get current user ID
async function getCurrentUserId() {
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
    } = await supabase.auth.getUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true },
    });

    return dbUser?.id || null;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
}
