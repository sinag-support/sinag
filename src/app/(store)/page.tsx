import { connection } from 'next/server'
import prisma from '@/lib/prisma'
import { safeQuery } from '@/lib/safe-query'
import { BannerCarousel } from '@/components/home/banner-carousel'
import { ProductGrid } from '@/components/home/product-grid'
import { BlogSection } from '@/components/home/blog-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Truck, Shield, CreditCard, Headphones, Zap, Clock, Tag } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function HomePage() {
  await connection()

  // Fetch banners (unchanged)
  const dbBanners = await safeQuery(
    () =>
      prisma.banner.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
        select: { id: true, title: true, description: true, image: true, link: true },
      }),
    []
  )

  const banners = dbBanners.map((banner: any) => ({
    id: banner.id,
    image: banner.image,
    title: banner.title,
    description: banner.description || banner.title,
    link: banner.link || '/products',
  }))

  const fallbackBanners = [
    {
      id: 'fallback-1',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop',
      title: 'Welcome to SINAG',
      description: 'Your trusted source for quality products',
      link: '/products',
    },
    {
      id: 'fallback-2',
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=400&fit=crop',
      title: 'New Arrivals',
      description: 'Discover our latest products',
      link: '/products?sort=newest',
    },
    {
      id: 'fallback-3',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=400&fit=crop',
      title: 'Free Shipping',
      description: 'On orders over ₱1,000',
      link: '/products?shipping=free',
    },
  ]

  const finalBanners = banners.length > 0 ? banners : fallbackBanners

  // Fetch products WITH reviews
  const dbProducts = await safeQuery(
    () =>
      prisma.product.findMany({
        where: { isAvailable: true },
        take: 8,
        orderBy: { createdAt: 'desc' },
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
    []
  )

  // Compute rating and review count, map to the expected shape
  const products = dbProducts.map((p: any) => {
    const reviews = p.reviews || []
    const reviewCount = reviews.length
    const avgRating = reviewCount > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
      : 0

    return {
      id: p.id,
      name: p.title,
      price: p.price,
      discount: p.discount || 0,
      image: p.images?.[0] || '',
      category: p.category?.title || 'Uncategorized',
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount,
    }
  })

  // Get products with discounts for flash sales (minimum 5% discount)
  const flashSaleProducts = products
    .filter(p => p.discount >= 5)
    .sort((a, b) => b.discount - a.discount) // Sort by highest discount
    .slice(0, 4)

  // If no discounted products, get some products to show as "Deals" (with random discounts for display)
  let displayFlashProducts = flashSaleProducts
  if (displayFlashProducts.length === 0 && products.length > 0) {
    // Show some products as "deals" with simulated discounts for demo
    displayFlashProducts = products.slice(0, 4).map((p, index) => ({
      ...p,
      discount: [15, 20, 10, 25][index % 4] || 10 // Simulate discounts
    }))
  }

  // Fetch blog posts with likes and comments count
  const dbBlogPosts = await safeQuery(
    () =>
      prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
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
    []
  )

  const blogPosts = dbBlogPosts.map((post: any) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt || '',
    image: post.coverImage || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop',
    date: post.createdAt.toISOString(),
    slug: post.slug,
    category: post.tags?.[0] || 'Blog',
    readTime: '5 min read',
    likeCount: post._count.likes || 0,
    commentCount: post._count.comments || 0,
  }))

  return (
    <main className="min-h-screen pb-12 md:pb-0">
      {/* Banner Carousel */}
      <section className="w-full -mt-[1px]">
        <BannerCarousel banners={finalBanners} />
      </section>

      {/* Why Choose Us - Features Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 border-b">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { 
              icon: Truck, 
              title: 'Free Shipping', 
              desc: 'On orders over ₱1,000',
              color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
            },
            { 
              icon: Shield, 
              title: 'Secure Payment', 
              desc: '100% safe checkout',
              color: 'text-green-500 bg-green-50 dark:bg-green-950/30'
            },
            { 
              icon: CreditCard, 
              title: 'Easy Returns', 
              desc: '30-day return policy',
              color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30'
            },
            { 
              icon: Headphones, 
              title: '24/7 Support', 
              desc: 'We\'re here to help',
              color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30'
            },
          ].map((feature, i) => (
            <div 
              key={i} 
              className="text-center p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:shadow-md group"
            >
              <div className={`w-12 h-12 mx-auto rounded-full ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Sales / Deals Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 border-b">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-red-500" />
                <h2 className="text-xl sm:text-2xl font-bold">Flash Sale</h2>
              </div>
              <p className="text-sm text-muted-foreground">Limited time offers - Grab them before they're gone!</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-muted-foreground">Ends in:</span>
              <div className="flex items-center gap-1">
                <div className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold min-w-[32px] text-center">
                  02
                </div>
                <span className="text-red-500 font-bold">:</span>
                <div className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold min-w-[32px] text-center">
                  14
                </div>
                <span className="text-red-500 font-bold">:</span>
                <div className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold min-w-[32px] text-center">
                  45
                </div>
              </div>
            </div>
          </div>
          
          {displayFlashProducts.length > 0 ? (
            <>
              <ProductGrid products={displayFlashProducts} limit={4} scrollable={true} />
              <div className="text-center mt-6">
                <Link href="/products">
                  <Button variant="outline" className="gap-2">
                    View All Products <span className="text-xs">→</span>
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No flash sales available right now.</p>
              <p className="text-sm text-muted-foreground">Check back later for amazing deals!</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 border-b">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold">Featured Products</h2>
          <Link href="/products">
            <Button variant="outline" size="sm">View All →</Button>
          </Link>
        </div>
        <ProductGrid products={products} limit={5} scrollable={true} />
      </section>

      {/* Blog Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold">Latest from Our Blog</h2>
          <Link href="/blog">
            <Button variant="outline" size="sm">Read All →</Button>
          </Link>
        </div>
        <BlogSection posts={blogPosts} />
      </section>
    </main>
  )
}