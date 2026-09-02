import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserRole } from "@/lib/role";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = await getCurrentUserRole();
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = await getCurrentUserRole();
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { title, slug, excerpt, content, coverImage, author, published, tags } =
    body;

  if (!title || !slug || !content) {
    return NextResponse.json(
      { error: "Title, slug, and content are required" },
      { status: 400 },
    );
  }

  // Check if slug already exists (excluding current post)
  const existing = await prisma.blogPost.findFirst({
    where: {
      slug,
      id: { not: id },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Slug already exists. Please choose a different one." },
      { status: 400 },
    );
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      coverImage: coverImage || null,
      author: author || "SINAG Editorial",
      published: published ?? true,
      tags: tags || [],
    },
  });

  return NextResponse.json({ success: true, post });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = await getCurrentUserRole();
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Delete all comments and likes first (cascade should handle this, but just in case)
  await prisma.blogComment.deleteMany({
    where: { blogPostId: id },
  });

  await prisma.blogLike.deleteMany({
    where: { blogPostId: id },
  });

  await prisma.blogPost.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
