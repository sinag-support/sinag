import AdminSidebar from '@/components/nav/admin-sidebar'

export default function AdminLayout({
   children,
}: {
   children: React.ReactNode
}) {
   return (
      <div className="flex min-h-screen">
         <AdminSidebar />
         <div className="flex-1">
            <main className="p-6">
               {children}
            </main>
         </div>
      </div>
   )
}