import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserRole } from "@/lib/role";
import { createClient } from "@supabase/supabase-js";

// ✅ Lazy initialize the admin client - only when needed
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const role = await getCurrentUserRole();
    if (role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { name, email, role: newRole, password } = body;

    // Update user in Prisma
    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role: newRole,
      },
    });

    // If password is provided, update user in Supabase Auth
    if (password) {
      try {
        // ✅ Initialize admin client only when needed
        const supabaseAdmin = getSupabaseAdmin();

        // Look up user in Auth by email (case-insensitive)
        const { data: authUsers, error: findError } =
          await supabaseAdmin.auth.admin.listUsers();
        if (findError) {
          return NextResponse.json(
            { error: "Failed to list auth users" },
            { status: 500 },
          );
        }

        const authUser = authUsers.users.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
        );

        if (!authUser) {
          // Create user in Auth if not exists
          const { data: newUser, error: createError } =
            await supabaseAdmin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: { name, role: newRole },
            });

          if (createError) {
            console.error("Error creating auth user:", createError);
            return NextResponse.json(
              {
                error:
                  "Failed to create user in authentication system: " +
                  createError.message,
              },
              { status: 500 },
            );
          }
          console.log("✅ Created new auth user for:", email);
        } else {
          // Update password for existing auth user
          const { error: updateError } =
            await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
              password,
            });

          if (updateError) {
            console.error("Error updating password:", updateError);
            return NextResponse.json(
              { error: "Failed to update password: " + updateError.message },
              { status: 500 },
            );
          }
          console.log("✅ Password updated for user:", email);
        }
      } catch (authError) {
        console.error("Auth operation error:", authError);
        // ✅ Return a more specific error
        return NextResponse.json(
          {
            error:
              "Failed to update authentication system. Please check your configuration.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const role = await getCurrentUserRole();
    if (role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    // Get user first to get email
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Delete from Supabase Auth (only if password was set)
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Find the user in Supabase Auth by email
      const { data: authUsers, error: listError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (!listError) {
        const authUser = authUsers.users.find(
          (u: any) => u.email?.toLowerCase() === user.email.toLowerCase(),
        );

        if (authUser) {
          const { error: deleteError } =
            await supabaseAdmin.auth.admin.deleteUser(authUser.id);
          if (deleteError) {
            console.error("Error deleting auth user:", deleteError);
            // Continue with Prisma deletion even if auth deletion fails
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

    // Delete from Prisma
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
