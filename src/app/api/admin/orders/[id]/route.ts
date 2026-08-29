import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentUserRole()
  if (!role || role === 'USER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      address: true,
      items: {
        include: {
          product: {
            select: {
              title: true,
              price: true,
              images: true,
            },
          },
          option: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },
      payments: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json(order)
}