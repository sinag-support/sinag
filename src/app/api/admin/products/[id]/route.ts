import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { title, description, price, discount, stock, isAvailable, categoryId, images } = body

  const product = await prisma.product.update({
    where: { id },
    data: {
      title,
      description,
      price: Number(price),
      discount: Number(discount || 0),
      stock: Number(stock || 0),
      isAvailable: isAvailable ?? true,
      categoryId: categoryId || null,
      images: images || [],
    },
  })

  return NextResponse.json(product)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}