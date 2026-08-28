import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Check if like exists
  const like = await prisma.blogLike.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!like) {
    return NextResponse.json({ error: 'Like not found' }, { status: 404 })
  }

  // Delete the like
  await prisma.blogLike.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}