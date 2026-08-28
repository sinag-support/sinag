import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserRole } from '@/lib/role'

export async function GET(request: NextRequest) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: any = {}
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ]
  }

  const total = await prisma.blogPost.count({ where })

  const posts = await prisma.blogPost.findMany({
    where,
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  })

  return NextResponse.json({
    posts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(request: NextRequest) {
  const role = await getCurrentUserRole()
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { title, slug, excerpt, content, coverImage, author, published, tags } = body

  if (!title || !slug || !content) {
    return NextResponse.json(
      { error: 'Title, slug, and content are required' },
      { status: 400 }
    )
  }

  // Check if slug already exists
  const existing = await prisma.blogPost.findUnique({
    where: { slug },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'Slug already exists. Please choose a different one.' },
      { status: 400 }
    )
  }

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      coverImage: coverImage || null,
      author: author || 'SINAG Editorial',
      published: published ?? true,
      tags: tags || [],
    },
  })

  return NextResponse.json({ success: true, post }, { status: 201 })
}