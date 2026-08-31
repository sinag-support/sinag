import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserRole } from "@/lib/role";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const role = await getCurrentUserRole();
    if (role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    // ✅ Get user first to get email
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Delete from Supabase Auth first
    try {
      // Find the user in Supabase Auth by email
      const {
        data: { users },
        error: listError,
      } = await supabaseAdmin.auth.admin.listUsers();

      if (!listError) {
        const authUser = users.find(
          (u: any) => u.email?.toLowerCase() === user.email.toLowerCase(),
        );

        if (authUser) {
          const { error: deleteError } =
            await supabaseAdmin.auth.admin.deleteUser(authUser.id);
          if (deleteError) {
            console.error("Error deleting auth user:", deleteError);
          } else {
            console.log("✅ Deleted user from Supabase Auth:", user.email);
          }
        } else {
          console.log("⚠️ User not found in Supabase Auth:", user.email);
        }
      } else {
        console.error("Error listing auth users:", listError);
      }
    } catch (authError) {
      console.error("Auth operation error:", authError);
      // Continue with Prisma deletion even if auth deletion fails
    }

    // ✅ Delete from Prisma
    await prisma.user.delete({ where: { id } });
    console.log("✅ Deleted user from Prisma:", user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
