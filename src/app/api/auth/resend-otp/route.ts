import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
   try {
      const cookieStore = await cookies()
      const email = cookieStore.get('signup_email')?.value
      const password = cookieStore.get('signup_password')?.value
      const name = cookieStore.get('signup_name')?.value

      if (!email || !password || !name) {
         return NextResponse.json(
            { error: 'Session expired. Please restart signup.' },
            { status: 400 }
         )
      }

      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = Date.now() + 10 * 60 * 1000

      const response = NextResponse.json({ success: true })

      // Update cookies with new OTP
      response.cookies.set('signup_otp', otpCode, {
         maxAge: 600,
         httpOnly: true,
         path: '/',
      })
      response.cookies.set('signup_otp_expires', expiresAt.toString(), {
         maxAge: 600,
         httpOnly: true,
         path: '/',
      })

      // Send email
      const transporter = nodemailer.createTransport({
         service: process.env.MAIL_SMTP_SERVICE || 'gmail',
         auth: {
            user: process.env.MAIL_SMTP_USER,
            pass: process.env.MAIL_SMTP_PASS,
         },
      })

      await transporter.sendMail({
         from: process.env.MAIL_SMTP_USER,
         to: email,
         subject: 'Your new SINAG OTP',
         html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
               <h2 style="color: #1a1a1a; text-align: center;">New OTP</h2>
               <p style="color: #4a4a4a; text-align: center;">Your new OTP is:</p>
               <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1a1a;">${otpCode}</span>
               </div>
               <p style="color: #888; font-size: 12px; text-align: center;">This OTP will expire in 10 minutes.</p>
            </div>
         `,
      })

      return response
   } catch (error) {
      console.error('Resend OTP error:', error)
      return NextResponse.json(
         { error: 'Failed to resend OTP' },
         { status: 500 }
      )
   }
}