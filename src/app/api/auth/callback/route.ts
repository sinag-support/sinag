import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js"; // ✅ Add this import

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
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

    // ✅ Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL("/login?error=callback_failed", requestUrl.origin),
      );
    }

    // ✅ Get user info from the session data
    const user = data?.user;

    if (user) {
      try {
        // ✅ Check if user exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // ✅ Get role from user metadata or default to USER
          let role = user.user_metadata?.role || "USER";

          // ✅ Create user in database
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.user_metadata?.name || user.email?.split("@")[0],
              role: role,
            },
          });
          console.log(
            "✅ Created user in database from OAuth callback:",
            user.email,
          );
        } else {
          // ✅ Update user metadata in Prisma if needed
          const currentName = user.user_metadata?.name;
          if (currentName && existingUser.name !== currentName) {
            await prisma.user.update({
              where: { email: user.email! },
              data: { name: currentName },
            });
          }
        }
      } catch (dbError) {
        console.error("Database error in auth callback:", dbError);
        // Still redirect - don't block the user
      }
    }
  }

  // ✅ Redirect to home page after successful callback
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
