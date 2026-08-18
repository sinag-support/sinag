import { UserManagement } from '@/components/admin/user-management'

export default function UsersPage() {
   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
               Manage staff and rider accounts
            </p>
         </div>
         <UserManagement />
      </div>
   )
}