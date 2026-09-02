import AdminSidebar from "@/components/nav/admin-sidebar";
import { getCurrentUserRole } from "@/lib/role";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentUserRole();

  if (!role || role === "USER") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 p-4 md:p-6 pt-4 lg:pt-6 pb-24 lg:pb-6">
        {children}
      </main>
    </div>
  );
}
