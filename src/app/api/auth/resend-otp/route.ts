import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
   try {
      const { searchParams } = new URL(request.url)
      const mode = searchParams.get('mode') || 'signup'
      const cookieStore = await cookies()

      let email, otpCookie, expiresCookie

      if (mode === 'reset') {
         email = cookieStore.get('reset_email')?.value
         otpCookie = 'reset_otp'
         expiresCookie = 'reset_otp_expires'
      } else {
         email = cookieStore.get('signup_email')?.value
         otpCookie = 'signup_otp'
         expiresCookie = 'signup_otp_expires'
      }

      if (!email) {
         return NextResponse.json(
            { error: 'Session expired. Please restart.' },
            { status: 400 }
         )
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = Date.now() + 10 * 60 * 1000

      const response = NextResponse.json({ success: true })

      response.cookies.set(otpCookie, otpCode, {
         maxAge: 600,
         httpOnly: true,
         path: '/',
      })
      response.cookies.set(expiresCookie, expiresAt.toString(), {
         maxAge: 600,
         httpOnly: true,
         path: '/',
      })

      const transporter = nodemailer.createTransport({
         service: process.env.MAIL_SMTP_SERVICE || 'gmail',
         auth: {
            user: process.env.MAIL_SMTP_USER,
            pass: process.env.MAIL_SMTP_PASS,
         },
      })

      const subject = mode === 'reset'
         ? 'Your new SINAG OTP (Password Reset)'
         : 'Your new SINAG OTP'

      await transporter.sendMail({
         from: process.env.MAIL_SMTP_USER,
         to: email,
         subject,
         html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
               <h2 style="color: #1a1a1a; text-align: center;">${subject}</h2>
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