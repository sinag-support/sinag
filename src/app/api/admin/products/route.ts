import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function GET(request: Request) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    },
    include: {
      category: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, description, price, discount, stock, isAvailable, categoryId, images } = body

  if (!title || price == null) {
    return NextResponse.json({ error: 'Title and price required' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      title,
      description,
      price: Number(price),
      discount: Number(discount || 0),
      stock: Number(stock || 0),
      isAvailable: isAvailable ?? true,
      categoryId: categoryId || undefined,
      images: images || [],
    },
  })

  return NextResponse.json(product, { status: 201 })
}