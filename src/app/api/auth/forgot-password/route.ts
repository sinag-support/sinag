import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 },
      );
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const cookieStore = await cookies();

    // Store OTP and email in cookies
    const response = NextResponse.json({ success: true });

    response.cookies.set("reset_otp", otpCode, {
      maxAge: 600,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
    response.cookies.set("reset_otp_expires", expiresAt.toString(), {
      maxAge: 600,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
    response.cookies.set("reset_email", email, {
      maxAge: 600,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });

    // Send email with OTP
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
        subject: "Reset your SINAG password",
        html: `
               <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                  <h2 style="color: #1a1a1a; text-align: center;">Reset Your Password</h2>
                  <p style="color: #4a4a4a; text-align: center;">Enter the following OTP to reset your password:</p>
                  <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                     <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1a1a;">${otpCode}</span>
                  </div>
                  <p style="color: #888; font-size: 12px; text-align: center;">This OTP will expire in 10 minutes.</p>
                  <p style="color: #888; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
               </div>
            `,
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
      return NextResponse.json(
        { error: "Failed to send OTP email. Please try again." },
        { status: 500 },
      );
    }

    return response;
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
