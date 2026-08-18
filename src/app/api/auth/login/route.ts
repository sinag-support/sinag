import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
   try {
      console.log('=== LOGIN API CALLED ===')
      const { email, password } = await request.json()
      console.log('Login attempt for:', email)

      // Use admin client to update user metadata
      const supabaseAdmin = createClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // First, sign in the user
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

      console.log('Attempting Supabase sign in...')
      const { data, error } = await supabase.auth.signInWithPassword({
         email,
         password,
      })

      if (error) {
         console.log('Supabase sign in error:', error.message)
         return NextResponse.json(
            { error: error.message },
            { status: 400 }
         )
      }

      if (data.user) {
         console.log('Supabase sign in successful for:', data.user.email)
         
         // Check if user exists in database
         console.log('Checking database for user:', data.user.email)
         let dbUser = await prisma.user.findUnique({
            where: { email: data.user.email! },
            select: { role: true }
         })

         console.log('Database user found:', dbUser)

         // If not, create them with USER role
         if (!dbUser) {
            console.log('User not in DB, creating...')
            dbUser = await prisma.user.create({
               data: {
                  email: data.user.email!,
                  name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
                  role: 'USER',
               },
               select: { role: true }
            })
            console.log('Created user with role:', dbUser.role)
         }

        // Update user metadata with role
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
           data.user.id,
           {
              user_metadata: {
                 ...data.user.user_metadata,
                 role: dbUser.role,
              }
           }
        )

        if (updateError) {
           console.error('Error updating user metadata:', updateError)
        } else {
           console.log('Updated user metadata with role:', dbUser.role)
        }

        console.log('Returning role:', dbUser.role)
        return NextResponse.json({
           success: true,
           role: dbUser.role,
           email: data.user.email,
        })
      }

      console.log('Login failed - no user data')
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