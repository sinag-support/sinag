import { NextResponse } from "next/server";
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

// GET - Fetch all addresses for the user (excluding store location)
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId,
        isStoreLocation: false,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("GET /api/addresses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create a new address
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId,
        address,
        city,
        province,
        postalCode,
        country: country || "Philippines",
        latitude: latitude || null,
        longitude: longitude || null,
        landmark: landmark || null,
        isDefault: isDefault || false,
        isStoreLocation: false,
      },
    });

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    console.error("POST /api/addresses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
