import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function GET(request: NextRequest) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}
  
  // Search filter
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Category filter
  if (categoryId && categoryId !== 'all') {
    where.categoryId = categoryId
  }

  // Get total count for pagination
  const total = await prisma.product.count({ where })

  // Get products with pagination
  const products = await prisma.product.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          title: true,
        },
      },
      options: true,
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  })

  return NextResponse.json({
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(request: NextRequest) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, description, price, discount, stock, isAvailable, categoryId, images, options } = body

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
      options: {
        create: options || [],
      },
    },
    include: {
      category: true,
      options: true,
    },
  })

  return NextResponse.json(product, { status: 201 })
}