import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getUserId() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true },
    });
    
    return dbUser?.id || null;
  } catch (error) {
    console.error('Error in getUserId:', error);
    return null;
  }
}

// DELETE - Remove a wishlist item by its ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: wishlistItemId } = await params; // ✅ Await params
    
    // Verify the item belongs to the user
    const item = await prisma.wishlistItem.findUnique({
      where: { id: wishlistItemId },
      select: { userId: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Wishlist item not found' },
        { status: 404 }
      );
    }

    if (item.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.wishlistItem.delete({
      where: { id: wishlistItemId },
    });

    return NextResponse.json({
      removed: true,
      message: 'Removed from wishlist',
    });
  } catch (error) {
    console.error('DELETE /api/wishlist/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}