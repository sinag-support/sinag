import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, quantity, optionId } = await request.json()

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid product or quantity' }, { status: 400 })
    }

    // Find or create Prisma user
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true }
    })
    if (!dbUser) {
      const newUser = await prisma.user.create({
        data: {
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split('@')[0],
          role: 'USER',
        },
      })
      dbUser = { id: newUser.id }
    }

    const userId = dbUser.id

    // Get product and validate stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { options: true }
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // If optionId is provided, verify it and check its stock
    let selectedOption = null
    if (optionId) {
      selectedOption = product.options.find(opt => opt.id === optionId)
      if (!selectedOption) {
        return NextResponse.json({ error: 'Invalid option' }, { status: 400 })
      }
      if (selectedOption.stock < quantity) {
        return NextResponse.json({ error: 'Not enough stock for this option' }, { status: 400 })
      }
    } else {
      // Base product stock
      if (product.stock < quantity) {
        return NextResponse.json({ error: 'Not enough stock' }, { status: 400 })
      }
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    })
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      })
    }

    // Find existing cart item with same product and option (or null option)
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        optionId: optionId || null,
      },
    })

    let cartItem
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: quantity } },
      })
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          optionId: optionId || null,
          quantity,
        },
      })
    }

    return NextResponse.json({ success: true, cartItem })
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true },
    })
    if (!dbUser) {
      return NextResponse.json({ items: [] })
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                discount: true,
                images: true,
              },
            },
            option: true, // include option details
          },
        },
      },
    })

    return NextResponse.json(cart || { items: [] })
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}