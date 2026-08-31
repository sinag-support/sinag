import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL("/login?error=callback_failed", requestUrl.origin),
      );
    }

    const user = data?.user;

    if (user) {
      try {
        // ✅ Get avatar from user metadata
        const avatarUrl =
          user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        // Check if user exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        let newUser;
        if (!existingUser) {
          let role = user.user_metadata?.role || "USER";

          // Create user in database
          newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.user_metadata?.name || user.email?.split("@")[0],
              role: role,
              avatar: avatarUrl, // ✅ Save avatar
            },
          });

          // Create welcome notification
          await prisma.notification.create({
            data: {
              userId: newUser.id,
              title: "Welcome to SINAG! 🎉",
              description:
                "Thank you for joining our community. Start exploring and shopping with us!",
              type: "DEFAULT",
              read: false,
            },
          });

          console.log(
            "✅ Created user and welcome notification from OAuth callback:",
            user.email,
          );
        } else {
          // ✅ Update avatar if changed
          if (existingUser.avatar !== avatarUrl && avatarUrl) {
            await prisma.user.update({
              where: { email: user.email! },
              data: {
                avatar: avatarUrl,
                name: user.user_metadata?.name || existingUser.name,
              },
            });
            console.log("✅ Updated user from OAuth:", user.email);
          }
        }
      } catch (dbError) {
        console.error("Database error in auth callback:", dbError);
      }
    }
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
