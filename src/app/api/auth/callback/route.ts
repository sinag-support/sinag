import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
   const requestUrl = new URL(request.url)
   const code = requestUrl.searchParams.get('code')

   if (code) {
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
      await supabase.auth.exchangeCodeForSession(code)

      // Get user info
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
         // Check if user exists in database
         const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
         })

         if (!existingUser) {
            // Create user in database
            await prisma.user.create({
               data: {
                  email: user.email!,
                  name: user.user_metadata?.name || user.email?.split('@')[0],
                  role: 'USER',
               }
            })
         }
      }
   }

   return NextResponse.redirect(new URL('/', requestUrl.origin))
}