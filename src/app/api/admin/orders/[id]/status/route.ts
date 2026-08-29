import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentUserRole()
  if (!role || role === 'USER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { status } = await request.json()

  // Role-based permission checks
  if (role === 'STAFF') {
    // Staff can only move forward in certain steps
    const current = await prisma.order.findUnique({ where: { id }, select: { status: true } })
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const allowedNext: Record<string, string[]> = {
      PENDING: ['CONFIRMED'],
      CONFIRMED: ['PREPARING'],
      PREPARING: ['PACKED'],
      PACKED: ['READY_FOR_PICKUP'],
    }
    if (!allowedNext[current.status]?.includes(status)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 403 })
    }
  }

  if (role === 'RIDER') {
    // Rider can only update to OUT_FOR_DELIVERY or DELIVERED from specific statuses
    const current = await prisma.order.findUnique({ where: { id }, select: { status: true } })
    if (!current) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (current.status === 'ASSIGNED_RIDER' && status !== 'OUT_FOR_DELIVERY') {
      return NextResponse.json({ error: 'Only can start delivery' }, { status: 403 })
    }
    if (current.status === 'OUT_FOR_DELIVERY' && status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Only can mark delivered' }, { status: 403 })
    }
    if (!['ASSIGNED_RIDER', 'OUT_FOR_DELIVERY'].includes(current.status)) {
      return NextResponse.json({ error: 'Cannot update this order' }, { status: 403 })
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      user: { select: { name: true, email: true } },
      rider: { select: { id: true, name: true, email: true } },
      address: true, // ✅ Include address with landmark in response
    },
  })

  return NextResponse.json(order)
}