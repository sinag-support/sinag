import { connection } from "next/server";
import prisma from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { ProductGrid } from "@/components/home/product-grid";
import { BlogSection } from "@/components/home/blog-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function HomePage() {
  await connection();

  const dbBanners = await safeQuery(
    () =>
      prisma.banner.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          link: true,
        },
      }),
    [],
  );

  const banners = dbBanners.map((banner: any) => ({
    id: banner.id,
    image: banner.image,
    title: banner.title,
    description: banner.description || banner.title,
    link: banner.link || "/products",
  }));

  const fallbackBanners = [
    {
      id: "fallback-1",
      image:
        "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop",
      title: "Welcome to SINAG",
      description: "Your trusted source for quality products",
      link: "/products",
    },
    {
      id: "fallback-2",
      image:
        "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=400&fit=crop",
      title: "New Arrivals",
      description: "Discover our latest products",
      link: "/products?sort=newest",
    },
    {
      id: "fallback-3",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=400&fit=crop",
      title: "Free Shipping",
      description: "On orders over ₱1,000",
      link: "/products?shipping=free",
    },
  ];

  const finalBanners = banners.length > 0 ? banners : fallbackBanners;

  const dbProducts = await safeQuery(
    () =>
      prisma.product.findMany({
        where: { isAvailable: true },
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          price: true,
          discount: true,
          images: true,
          category: {
            select: { title: true },
          },
          reviews: {
            select: { rating: true },
          },
        },
      }),
    [],
  );

  const products = dbProducts.map((p: any) => {
    const reviews = p.reviews || [];
    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          reviewCount
        : 0;

    return {
      id: p.id,
      name: p.title,
      price: p.price,
      discount: p.discount || 0,
      image: p.images?.[0] || "",
      category: p.category?.title || "Uncategorized",
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount,
    };
  });

  const dbBlogPosts = await safeQuery(
    () =>
      prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          createdAt: true,
          tags: true,
          author: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
    [],
  );

  const blogPosts = dbBlogPosts.map((post: any) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt || "",
    image:
      post.coverImage ||
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop",
    date: post.createdAt.toISOString(),
    slug: post.slug,
    category: post.tags?.[0] || "Blog",
    readTime: "5 min read",
    likeCount: post._count.likes || 0,
    commentCount: post._count.comments || 0,
  }));

  return (
    <main className="min-h-screen pb-12 md:pb-0">
      <section className="w-full -mt-[1px]">
        <BannerCarousel banners={finalBanners} />
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold">Featured Products</h2>
          <Link href="/products">
            <Button variant="outline" size="sm">
              View All →
            </Button>
          </Link>
        </div>
        <ProductGrid products={products} limit={5} scrollable={true} />
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-t">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold">
            Latest from Our Blog
          </h2>
          <Link href="/blog">
            <Button variant="outline" size="sm">
              Read All →
            </Button>
          </Link>
        </div>
        <BlogSection posts={blogPosts} />
      </section>
    </main>
  );
}
