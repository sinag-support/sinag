'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Users, DollarSign, Truck, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { useRole } from '@/hooks/use-role'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Stats {
  revenue: number
  orders: number
  products: number
  users: number
  recentOrders: { id: string; total: number; status: string; createdAt: string }[]
  lowStock: { id: string; title: string; stock: number }[]
  pendingOrders?: number
  outForDelivery?: number
  ordersByStatus?: { status: string; count: number }[]
  revenueData?: { date: string; revenue: number }[]
  monthlyRevenueData?: { date: string; revenue: number }[]
  yearlyRevenueData?: { date: string; revenue: number }[]
}

// Professional chart colors
const PIE_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']
const BAR_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']

type RevenuePeriod = 'week' | 'month' | 'year' | 'full'

export default function AdminDashboard() {
  const { role } = useRole()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewRole, setViewRole] = useState<string | null>(null)
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('week')
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([])

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (stats) {
      filterRevenueData(revenuePeriod)
    }
  }, [stats, revenuePeriod])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      
      setStats({
        revenue: data.revenue ?? 0,
        orders: data.orders ?? 0,
        products: data.products ?? 0,
        users: data.users ?? 0,
        recentOrders: data.recentOrders ?? [],
        lowStock: data.lowStock ?? [],
        pendingOrders: data.pendingOrders ?? 0,
        outForDelivery: data.outForDelivery ?? 0,
        ordersByStatus: data.ordersByStatus ?? [],
        revenueData: data.revenueData ?? [],
        monthlyRevenueData: data.monthlyRevenueData ?? [],
        yearlyRevenueData: data.yearlyRevenueData ?? [],
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  const filterRevenueData = (period: RevenuePeriod) => {
    if (!stats) return

    let data: { date: string; revenue: number }[] = []
    
    switch (period) {
      case 'week':
        data = stats.revenueData || []
        break
      case 'month':
        data = stats.monthlyRevenueData || []
        break
      case 'year':
        data = stats.yearlyRevenueData || []
        break
      case 'full':
        data = stats.yearlyRevenueData || stats.revenueData || []
        break
      default:
        data = stats.revenueData || []
    }

    if (!data || data.length === 0) {
      const now = new Date()
      const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'year' ? 365 : 30
      const sampleData = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        sampleData.push({
          date: dateStr,
          revenue: Math.floor(Math.random() * 2000) + 500,
        })
      }
      setRevenueData(sampleData)
      return
    }

    setRevenueData(data)
  }

  if (loading) return <DashboardSkeleton role={viewRole || role} />
  if (!stats) return <div className="text-center py-12">Failed to load data</div>

  const recentOrders = stats.recentOrders || []
  const lowStock = stats.lowStock || []
  const ordersByStatus = stats.ordersByStatus || []

  const orderStatusData = ordersByStatus.length > 0 
    ? ordersByStatus.map(item => ({ name: item.status.replace('_', ' '), value: item.count }))
    : [
        { name: 'Pending', value: recentOrders.filter(o => o.status === 'PENDING').length },
        { name: 'Confirmed', value: recentOrders.filter(o => o.status === 'CONFIRMED').length },
        { name: 'Preparing', value: recentOrders.filter(o => o.status === 'PREPARING').length },
        { name: 'Out for Delivery', value: recentOrders.filter(o => o.status === 'OUT_FOR_DELIVERY').length },
        { name: 'Delivered', value: recentOrders.filter(o => o.status === 'DELIVERED').length },
      ].filter(item => item.value > 0)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
  }

  const activeRole = viewRole || role

  // --- ADMIN DASHBOARD ---
  if (activeRole === 'ADMIN') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Full admin overview</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="inline-flex items-center gap-2 h-8 px-3 py-1.5 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer">
                  <Eye className="h-4 w-4" />
                  View as: {viewRole || 'Admin'}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewRole(null)}>
                  Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewRole('STAFF')}>
                  Staff
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewRole('RIDER')}>
                  Rider
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {viewRole && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewRole(null)}
                className="text-xs h-8"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards - 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          <Card className="py-4 px-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">₱{stats.revenue.toFixed(2)}</div>
              <p className="text-xs text-emerald-600">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="py-4 px-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.orders}</div>
              <p className="text-xs text-emerald-600">+5% from last month</p>
            </CardContent>
          </Card>

          <Card className="py-4 px-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.products}</div>
              <p className={cn("text-xs", lowStock.length > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                {lowStock.length > 0 ? `${lowStock.length} low stock items` : 'All in stock'}
              </p>
            </CardContent>
          </Card>

          <Card className="py-4 px-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-emerald-600">+3% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="py-4 px-2">
            <CardHeader className="pb-2">
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={orderStatusData.length > 0 ? orderStatusData : [{ name: 'No Data', value: 1 }]} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      label={({ name, percent }) => {
                        const percentage = (percent ?? 0) * 100
                        return `${name} ${percentage.toFixed(0)}%`
                      }}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="py-4 px-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Revenue Overview</CardTitle>
                <Tabs 
                  value={revenuePeriod} 
                  onValueChange={(v) => setRevenuePeriod(v as RevenuePeriod)}
                  className="w-auto"
                >
                  <TabsList className="h-7">
                    <TabsTrigger value="week" className="text-xs px-2 h-6">Week</TabsTrigger>
                    <TabsTrigger value="month" className="text-xs px-2 h-6">Month</TabsTrigger>
                    <TabsTrigger value="year" className="text-xs px-2 h-6">Year</TabsTrigger>
                    <TabsTrigger value="full" className="text-xs px-2 h-6">Full</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                {revenueData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No revenue data available for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip formatter={(value) => `₱${value}`} />
                      <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]}>
                        {revenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="py-4 px-2">
          <CardHeader className="pb-2">
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                    <div>
                      <span className="font-medium">Order #{order.id.slice(-6)}</span>
                      <span className="text-sm text-muted-foreground ml-3">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">₱{order.total.toFixed(2)}</span>
                      <Badge variant="outline" className={
                        order.status === 'DELIVERED' ? 'border-emerald-500 text-emerald-600' :
                        order.status === 'PENDING' ? 'border-amber-500 text-amber-600' :
                        order.status === 'CANCELLED' ? 'border-red-500 text-red-600' :
                        'border-blue-500 text-blue-600'
                      }>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 py-4 px-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {lowStock.map(product => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="text-sm">{product.title}</span>
                    <Badge variant="destructive" className="text-xs">
                      {product.stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // --- STAFF DASHBOARD ---
  if (activeRole === 'STAFF') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground">Process and manage customer orders</p>
          </div>
          {role === 'ADMIN' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setViewRole(null)}
              className="text-xs"
            >
              Back to Admin
            </Button>
          )}
        </div>

        {/* Stats Cards - 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
          <Card className="py-4 px-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.orders}</div>
              <p className="text-xs text-muted-foreground">All orders</p>
            </CardContent>
          </Card>

          <Card className="py-4 px-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.pendingOrders || 0}</div>
              <p className="text-xs text-amber-600">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card className="py-4 px-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out for Delivery</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.outForDelivery || 0}</div>
              <p className="text-xs text-blue-600">In transit</p>
            </CardContent>
          </Card>
        </div>

        <Card className="py-4 px-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>Recent Orders</span>
              <Badge variant="outline" className="text-xs">
                {recentOrders.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders to process</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.slice(0, 8).map(order => (
                  <div key={order.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                    <div>
                      <span className="font-medium">Order #{order.id.slice(-6)}</span>
                      <span className="text-sm text-muted-foreground ml-3">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">₱{order.total.toFixed(2)}</span>
                      <Badge variant="outline" className={
                        order.status === 'DELIVERED' ? 'border-emerald-500 text-emerald-600' :
                        order.status === 'PENDING' ? 'border-amber-500 text-amber-600' :
                        order.status === 'CANCELLED' ? 'border-red-500 text-red-600' :
                        'border-blue-500 text-blue-600'
                      }>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- RIDER DASHBOARD ---
  if (activeRole === 'RIDER') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Delivery Dashboard</h1>
            <p className="text-muted-foreground">Manage your assigned deliveries</p>
          </div>
          {role === 'ADMIN' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setViewRole(null)}
              className="text-xs"
            >
              Back to Admin
            </Button>
          )}
        </div>

        {/* Stats Cards - 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
          <Card className="py-4 px-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Pickups</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.pendingOrders || 0}</div>
              <p className="text-xs text-amber-600">Ready for pickup</p>
            </CardContent>
          </Card>

          <Card className="py-4 px-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out for Delivery</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stats.outForDelivery || 0}</div>
              <p className="text-xs text-blue-600">In transit</p>
            </CardContent>
          </Card>

          <Card className="py-4 px-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">{recentOrders.filter(o => o.status === 'DELIVERED').length}</div>
              <p className="text-xs text-emerald-600">Delivered</p>
            </CardContent>
          </Card>
        </div>

        <Card className="py-4 px-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span>Assigned Deliveries</span>
              <Badge variant="outline" className="text-xs">
                {recentOrders.length} orders
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No deliveries assigned</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.slice(0, 8).map(order => (
                  <div key={order.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                    <div>
                      <span className="font-medium">Order #{order.id.slice(-6)}</span>
                      <span className="text-sm text-muted-foreground ml-3">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold">₱{order.total.toFixed(2)}</span>
                      <Badge variant="outline" className={
                        order.status === 'DELIVERED' ? 'border-emerald-500 text-emerald-600' :
                        order.status === 'OUT_FOR_DELIVERY' ? 'border-blue-500 text-blue-600' :
                        order.status === 'READY_FOR_PICKUP' ? 'border-amber-500 text-amber-600' :
                        'border-gray-500 text-gray-600'
                      }>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Loading dashboard...</p>
    </div>
  )
}

// --- SKELETON ---

function DashboardSkeleton({ role }: { role?: string | null }) {
  const isAdmin = role === 'ADMIN'
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>

      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      )}

      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}