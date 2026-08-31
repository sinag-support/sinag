import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email, password, name, otp, step, mode, newPassword } =
      await request.json();

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

    if (step === "send-otp") {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 },
        );
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      const response = NextResponse.json({ success: true });

      response.cookies.set("signup_otp", otpCode, {
        maxAge: 600,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      });
      response.cookies.set("signup_otp_expires", expiresAt.toString(), {
        maxAge: 600,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      });
      response.cookies.set("signup_email", email, {
        maxAge: 600,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      });
      response.cookies.set("signup_password", password, {
        maxAge: 600,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      });
      response.cookies.set("signup_name", name, {
        maxAge: 600,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      });

      try {
        const transporter = nodemailer.createTransport({
          service: process.env.MAIL_SMTP_SERVICE || "gmail",
          auth: {
            user: process.env.MAIL_SMTP_USER,
            pass: process.env.MAIL_SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.MAIL_SMTP_USER,
          to: email,
          subject: "Verify your SINAG account",
          html: `
                  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                     <h2 style="color: #1a1a1a; text-align: center;">Welcome to SINAG!</h2>
                     <p style="color: #4a4a4a; text-align: center;">Please use the following OTP to verify your email address:</p>
                     <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1a1a;">${otpCode}</span>
                     </div>
                     <p style="color: #888; font-size: 12px; text-align: center;">This OTP will expire in 10 minutes.</p>
                  </div>
               `,
        });
      } catch (emailError) {
        console.error("Email error:", emailError);
      }

      return response;
    }

    if (step === "verify-otp") {
      let storedOtp, storedEmail, storedPassword, storedName, storedExpires;
      let isReset = false;

      if (mode === "reset") {
        storedOtp = cookieStore.get("reset_otp")?.value;
        storedEmail = cookieStore.get("reset_email")?.value;
        storedExpires = cookieStore.get("reset_otp_expires")?.value;
        isReset = true;
      } else {
        storedOtp = cookieStore.get("signup_otp")?.value;
        storedEmail = cookieStore.get("signup_email")?.value;
        storedPassword = cookieStore.get("signup_password")?.value;
        storedName = cookieStore.get("signup_name")?.value;
        storedExpires = cookieStore.get("signup_otp_expires")?.value;
      }

      if (!storedOtp || !storedEmail || !storedExpires) {
        return NextResponse.json(
          { error: "OTP expired. Please try again." },
          { status: 400 },
        );
      }

      if (!isReset && (!storedPassword || !storedName)) {
        return NextResponse.json(
          { error: "Invalid session. Please restart signup." },
          { status: 400 },
        );
      }

      const expiresAt = parseInt(storedExpires);
      if (Date.now() > expiresAt) {
        return NextResponse.json(
          { error: "OTP has expired. Please request a new one." },
          { status: 400 },
        );
      }

      if (storedOtp !== otp || storedEmail !== email) {
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
      }

      if (isReset) {
        if (!newPassword) {
          return NextResponse.json(
            { error: "New password is required" },
            { status: 400 },
          );
        }

        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        const {
          data: { users },
          error: userError,
        } = await supabaseAdmin.auth.admin.listUsers();
        if (userError) {
          console.error("List users error:", userError);
          return NextResponse.json(
            { error: "Failed to verify user" },
            { status: 500 },
          );
        }

        const normalizedEmail = email.toLowerCase();
        const user = users.find(
          (u) => u.email?.toLowerCase() === normalizedEmail,
        );

        if (!user) {
          console.error("User not found for email:", email);
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 },
          );
        }

        const { error: updateError } =
          await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: newPassword,
          });

        if (updateError) {
          console.error("Update password error:", updateError);
          return NextResponse.json(
            { error: updateError.message },
            { status: 400 },
          );
        }

        const response = NextResponse.json({ success: true });
        response.cookies.delete("reset_otp");
        response.cookies.delete("reset_otp_expires");
        response.cookies.delete("reset_email");
        return response;
      } else {
        // Signup flow
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password: storedPassword as string,
            email_confirm: true,
            user_metadata: {
              name: storedName,
              role: "USER",
            },
          });

        if (authError) {
          return NextResponse.json(
            { error: authError.message },
            { status: 400 },
          );
        }

        // ✅ Create user in Prisma
        const newUser = await prisma.user.create({
          data: {
            email,
            name: storedName,
            role: "USER",
            avatar: null, // No avatar for manual signup
          },
        });

        // ✅ Create welcome notification for the new user
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

        console.log("✅ Welcome notification created for:", email);

        await supabase.auth.signInWithPassword({
          email,
          password: storedPassword as string,
        });

        const response = NextResponse.json({ success: true });
        response.cookies.delete("signup_otp");
        response.cookies.delete("signup_otp_expires");
        response.cookies.delete("signup_email");
        response.cookies.delete("signup_password");
        response.cookies.delete("signup_name");
        return response;
      }
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
