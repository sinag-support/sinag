import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

      // Check if user exists in database
      let dbUser = await prisma.user.findUnique({
         where: { email: user.email! },
         select: { role: true }
      })

      // If not, create them with role from metadata or USER
      if (!dbUser) {
         const role = user.user_metadata?.role || 'USER'
         dbUser = await prisma.user.create({
            data: {
               email: user.email!,
               name: user.user_metadata?.name || user.email?.split('@')[0],
               role: role,
            },
            select: { role: true }
         })
      }

      return NextResponse.json({ role: dbUser.role })
   } catch (error) {
      console.error('Error fetching user role:', error)
      return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
      )
   }
}