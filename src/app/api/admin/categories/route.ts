import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function GET() {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const categories = await prisma.category.findMany({
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
      },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}