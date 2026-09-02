// app/api/admin/profile/route.ts

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

    return dbUser;
  } catch (error) {
    console.error("Error in getAuthUser:", error);
    return null;
  }
}

// ✅ GET - Fetch user profile with store location for ALL authenticated users
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Always fetch the store location (global setting, not tied to a specific user)
    const storeLocation = await prisma.address.findFirst({
      where: {
        isStoreLocation: true, // ✅ Just find the store location
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
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

// ✅ PUT - Update user profile (only ADMIN can update store location)
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, storeLocation } = await request.json();

    // Update user name if provided
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    // ✅ Only ADMIN can update store location
    if (storeLocation && user.role === "ADMIN") {
      // Check if store location already exists
      const existingStore = await prisma.address.findFirst({
        where: {
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
            userId: user.id,
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

    // Fetch updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        addresses: true,
      },
    });

    // ✅ Always fetch store location (no userId restriction)
    const storeLocationData = await prisma.address.findFirst({
      where: {
        isStoreLocation: true,
      },
    });

    return NextResponse.json({
      id: updatedUser?.id,
      email: updatedUser?.email,
      name: updatedUser?.name,
      role: updatedUser?.role,
      avatar: updatedUser?.avatar,
      createdAt: updatedUser?.createdAt,
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
