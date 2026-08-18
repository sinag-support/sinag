import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
   try {
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

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
         return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
         )
      }

      const users = await prisma.user.findMany({
         where: {
            NOT: {
               email: user.email
            }
         },
         select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
         }
      })

      return NextResponse.json({ users })
   } catch (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
      )
   }
}

export async function POST(request: Request) {
   try {
      const { email, password, name, role } = await request.json()

      // Validate inputs
      if (!email || !password || !name || !role) {
         return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
         )
      }

      // Create user in Supabase Auth using service role
      const supabaseAdmin = createClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
         email,
         password,
         email_confirm: true,
         user_metadata: {
            name,
            role,
         },
      })

      if (error) {
         return NextResponse.json(
            { error: error.message },
            { status: 400 }
         )
      }

      // Create user in Prisma
      await prisma.user.create({
         data: {
            email,
            name,
            role: role as 'STAFF' | 'RIDER',
         }
      })

      return NextResponse.json({
         success: true,
         message: 'User created successfully'
      })
   } catch (error) {
      console.error('Error creating user:', error)
      return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
      )
   }
}