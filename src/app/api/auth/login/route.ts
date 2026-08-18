import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
   try {
      const { email, password } = await request.json()

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

      const { data, error } = await supabase.auth.signInWithPassword({
         email,
         password,
      })

      if (error) {
         return NextResponse.json(
            { error: error.message },
            { status: 400 }
         )
      }

      if (data.user) {
         // Get user role from database
         const dbUser = await prisma.user.findUnique({
            where: { email: data.user.email! },
            select: { role: true }
         })

         const role = dbUser?.role || 'USER'

         return NextResponse.json({
            success: true,
            role,
            email: data.user.email,
         })
      }

      return NextResponse.json(
         { error: 'Login failed' },
         { status: 400 }
      )
   } catch (error) {
      console.error('Login error:', error)
      return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
      )
   }
}