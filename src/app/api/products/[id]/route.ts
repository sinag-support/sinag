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
         },
      })

      if (!product) {
         return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
         )
      }

      return NextResponse.json(product)
   } catch (error) {
      console.error('Error fetching product:', error)
      return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
      )
   }
}