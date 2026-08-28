import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUserId() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true },
    })
    
    return dbUser?.id || null
  } catch (error) {
    console.error('Error in getUserId:', error)
    return null
  }
}

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    // Get total revenue from completed orders (DELIVERED)
    const revenueResult = await prisma.order.aggregate({
      where: { 
        status: 'DELIVERED',
        isPaid: true,
      },
      _sum: {
        payable: true,
      },
    })

    // Get total orders count
    const ordersCount = await prisma.order.count()

    // Get total products
    const productsCount = await prisma.product.count()

    // Get total users
    const usersCount = await prisma.user.count()

    // Get recent orders (limit 10)
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        payable: true,
        status: true,
        createdAt: true,
      },
    })

    // Get low stock products (stock < 5)
    const lowStock = await prisma.product.findMany({
      where: {
        stock: {
          lt: 5,
        },
        isAvailable: true,
      },
      select: {
        id: true,
        title: true,
        stock: true,
      },
      orderBy: { stock: 'asc' },
    })

    // Get orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    })

    // Get pending orders count
    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING' },
    })

    // Get out for delivery count
    const outForDelivery = await prisma.order.count({
      where: { status: 'OUT_FOR_DELIVERY' },
    })

    // --- REVENUE DATA FOR GRAPH (Last 7 days, grouped by date) ---
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get all delivered orders from the last 7 days
    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        isPaid: true,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        payable: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date and sum revenue
    const revenueMap = new Map<string, number>()
    
    // Initialize all 7 days with 0
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      revenueMap.set(dateStr, 0)
    }

    // Add revenue from delivered orders
    deliveredOrders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0]
      const current = revenueMap.get(dateStr) || 0
      revenueMap.set(dateStr, current + order.payable)
    })

    // Convert to array sorted by date
    const revenueData = Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // --- ADDITIONAL: Monthly revenue data for "full" view ---
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const monthlyOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        isPaid: true,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        payable: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const monthlyRevenueMap = new Map<string, number>()
    
    // Initialize all 30 days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      monthlyRevenueMap.set(dateStr, 0)
    }

    monthlyOrders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0]
      const current = monthlyRevenueMap.get(dateStr) || 0
      monthlyRevenueMap.set(dateStr, current + order.payable)
    })

    const monthlyRevenueData = Array.from(monthlyRevenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // --- YEARLY REVENUE DATA ---
    const yearAgo = new Date()
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)

    const yearlyOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        isPaid: true,
        createdAt: {
          gte: yearAgo,
        },
      },
      select: {
        payable: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const yearlyRevenueMap = new Map<string, number>()
    
    // Group by month
    yearlyOrders.forEach(order => {
      const date = order.createdAt
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const current = yearlyRevenueMap.get(monthKey) || 0
      yearlyRevenueMap.set(monthKey, current + order.payable)
    })

    const yearlyRevenueData = Array.from(yearlyRevenueMap.entries())
      .map(([month, revenue]) => {
        const [year, monthNum] = month.split('-')
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        return { 
          date: date.toISOString().split('T')[0],
          revenue 
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      revenue: revenueResult._sum.payable || 0,
      orders: ordersCount,
      products: productsCount,
      users: usersCount,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        total: o.payable || o.total,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      lowStock,
      pendingOrders,
      outForDelivery,
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count,
      })),
      // Revenue data for different time periods
      revenueData: revenueData, // Last 7 days (for week view)
      monthlyRevenueData: monthlyRevenueData, // Last 30 days (for month view)
      yearlyRevenueData: yearlyRevenueData, // Last 12 months (for year view)
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}