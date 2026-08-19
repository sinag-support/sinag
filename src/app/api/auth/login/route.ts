import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
   try {
      const { email, password } = await request.json()

      // Validate input
      if (!email || !password) {
         return NextResponse.json(
            { error: 'Email and password are required' },
            { status: 400 }
         )
      }

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
         console.error('Supabase sign in error:', error.message, error)
         return NextResponse.json(
            { error: `Authentication failed: ${error.message}` },
            { status: 400 }
         )
      }

      if (!data.user) {
         return NextResponse.json(
            { error: 'No user data returned' },
            { status: 400 }
         )
      }

      // Get or create user in database
      let dbUser = await prisma.user.findUnique({
         where: { email: data.user.email! },
         select: { role: true }
      })

      if (!dbUser) {
         // Create user with role from metadata or default USER
         const role = data.user.user_metadata?.role || 'USER'
         dbUser = await prisma.user.create({
            data: {
               email: data.user.email!,
               name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
               role: role,
            },
            select: { role: true }
         })
         console.log('Created new user in DB:', data.user.email, 'Role:', role)
      }

      return NextResponse.json({
         success: true,
         role: dbUser.role,
         email: data.user.email,
      })

   } catch (error) {
      console.error('Login API error:', error)
      return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
      )
   }
}