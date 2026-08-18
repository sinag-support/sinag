import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

interface BlogPost {
   id: number
   title: string
   excerpt: string
   image: string
   date: string
   slug: string
}

interface BlogSectionProps {
   posts: BlogPost[]
}

export function BlogSection({ posts }: BlogSectionProps) {
   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
               <Link href={`/blog/${post.slug}`}>
                  <div className="relative aspect-video bg-gray-100">
                     <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
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
   )
}