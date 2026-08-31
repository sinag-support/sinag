import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: "",
            maxAge: 0,
            ...options,
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isHomeRoute = pathname === "/";

  if (isHomeRoute && session) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { role: true },
        });

        if (dbUser && ["ADMIN", "STAFF", "RIDER"].includes(dbUser.role)) {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      return res;
    }
  }

  if (isAdminRoute && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAuthRoute) {
    if (session.user) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: { role: true },
        });
        if (dbUser && ["ADMIN", "STAFF", "RIDER"].includes(dbUser.role)) {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/register", "/"],
};
