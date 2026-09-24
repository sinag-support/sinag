import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import BlogPostClient from "./blog-post-client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await safeQuery(
    () =>
      prisma.blogPost.findUnique({
        where: {
          slug: slug,
          published: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          coverImage: true,
          createdAt: true,
          tags: true,
          author: true,
        },
      }),
    null,
  );

  if (!post) {
    notFound();
  }

  const postWithStringDate = {
    ...post,
    createdAt: post.createdAt.toISOString(),
  };

  return <BlogPostClient post={postWithStringDate} />;
}
