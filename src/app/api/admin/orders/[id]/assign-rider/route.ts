import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
  }

  const { id } = await params
  const { riderId } = await request.json()

  if (!riderId) {
    return NextResponse.json({ error: 'Rider ID is required' }, { status: 400 })
  }

  // Check if rider exists and has RIDER role
  const rider = await prisma.user.findUnique({
    where: { id: riderId },
    select: { id: true, role: true, name: true, email: true },
  })

  if (!rider) {
    return NextResponse.json({ error: 'Rider not found' }, { status: 404 })
  }

  if (rider.role !== 'RIDER') {
    return NextResponse.json({ error: 'User is not a rider' }, { status: 400 })
  }

  // Update the order with rider assignment
  const order = await prisma.order.update({
    where: { id },
    data: { 
      riderId: riderId,
      status: 'ASSIGNED_RIDER'
    },
    include: {
      user: { select: { name: true, email: true } },
      rider: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({
    success: true,
    order,
    message: `Order assigned to ${rider.name || rider.email}`
  })
}