import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'
import { createClient } from '@supabase/supabase-js'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { name, email, role: newRole, password } = body

  // Update user in Prisma
  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      role: newRole,
    },
  })

  // If password is provided, update it in Supabase Auth
  if (password) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Get user's auth ID from Supabase
      const { data: authUsers, error: findError } = await supabaseAdmin.auth.admin.listUsers()
      if (findError) throw findError

      const authUser = authUsers.users.find((u: any) => u.email === email)
      if (authUser) {
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          password,
        })
      }
    } catch (error) {
      console.error('Error updating password in Supabase:', error)
      // Don't fail the whole request if password update fails
    }
  }

  return NextResponse.json({ success: true, user })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}