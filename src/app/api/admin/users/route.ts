import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const role = await getCurrentUserRole()
  if (!role || role === 'USER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const search = searchParams.get('search') || ''
  const userRole = searchParams.get('role') // 👈 Add this to filter by role

  const where: any = {}
  
  // Filter by email
  if (email) {
    where.email = email
  }
  
  // Filter by role
  if (userRole) {
    where.role = userRole
  }
  
  // Search filter
  if (search && !email) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { role: { contains: search, mode: 'insensitive' } },
    ]
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // 👇 Return the array directly, not wrapped in an object
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, password, name, role: userRole } = await request.json()

  if (!email || !password || !name || !userRole) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: userRole },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await prisma.user.create({
    data: {
      email,
      name,
      role: userRole as 'STAFF' | 'RIDER',
    },
  })

  return NextResponse.json({ success: true, message: 'User created successfully' })
}