import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
   try {
      const { email, password, name, otp, step } = await request.json()

      const cookieStore = await cookies()
      
      const supabase = createServerClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
         {
            cookies: {
               get(name: string) {
                  return cookieStore.get(name)?.value
               },
               set(name: string, value: string, options: any) {
                  cookieStore.set({ name, value, ...options })
               },
               remove(name: string, options: any) {
                  cookieStore.set({ name, value: '', ...options })
               },
            },
         }
      )

      if (step === 'send-otp') {
         const existingUser = await prisma.user.findUnique({
            where: { email }
         })

         if (existingUser) {
            return NextResponse.json(
               { error: 'User already exists' },
               { status: 400 }
            )
         }

         const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
         const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes from now

         const response = NextResponse.json({ success: true })

         // Store OTP, user data, and expiration
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
         response.cookies.set('signup_email', email, {
            maxAge: 600,
            httpOnly: true,
            path: '/',
         })
         response.cookies.set('signup_password', password, {
            maxAge: 600,
            httpOnly: true,
            path: '/',
         })
         response.cookies.set('signup_name', name, {
            maxAge: 600,
            httpOnly: true,
            path: '/',
         })

         // Send email
         try {
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
               subject: 'Verify your SINAG account',
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
            })
         } catch (emailError) {
            console.error('Email error:', emailError)
         }

         return response
      }

      if (step === 'verify-otp') {
         const storedOtp = cookieStore.get('signup_otp')?.value
         const storedEmail = cookieStore.get('signup_email')?.value
         const storedPassword = cookieStore.get('signup_password')?.value
         const storedName = cookieStore.get('signup_name')?.value
         const storedExpires = cookieStore.get('signup_otp_expires')?.value

         if (!storedOtp || !storedEmail || !storedPassword || !storedName || !storedExpires) {
            return NextResponse.json(
               { error: 'OTP expired. Please try again.' },
               { status: 400 }
            )
         }

         // Check expiration
         const expiresAt = parseInt(storedExpires)
         if (Date.now() > expiresAt) {
            return NextResponse.json(
               { error: 'OTP has expired. Please request a new one.' },
               { status: 400 }
            )
         }

         if (storedOtp !== otp || storedEmail !== email) {
            return NextResponse.json(
               { error: 'Invalid OTP' },
               { status: 400 }
            )
         }

         // Create user in Supabase Auth
         const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
         )

         const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: storedPassword,
            email_confirm: true,
            user_metadata: {
               name: storedName,
               role: 'USER',
            },
         })

         if (authError) {
            return NextResponse.json(
               { error: authError.message },
               { status: 400 }
            )
         }

         await prisma.user.create({
            data: {
               email,
               name: storedName,
               role: 'USER',
            }
         })

         // Auto-login
         await supabase.auth.signInWithPassword({
            email,
            password: storedPassword,
         })

         const response = NextResponse.json({ success: true })
         response.cookies.delete('signup_otp')
         response.cookies.delete('signup_otp_expires')
         response.cookies.delete('signup_email')
         response.cookies.delete('signup_password')
         response.cookies.delete('signup_name')

         return response
      }

      return NextResponse.json(
         { error: 'Invalid step' },
         { status: 400 }
      )
   } catch (error) {
      console.error('Signup error:', error)
      return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
      )
   }
}