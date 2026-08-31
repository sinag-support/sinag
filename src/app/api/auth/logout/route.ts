import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
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

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return NextResponse.json({ error: "Logout failed" }, { status: 500 });
    }

    // ✅ Create response and clear all auth cookies
    const response = NextResponse.json({ success: true });

    // Clear all possible Supabase auth cookies
    const allCookies = cookieStore.getAll();
    const authCookieNames = allCookies
      .map((c) => c.name)
      .filter(
        (name) =>
          name.includes("supabase") ||
          name.includes("sb-") ||
          name.includes("auth") ||
          name === "next-auth.session-token",
      );

    authCookieNames.forEach((name) => {
      response.cookies.delete(name);
    });

    // Also clear specific known cookie names
    const knownCookies = [
      "supabase-auth-token",
      "sb-access-token",
      "sb-refresh-token",
      "sb-provider-token",
      "sb-user-session",
    ];

    knownCookies.forEach((name) => {
      response.cookies.delete(name);
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
