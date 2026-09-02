import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getUserId() {
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
    console.error("Error in getUserId:", error);
    return null;
  }
}

// PUT - Update an address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const {
      address,
      city,
      province,
      postalCode,
      country,
      latitude,
      longitude,
      landmark,
      isDefault,
    } = await request.json();

    if (!address || !city || !province || !postalCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if address belongs to user
    const existing = await prisma.address.findUnique({
      where: { id },
      select: { userId: true, isStoreLocation: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ❌ Prevent users from editing store location
    if (existing.isStoreLocation) {
      return NextResponse.json(
        { error: "Cannot edit store location" },
        { status: 403 },
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        address,
        city,
        province,
        postalCode,
        country: country || "Philippines",
        latitude: latitude || null,
        longitude: longitude || null,
        landmark: landmark || null,
        isDefault: isDefault || false,
        // ✅ isStoreLocation stays unchanged
      },
    });

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error("PUT /api/addresses/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete an address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if address belongs to user
    const existing = await prisma.address.findUnique({
      where: { id },
      select: { userId: true, isStoreLocation: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ❌ Prevent users from deleting store location
    if (existing.isStoreLocation) {
      return NextResponse.json(
        { error: "Cannot delete store location" },
        { status: 403 },
      );
    }

    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/addresses/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
