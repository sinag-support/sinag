import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserRole } from "@/lib/role";
import { createClient } from "@supabase/supabase-js";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const role = await getCurrentUserRole();
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, role: newRole, password } = body;

    // Get the current user to check old email
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If email is being changed, update in Supabase Auth first
    if (email && email !== currentUser.email) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

          const { data: authUsers, error: listError } =
            await supabaseAdmin.auth.admin.listUsers();

          if (!listError) {
            const authUser = authUsers.users.find(
              (u: any) =>
                u.email?.toLowerCase() === currentUser.email.toLowerCase(),
            );

            if (authUser) {
              const { error: updateError } =
                await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
                  email,
                });

              if (updateError) {
                console.error("Error updating auth email:", updateError);
                return NextResponse.json(
                  {
                    error:
                      "Failed to update email in authentication system: " +
                      updateError.message,
                  },
                  { status: 500 },
                );
              }

              console.log(
                "✅ Email updated in Supabase Auth:",
                currentUser.email,
                "→",
                email,
              );
            }
          }
        }
      } catch (authError) {
        console.error("Auth operation error:", authError);
        // Continue with Prisma update
      }
    }

    // Update user in Prisma
    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role: newRole,
      },
    });

    // If password is provided, update in Supabase Auth
    if (password) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

          const { data: authUsers, error: listError } =
            await supabaseAdmin.auth.admin.listUsers();

          if (!listError) {
            const authUser = authUsers.users.find(
              (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
            );

            if (authUser) {
              const { error: updateError } =
                await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
                  password,
                });
              if (updateError) {
                console.error("Error updating password:", updateError);
              } else {
                console.log("✅ Password updated for user:", email);
              }
            }
          }
        }
      } catch (authError) {
        console.error("Auth password update error:", authError);
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
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Get user first to get email
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Try to delete from Supabase Auth (if exists) - but DON'T fail if it doesn't
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
            } else {
              console.log("✅ Deleted user from Supabase Auth:", user.email);
            }
          } else {
            console.log(
              "⚠️ User not found in Supabase Auth (already deleted):",
              user.email,
            );
          }
        } else {
          console.error("Error listing auth users:", listError);
        }
      } else {
        console.log(
          "⚠️ Supabase admin credentials not available, skipping Auth deletion",
        );
      }
    } catch (authError) {
      console.error(
        "Auth operation error (continuing with Prisma deletion):",
        authError,
      );
      // ✅ Continue with Prisma deletion
    }

    // ✅ ALWAYS delete from Prisma - this is the main goal
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
