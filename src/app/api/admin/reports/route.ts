import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function GET(request: Request) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '30d'

  // Calculate date range
  const now = new Date()
  let startDate = new Date()
  switch (range) {
    case '7d': startDate.setDate(now.getDate() - 7); break
    case '30d': startDate.setDate(now.getDate() - 30); break
    case '90d': startDate.setDate(now.getDate() - 90); break
    case '12m': startDate.setMonth(now.getMonth() - 12); break
    default: startDate.setDate(now.getDate() - 30)
  }

  // Get all orders in date range
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
      status: { not: 'CANCELLED' },
    },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: {
            select: {
              title: true,
              categoryId: true,
              category: { select: { title: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Calculate revenue and orders
  const totalRevenue = orders.reduce((sum, o) => sum + o.payable, 0)
  const totalOrders = orders.length

  // Daily revenue data
  const dailyRevenue: Record<string, { revenue: number; orders: number }> = {}
  orders.forEach((order) => {
    const date = order.createdAt.toISOString().split('T')[0]
    if (!dailyRevenue[date]) dailyRevenue[date] = { revenue: 0, orders: 0 }
    dailyRevenue[date].revenue += order.payable
    dailyRevenue[date].orders += 1
  })

  const dailyRevenueData = Object.entries(dailyRevenue).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    orders: data.orders,
  }))

  // Category sales distribution
  const categorySales: Record<string, number> = {}
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const categoryName = item.product.category?.title || 'Uncategorized'
      if (!categorySales[categoryName]) categorySales[categoryName] = 0
      categorySales[categoryName] += item.quantity * item.price
    })
  })

  const categorySalesData = Object.entries(categorySales)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Status distribution
  const statusDistribution = await prisma.order.groupBy({
    by: ['status'],
    _count: { status: true },
    where: { createdAt: { gte: startDate } },
  })

  const statusData = statusDistribution.map((s) => ({
    name: s.status.replace('_', ' '),
    value: s._count.status,
  }))

  // Top products
  const productSales: Record<string, { name: string; sales: number; revenue: number }> = {}
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const productId = item.productId
      if (!productSales[productId]) {
        productSales[productId] = {
          name: item.product.title,
          sales: 0,
          revenue: 0,
        }
      }
      productSales[productId].sales += item.quantity
      productSales[productId].revenue += item.quantity * item.price
    })
  })

  const topProductsData = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Calculate growth (compare to previous period)
  const previousStart = new Date(startDate)
  previousStart.setDate(previousStart.getDate() - parseInt(range.replace('d', '')))
  const previousOrders = await prisma.order.aggregate({
    _sum: { payable: true },
    _count: true,
    where: {
      createdAt: {
        gte: previousStart,
        lt: startDate,
      },
      status: { not: 'CANCELLED' },
    },
  })

  const previousRevenue = previousOrders._sum.payable || 0
  const previousCount = previousOrders._count || 0
  const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
  const ordersGrowth = previousCount > 0 ? ((totalOrders - previousCount) / previousCount) * 100 : 0

  return NextResponse.json({
    revenue: totalRevenue,
    orders: totalOrders,
    products: await prisma.product.count(),
    users: await prisma.user.count(),
    revenueGrowth: Math.round(revenueGrowth * 100) / 100,
    ordersGrowth: Math.round(ordersGrowth * 100) / 100,
    dailyRevenue: dailyRevenueData,
    categorySales: categorySalesData,
    statusDistribution: statusData,
    topProducts: topProductsData,
  })
}