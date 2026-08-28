import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'
import { createClient } from '@supabase/supabase-js'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // If password is provided, update (or create) user in Supabase Auth
    if (password) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Look up user in Auth by email (case-insensitive)
        const { data: authUsers, error: findError } = await supabaseAdmin.auth.admin.listUsers()
        if (findError) {
          return NextResponse.json(
            { error: 'Failed to list auth users' },
            { status: 500 }
          )
        }

        const authUser = authUsers.users.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        )

        if (!authUser) {
          // Create user in Auth if not exists (for manually seeded users)
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role: newRole },
          })

          if (createError) {
            console.error('Error creating auth user:', createError)
            return NextResponse.json(
              { error: 'Failed to create user in authentication system: ' + createError.message },
              { status: 500 }
            )
          }
          console.log('✅ Created new auth user for:', email)
        } else {
          // Update password for existing auth user
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            authUser.id,
            { password }
          )

          if (updateError) {
            console.error('Error updating password:', updateError)
            return NextResponse.json(
              { error: 'Failed to update password: ' + updateError.message },
              { status: 500 }
            )
          }
          console.log('✅ Password updated for user:', email)
        }
      } catch (authError) {
        console.error('Auth operation error:', authError)
        return NextResponse.json(
          { error: 'Failed to update authentication system' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = await getCurrentUserRole()
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}