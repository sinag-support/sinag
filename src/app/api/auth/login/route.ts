import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js"; // ✅ Add this import

const TEST_ROLES: Record<string, string> = {
  "admin@sinag.com": "ADMIN",
  "staff@sinag.com": "STAFF",
  "rider@sinag.com": "RIDER",
  "user@sinag.com": "USER",
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

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
            cookieStore.set({ name, value, path: "/", ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({
              name,
              value: "",
              path: "/",
              maxAge: 0,
              ...options,
            });
          },
        },
      },
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || "Authentication failed" },
        { status: 400 },
      );
    }

    // ✅ Get or sync user in DB
    let dbUser = await prisma.user.findUnique({
      where: { email: data.user.email! },
      select: { role: true, id: true, name: true },
    });

    if (!dbUser) {
      // If user exists in Auth but not in Prisma, create them
      let role = data.user.user_metadata?.role;
      if (!role && data.user.email && TEST_ROLES[data.user.email]) {
        role = TEST_ROLES[data.user.email];
      }
      role = role || "USER";

      dbUser = await prisma.user.create({
        data: {
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
          role,
        },
        select: { role: true, id: true, name: true },
      });

      console.log("✅ Created new user in Prisma from login:", data.user.email);
    }

    // ✅ Ensure auth user has correct metadata (sync)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      data: { users },
    } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (authUser) {
      const currentName = authUser.user_metadata?.name;
      const currentRole = authUser.user_metadata?.role;

      if (currentName !== dbUser.name || currentRole !== dbUser.role) {
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          user_metadata: {
            name: dbUser.name,
            role: dbUser.role,
          },
        });
        console.log("✅ Synced auth metadata for:", email);
      }
    }

    return NextResponse.json({
      success: true,
      role: dbUser.role,
      email: data.user.email,
      user: data.user,
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
