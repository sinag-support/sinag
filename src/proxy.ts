import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
   const res = NextResponse.next()
   
   const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
         cookies: {
            get(name: string) {
               return req.cookies.get(name)?.value
            },
            set(name: string, value: string, options: any) {
               res.cookies.set({
                  name,
                  value,
                  ...options,
               })
            },
            remove(name: string, options: any) {
               res.cookies.set({
                  name,
                  value: '',
                  ...options,
               })
            },
         },
      }
   )

   const {
      data: { session },
   } = await supabase.auth.getSession()

   const pathname = req.nextUrl.pathname
   const isAdminRoute = pathname.startsWith('/admin')
   const isAuthRoute = pathname === '/login' || pathname === '/register'

   // Allow all admin routes - no redirects
   if (isAdminRoute) {
      return res
   }

   // If not logged in and trying to access protected routes
   if (!session) {
      return res
   }

   // If logged in and trying to access auth routes
   if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/', req.url))
   }

   return res
}

export const config = {
   matcher: ['/admin/:path*', '/login', '/register'],
}