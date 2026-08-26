'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react'
import { useRole } from '@/hooks/use-role'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface Stats {
  revenue: number
  orders: number
  products: number
  users: number
  recentOrders: { id: string; total: number; status: string; createdAt: string }[]
  lowStock: { id: string; title: string; stock: number }[]
}

// Professional chart colors
const PIE_COLORS = ['#2563eb', '#7c3aed', '#059669']
const BAR_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']

export default function AdminDashboard() {
  const { role } = useRole()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          revenue: data.revenue ?? 0,
          orders: data.orders ?? 0,
          products: data.products ?? 0,
          users: data.users ?? 0,
          recentOrders: data.recentOrders ?? [],
          lowStock: data.lowStock ?? [],
        })
      })
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />
  if (!stats) return <div className="text-center py-12">Failed to load data</div>

  const recentOrders = stats.recentOrders || []
  const lowStock = stats.lowStock || []

  const orderStatusData = [
    { name: 'Pending', value: recentOrders.filter(o => o.status === 'PENDING').length },
    { name: 'Confirmed', value: recentOrders.filter(o => o.status === 'CONFIRMED').length },
    { name: 'Delivered', value: recentOrders.filter(o => o.status === 'DELIVERED').length },
  ]

  // Sample data for revenue chart (you can replace with actual data from API)
  const revenueData = [
    { name: 'Mon', revenue: 1200 },
    { name: 'Tue', revenue: 1800 },
    { name: 'Wed', revenue: 1500 },
    { name: 'Thu', revenue: 2100 },
    { name: 'Fri', revenue: 2400 },
    { name: 'Sat', revenue: 1800 },
    { name: 'Sun', revenue: 900 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {role === 'ADMIN' && 'Full admin overview'}
          {role === 'STAFF' && 'Order processing panel'}
          {role === 'RIDER' && 'Delivery assignments'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Revenue" value={`₱${stats.revenue.toFixed(2)}`} icon={DollarSign} trend="+12%" />
        <StatCard title="Orders" value={stats.orders} icon={ShoppingCart} trend="+5%" />
        <StatCard title="Products" value={stats.products} icon={Package} trend={lowStock.length > 0 ? 'Low stock!' : 'In stock'} />
        <StatCard title="Users" value={stats.users} icon={Users} trend="+3%" />
      </div>

      {/* Charts for Admin only */}
      {role === 'ADMIN' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={orderStatusData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    label
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]}>
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Orders (for all roles) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.slice(0, 5).map(order => (
                <div key={order.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <span className="font-medium">Order #{order.id.slice(-6)}</span>
                    <span className="text-sm text-muted-foreground ml-2">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">₱{order.total.toFixed(2)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
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

function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{trend}</p>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}