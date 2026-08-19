import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'

// Sample blog posts – replace with real data from CMS/DB
const blogPosts = [
   {
      id: 1,
      title: 'Top 10 Gift Ideas',
      excerpt: 'Find the perfect gift for any occasion with our curated list.',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop',
      date: '2024-01-15',
      slug: 'top-10-gift-ideas',
      readTime: 4,
   },
   {
      id: 2,
      title: 'How to Choose the Right Headphones',
      excerpt: 'A comprehensive guide to finding your perfect audio companion.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
      date: '2024-01-10',
      slug: 'choose-right-headphones',
      readTime: 6,
   },
   {
      id: 3,
      title: '5 Tips for Online Shopping',
      excerpt: 'Maximize your savings and security while shopping online.',
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
      date: '2024-01-05',
      slug: 'online-shopping-tips',
      readTime: 3,
   },
]

export const metadata = {
   title: 'Blog - SINAG',
   description: 'Read the latest articles and updates from SINAG.',
}

export const dynamic = 'force-dynamic'

export default function BlogPage() {
   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-6xl">
         {/* Header */}
         <div className="text-center space-y-4 mb-8 sm:mb-12">
            <Badge variant="outline" className="px-4 py-1 text-xs font-medium">
               Our Blog
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
               Latest from Our Blog
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
               Insights, tips, and news from the SINAG team.
            </p>
         </div>

         {/* Blog Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
               <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow group"
               >
                  <Link href={`/blog/${post.slug}`}>
                     <div className="relative aspect-video bg-gray-100 overflow-hidden">
                        <Image
                           src={post.image}
                           alt={post.title}
                           fill
                           className="object-cover group-hover:scale-105 transition-transform duration-300"
                           sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                     </div>
                  </Link>
                  <CardContent className="p-5 space-y-3">
                     <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                           <Calendar className="h-3 w-3" />
                           {new Date(post.date).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                           })}
                        </span>
                        <span className="flex items-center gap-1">
                           <Clock className="h-3 w-3" />
                           {post.readTime} min read
                        </span>
                     </div>
                     <Link href={`/blog/${post.slug}`}>
                        <h3 className="font-bold text-lg leading-tight hover:text-primary transition-colors line-clamp-2">
                           {post.title}
                        </h3>
                     </Link>
                     <p className="text-sm text-muted-foreground line-clamp-3">
                        {post.excerpt}
                     </p>
                     <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                     >
                        Read more →
                     </Link>
                  </CardContent>
               </Card>
            ))}
         </div>
      </div>
   )
}