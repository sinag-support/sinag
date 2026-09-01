"use client";

import { UserManagement } from "@/components/admin/user-management";

export default function UsersPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
          User Management
        </h1>
      </div>
      <UserManagement />
    </div>
  );
}
