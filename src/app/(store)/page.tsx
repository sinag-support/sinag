import { connection } from 'next/server'
import prisma from '@/lib/prisma'
import { safeQuery } from '@/lib/safe-query'
import { BannerCarousel } from '@/components/home/banner-carousel'
import { ProductGrid } from '@/components/home/product-grid'
import { BlogSection } from '@/components/home/blog-section'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const banners = [
   {
      id: 1,
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop',
      title: 'Summer Sale',
      description: 'Up to 50% off on selected items',
      link: '/products?category=sale',
   },
   {
      id: 2,
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=400&fit=crop',
      title: 'New Arrivals',
      description: 'Discover the latest trends',
      link: '/products?sort=newest',
   },
   {
      id: 3,
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=400&fit=crop',
      title: 'Free Shipping',
      description: 'On orders over ₱1,000',
      link: '/products?shipping=free',
   },
]

const blogPosts = [
   {
      id: 1,
      title: 'Top 10 Gift Ideas',
      excerpt: 'Find the perfect gift for any occasion with our curated list.',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop',
      date: '2024-01-15',
      slug: 'top-10-gift-ideas',
   },
   {
      id: 2,
      title: 'How to Choose the Right Headphones',
      excerpt: 'A comprehensive guide to finding your perfect audio companion.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
      date: '2024-01-10',
      slug: 'choose-right-headphones',
   },
   {
      id: 3,
      title: '5 Tips for Online Shopping',
      excerpt: 'Maximize your savings and security while shopping online.',
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
      date: '2024-01-05',
      slug: 'online-shopping-tips',
   },
]

export default async function HomePage() {
   // Bail out of prerendering
   await connection()

   // Safely fetch featured products; fallback to empty array during build
   const dbProducts = await safeQuery(
      () =>
         prisma.product.findMany({
            where: {
               isFeatured: true,
               isAvailable: true,
            },
            take: 6,
            orderBy: { createdAt: 'desc' },
            select: {
               id: true,
               title: true,
               price: true,
               discount: true,
               images: true,
            },
         }),
      [] // fallback
   )

   const products = dbProducts.map((p: any) => ({
      id: p.id,
      name: p.title,
      price: p.price,
      discount: p.discount,
      image: p.images?.[0] || '',
      rating: 4.0,
   }))

   return (
      <main className="min-h-screen pb-12 md:pb-0">
         <section className="w-full -mt-[1px]">
            <BannerCarousel banners={banners} />
         </section>

         <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
               <h2 className="text-xl sm:text-2xl font-bold">Featured Products</h2>
               <Link href="/products">
                  <Button variant="outline" size="sm">View All →</Button>
               </Link>
            </div>
            <ProductGrid products={products} />
         </section>

         <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-t">
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