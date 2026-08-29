import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET - Fetch user's orders
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const orders = await prisma.order.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: true,
              },
            },
          },
        },
        address: true,
        payments: true,
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new order
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

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const {
      address,
      city,
      province,
      postalCode,
      country,
      landmark,
      paymentMethod,
      shipping,
      vat,
      isBuyNow,
      items: buyNowItems,
    } = await request.json()

    if (!address || !city || !province || !postalCode) {
      return NextResponse.json({ error: 'Missing address fields' }, { status: 400 })
    }
    if (!paymentMethod || !['COD', 'GCASH'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    let subtotal = 0
    let totalDiscount = 0
    let orderItemsData = []
    let cartId = null

    // Handle Buy Now flow (does NOT clear cart)
    if (isBuyNow && buyNowItems && buyNowItems.length > 0) {
      // Process buy now items directly
      for (const item of buyNowItems) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            options: true,
          },
        })

        if (!product) {
          return NextResponse.json(
            { error: `Product not found` },
            { status: 404 }
          )
        }

        // Check if option exists and has stock
        let option = null
        let stock = product.stock
        let price = product.price

        if (item.optionId) {
          option = product.options.find((opt: any) => opt.id === item.optionId)
          if (!option) {
            return NextResponse.json(
            { error: `Option not found` },
            { status: 404 }
          )
          }
          stock = option.stock
          price = option.price
        }

        // Check stock
        if (stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.title}${option ? ` (${option.name})` : ''}` },
            { status: 400 }
          )
        }

        // Reduce stock
        if (option) {
          await prisma.productOption.update({
            where: { id: option.id },
            data: { stock: { decrement: item.quantity } },
          })
        } else {
          await prisma.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity } },
          })
        }

        const discount = product.discount || 0
        const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price

        subtotal += discountedPrice * item.quantity
        totalDiscount += (price - discountedPrice) * item.quantity

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: discountedPrice,
          discount: discount,
        })
      }

      // DO NOT clear cart for Buy Now
    } 
    // Handle regular cart checkout
    else {
      // Get the user's cart
      const cart = await prisma.cart.findUnique({
        where: { userId: dbUser.id },
        include: {
          items: {
            include: {
              product: true,
              option: true,
            },
          },
        },
      })

      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      }

      cartId = cart.id

      // Verify stock and compute totals
      for (const item of cart.items) {
        const product = item.product
        const option = item.option
        const quantity = item.quantity

        const basePrice = option ? option.price : product.price
        const discount = product.discount || 0
        const discountedPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice
        const stock = option ? option.stock : product.stock

        if (stock < quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.title}` },
            { status: 400 }
          )
        }

        // Reduce stock
        if (option) {
          await prisma.productOption.update({
            where: { id: option.id },
            data: { stock: { decrement: quantity } },
          })
        } else {
          await prisma.product.update({
            where: { id: product.id },
            data: { stock: { decrement: quantity } },
          })
        }

        subtotal += discountedPrice * quantity
        totalDiscount += (basePrice - discountedPrice) * quantity

        orderItemsData.push({
          productId: product.id,
          quantity,
          price: discountedPrice,
          discount: discount,
        })
      }
    }

    const total = subtotal + shipping + vat

    // Create address with landmark
    const addressRecord = await prisma.address.create({
      data: {
        userId: dbUser.id,
        address,
        city,
        province,
        postalCode,
        country: country || 'Philippines',
        landmark: landmark || null,
        isDefault: false,
      },
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: dbUser.id,
        status: 'PENDING',
        total: subtotal,
        shipping,
        tax: vat,
        discount: totalDiscount,
        payable: total,
        isPaid: false,
        addressId: addressRecord.id,
        items: {
          create: orderItemsData,
        },
        payments: {
          create: {
            amount: total,
            method: paymentMethod,
            status: 'PENDING',
          },
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: true,
              },
            },
          },
        },
        address: true,
        payments: true,
      },
    })

    // Only clear cart for regular checkout (not Buy Now)
    if (!isBuyNow && cartId) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cartId },
      })
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}