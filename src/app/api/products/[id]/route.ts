import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        options: true,
        reviews: {
          select: { rating: true }, // only fetch ratings for performance
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Compute rating and review count
    const reviews = product.reviews || []
    const reviewCount = reviews.length
    const averageRating = reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0

    // Remove the raw reviews array from the response (optional)
    const { reviews: _, ...productWithoutReviews } = product

    return NextResponse.json({
      ...productWithoutReviews,
      rating: parseFloat(averageRating.toFixed(1)), // one decimal place
      reviewCount,
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}