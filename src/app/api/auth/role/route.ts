import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// ✅ Remove this import - it's not used
// import { syncUserWithAuth } from "@/lib/sync-user";

const TEST_ROLES: Record<string, string> = {
  "admin@sinag.com": "ADMIN",
  "staff@sinag.com": "STAFF",
  "rider@sinag.com": "RIDER",
  "user@sinag.com": "USER",
};

export async function GET() {
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Try to find user in Prisma
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true },
    });

    if (!dbUser) {
      // ✅ If user doesn't exist in Prisma, create them
      let role = user.user_metadata?.role;
      if (!role && user.email && TEST_ROLES[user.email]) {
        role = TEST_ROLES[user.email];
      }
      role = role || "USER";

      dbUser = await prisma.user.create({
        data: {
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split("@")[0],
          role,
        },
        select: { role: true },
      });

      console.log("✅ Created user in Prisma from role check:", user.email);
    }

    return NextResponse.json({ role: dbUser.role });
  } catch (error) {
    console.error("Role API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
