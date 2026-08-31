import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserRole } from "@/lib/role";
import { createClient } from "@supabase/supabase-js";

// ✅ Lazy initialize the admin client
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  try {
    const role = await getCurrentUserRole();
    if (!role || role === "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const search = searchParams.get("search") || "";
    const userRole = searchParams.get("role");

    const where: any = {};

    // Filter by email
    if (email) {
      where.email = email;
    }

    // Filter by role
    if (userRole) {
      where.role = userRole;
    }

    // Exclude ADMIN users from the list (for user management)
    // But if we're looking for a specific user by email, don't exclude ADMIN
    if (!email) {
      where.role = {
        not: "ADMIN",
      };
    }

    // Search filter
    if (search && !email) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = await getCurrentUserRole();
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, password, name, role: userRole } = await request.json();

    if (!email || !password || !name || !userRole) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if user already exists in Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    // Create in Supabase Auth
    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: userRole },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } catch (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Failed to create user in authentication system" },
        { status: 500 },
      );
    }

    // Create in Prisma
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role: userRole as "STAFF" | "RIDER",
        avatar: null,
      },
    });

    // Create welcome notification for the new user
    try {
      await prisma.notification.create({
        data: {
          userId: newUser.id,
          title: "Welcome to SINAG! 🎉",
          description: `Your account has been created with the role of ${userRole}. Welcome to the team!`,
          type: "DEFAULT",
          read: false,
        },
      });
      console.log("✅ Welcome notification created for:", email);
    } catch (notifError) {
      console.error("Error creating welcome notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
