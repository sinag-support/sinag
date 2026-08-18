import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'

// Sample data – same as listing; ideally share from a central file
const posts: Record<string, { title: string; content: string; image: string; date: string }> = {
   'top-10-gift-ideas': {
      title: 'Top 10 Gift Ideas',
      content: `
         <p>Finding the perfect gift can be challenging. Here are our top 10 gift ideas for any occasion.</p>
         <h2>1. Wireless Headphones</h2>
         <p>High-quality audio for music lovers.</p>
         <h2>2. Smart Watch</h2>
         <p>Stay connected and track your fitness.</p>
         <h2>3. Laptop Backpack</h2>
         <p>Stylish and functional for daily use.</p>
         <h2>4. Bluetooth Speaker</h2>
         <p>Portable sound for any setting.</p>
         <h2>5. Running Shoes</h2>
         <p>Comfort and performance for active lifestyles.</p>
      `,
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop',
      date: '2024-01-15',
   },
   'choose-right-headphones': {
      title: 'How to Choose the Right Headphones',
      content: `
         <p>Choosing the right headphones can be overwhelming. Here's a guide to help you decide.</p>
         <h2>Types of Headphones</h2>
         <p>Over-ear, on-ear, in-ear – each has its pros and cons.</p>
         <h2>Sound Quality</h2>
         <p>Look for balanced audio and good bass response.</p>
         <h2>Comfort</h2>
         <p>Consider weight, padding, and ear cup size.</p>
      `,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=400&fit=crop',
      date: '2024-01-10',
   },
   'online-shopping-tips': {
      title: '5 Tips for Online Shopping',
      content: `
         <p>Maximize your savings and security while shopping online with these tips.</p>
         <h2>1. Compare Prices</h2>
         <p>Use price comparison tools to find the best deal.</p>
         <h2>2. Check Reviews</h2>
         <p>Read customer reviews to ensure quality.</p>
         <h2>3. Secure Payment</h2>
         <p>Use trusted payment methods and avoid public Wi-Fi.</p>
         <h2>4. Look for Discounts</h2>
         <p>Sign up for newsletters to get promo codes.</p>
         <h2>5. Return Policy</h2>
         <p>Always check the return policy before buying.</p>
      `,
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop',
      date: '2024-01-05',
   },
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
   return Object.keys(posts).map((slug) => ({ slug }))
}

export const dynamic = 'force-dynamic'

export default async function BlogPostPage({
   params,
}: {
   params: Promise<{ slug: string }>
}) {
   const { slug } = await params
   const post = posts[slug]

   if (!post) {
      notFound()
   }

   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
         <Link
            href="/blog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
         >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
         </Link>

         <article>
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-6">
               <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
               />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold">{post.title}</h1>
            <p className="text-sm text-muted-foreground mt-2">
               {new Date(post.date).toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
               })}
            </p>

            <div
               className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none mt-6"
               dangerouslySetInnerHTML={{ __html: post.content }}
            />
         </article>
      </div>
   )
}