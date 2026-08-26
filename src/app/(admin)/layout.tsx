import AdminSidebar from '@/components/nav/admin-sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 md:p-6 pt-20 lg:pt-6">
        {children}
      </main>
    </div>
  )
}