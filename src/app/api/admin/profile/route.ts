import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getAdminUser() {
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
      include: {
        addresses: true,
      },
    });

    // Only allow ADMIN
    if (dbUser?.role !== "ADMIN") return null;

    return dbUser;
  } catch (error) {
    console.error("Error in getAdminUser:", error);
    return null;
  }
}

// GET - Fetch admin profile with store location
export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find store location address
    const storeLocation = await prisma.address.findFirst({
      where: {
        userId: admin.id,
        isStoreLocation: true,
      },
    });

    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      avatar: admin.avatar,
      createdAt: admin.createdAt,
      storeLocation: storeLocation || null,
    });
  } catch (error) {
    console.error("GET /api/admin/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update admin profile and store location
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, storeLocation } = await request.json();

    // Update admin name if provided
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { name },
      });
    }

    // Update store location if provided
    if (storeLocation) {
      // Check if store location already exists
      const existingStore = await prisma.address.findFirst({
        where: {
          userId: admin.id,
          isStoreLocation: true,
        },
      });

      if (existingStore) {
        // Update existing store location
        await prisma.address.update({
          where: { id: existingStore.id },
          data: {
            address: storeLocation.address,
            city: storeLocation.city,
            province: storeLocation.province,
            postalCode: storeLocation.postalCode,
            country: storeLocation.country || "Philippines",
            latitude: storeLocation.latitude || null,
            longitude: storeLocation.longitude || null,
            landmark: storeLocation.landmark || null,
          },
        });
      } else {
        // Create new store location
        await prisma.address.create({
          data: {
            userId: admin.id,
            address: storeLocation.address,
            city: storeLocation.city,
            province: storeLocation.province,
            postalCode: storeLocation.postalCode,
            country: storeLocation.country || "Philippines",
            latitude: storeLocation.latitude || null,
            longitude: storeLocation.longitude || null,
            landmark: storeLocation.landmark || null,
            isStoreLocation: true,
          },
        });
      }
    }

    // Fetch updated admin with store location
    const updatedAdmin = await prisma.user.findUnique({
      where: { id: admin.id },
      include: {
        addresses: true,
      },
    });

    const storeLocationData = await prisma.address.findFirst({
      where: {
        userId: admin.id,
        isStoreLocation: true,
      },
    });

    return NextResponse.json({
      id: updatedAdmin?.id,
      email: updatedAdmin?.email,
      name: updatedAdmin?.name,
      role: updatedAdmin?.role,
      avatar: updatedAdmin?.avatar,
      createdAt: updatedAdmin?.createdAt,
      storeLocation: storeLocationData || null,
    });
  } catch (error) {
    console.error("PUT /api/admin/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
