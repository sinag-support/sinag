import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function GET() {
  const role = await getCurrentUserRole()
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = role === 'ADMIN'

  const [revenueAgg, ordersCount, productsCount, usersCount, recentOrders, lowStock] = await Promise.all([
    prisma.order.aggregate({ _sum: { payable: true } }),
    prisma.order.count(),
    prisma.product.count({ where: { isAvailable: true } }),
    prisma.user.count(),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, total: true, status: true, createdAt: true, payable: true },
    }),
    isAdmin ? prisma.product.findMany({
      where: { stock: { lt: 10 }, isAvailable: true },
      select: { id: true, title: true, stock: true },
      take: 10,
    }) : Promise.resolve([]),
  ])

  return NextResponse.json({
    revenue: revenueAgg._sum.payable || 0,
    orders: ordersCount,
    products: productsCount,
    users: usersCount,
    recentOrders: recentOrders.map(o => ({
      ...o,
      total: o.payable || o.total,
    })),
    lowStock: lowStock || [], // ensure array
  })
}