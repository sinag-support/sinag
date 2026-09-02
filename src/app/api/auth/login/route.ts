import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

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

    const avatarUrl =
      data.user.user_metadata?.avatar_url ||
      data.user.user_metadata?.picture ||
      null;

    let dbUser = await prisma.user.findUnique({
      where: { email: data.user.email! },
      select: { role: true, id: true, name: true, avatar: true },
    });

    if (!dbUser) {
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
          avatar: avatarUrl,
        },
        select: { role: true, id: true, name: true, avatar: true },
      });

      console.log("Created new user in Prisma from login:", data.user.email);
    } else {
      if (dbUser.avatar !== avatarUrl && avatarUrl) {
        await prisma.user.update({
          where: { email: data.user.email! },
          data: { avatar: avatarUrl },
        });
        console.log("Updated avatar for user:", data.user.email);
      }
    }

    return NextResponse.json({
      success: true,
      role: dbUser.role,
      email: data.user.email,
      user: data.user,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
