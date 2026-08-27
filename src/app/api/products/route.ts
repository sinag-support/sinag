import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const where: any = {
      isAvailable: true,
    }

    if (category) {
      where.category = {
        title: category,
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          options: true,
          reviews: {
            select: { rating: true }, // only fetch ratings for aggregation
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    // Transform products to include computed rating and reviewCount
    const productsWithRating = products.map((product) => {
      const reviews = product.reviews || []
      const reviewCount = reviews.length
      const averageRating = reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0

      // Remove the raw reviews array from the response
      const { reviews: _, ...productWithoutReviews } = product

      return {
        ...productWithoutReviews,
        rating: parseFloat(averageRating.toFixed(1)),
        reviewCount,
      }
    })

    return NextResponse.json({
      products: productsWithRating,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}