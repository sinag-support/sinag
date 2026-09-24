import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getUserId() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true },
    });

    return dbUser?.id || null;
  } catch (error) {
    console.error("Error in getUserId:", error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const userId = await getUserId();
    const { slug } = await params;

    const blogPost = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    const likeCount = await prisma.blogLike.count({
      where: { blogPostId: blogPost.id },
    });

    let userLiked = false;
    if (userId) {
      const like = await prisma.blogLike.findUnique({
        where: {
          userId_blogPostId: {
            userId,
            blogPostId: blogPost.id,
          },
        },
      });
      userLiked = !!like;
    }

    return NextResponse.json({
      likeCount,
      userLiked,
    });
  } catch (error) {
    console.error("GET like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const blogPost = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!blogPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    const existingLike = await prisma.blogLike.findUnique({
      where: {
        userId_blogPostId: {
          userId,
          blogPostId: blogPost.id,
        },
      },
    });

    if (existingLike) {
      await prisma.blogLike.delete({
        where: {
          userId_blogPostId: {
            userId,
            blogPostId: blogPost.id,
          },
        },
      });
      const likeCount = await prisma.blogLike.count({
        where: { blogPostId: blogPost.id },
      });
      return NextResponse.json({
        liked: false,
        likeCount,
      });
    } else {
      await prisma.blogLike.create({
        data: {
          userId,
          blogPostId: blogPost.id,
        },
      });
      const likeCount = await prisma.blogLike.count({
        where: { blogPostId: blogPost.id },
      });
      return NextResponse.json({
        liked: true,
        likeCount,
      });
    }
  } catch (error) {
    console.error("POST like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
