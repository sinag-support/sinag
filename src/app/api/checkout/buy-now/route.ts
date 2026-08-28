import { NextResponse } from 'next/server';
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

// POST - Create a buy now session (does NOT modify the cart)
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, quantity, optionId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      );
    }

    // Verify the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        options: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get the selected option details if provided
    let selectedOption = null;
    if (optionId) {
      selectedOption = product.options.find((opt: any) => opt.id === optionId);
      if (!selectedOption) {
        return NextResponse.json(
          { error: 'Option not found' },
          { status: 404 }
        );
      }
    }

    // Return the product details for immediate checkout
    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        discount: product.discount,
        images: product.images,
        stock: product.stock,
      },
      option: selectedOption ? {
        id: selectedOption.id,
        name: selectedOption.name,
        price: selectedOption.price,
        stock: selectedOption.stock,
      } : null,
      quantity: quantity || 1,
    });
  } catch (error) {
    console.error('POST /api/checkout/buy-now error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}