import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function GET() {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const banners = await prisma.banner.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(banners)
}

export async function POST(request: Request) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, image, link, order } = await request.json()
  if (!title || !image) return NextResponse.json({ error: 'Title and image required' }, { status: 400 })

  const banner = await prisma.banner.create({
    data: { title, image, link, order: order || 0 },
  })
  return NextResponse.json(banner, { status: 201 })
}