import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

// Sample blog posts – move this to a shared data file later
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

export const metadata = {
   title: 'Blog - SINAG',
   description: 'Read the latest articles and updates from SINAG.',
}

export const dynamic = 'force-dynamic'

export default function BlogPage() {
   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl">
         <div className="space-y-8">
            <div>
               <h1 className="text-3xl sm:text-4xl font-bold">Latest from Our Blog</h1>
               <p className="text-muted-foreground text-lg mt-2">
                  Insights, tips, and news from the SINAG team.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {blogPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                     <Link href={`/blog/${post.slug}`}>
                        <div className="relative aspect-video bg-gray-100">
                           <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              className="object-cover hover:scale-105 transition-transform"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                           />
                        </div>
                     </Link>
                     <CardContent className="p-4">
                        <Link href={`/blog/${post.slug}`}>
                           <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
                              {post.title}
                           </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                           {post.excerpt}
                        </p>
                        <p className="text-xs text-muted-foreground mt-3">
                           {new Date(post.date).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                           })}
                        </p>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>
      </div>
   )
}