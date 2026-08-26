import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function GET(request: Request) {
  const role = await getCurrentUserRole()
  if (!role || role === 'USER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || undefined

  const where: any = {}
  if (status) {
    // Handle multiple statuses (comma-separated)
    const statuses = status.split(',').filter(Boolean)
    if (statuses.length > 0) {
      where.status = { in: statuses }
    }
  }
  if (search) {
    const num = parseInt(search)
    const conditions = []
    if (!isNaN(num)) {
      conditions.push({ orderNumber: num })
    }
    conditions.push(
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    )
    where.OR = conditions
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      address: true,
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              images: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}