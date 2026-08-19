import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowUpRight, BookOpen } from 'lucide-react'

interface BlogPost {
  id: number | string
  title: string
  excerpt: string
  image: string
  date: string
  slug: string
  category?: string
  readTime?: string
}

interface BlogSectionProps {
  posts: BlogPost[]
}

export function BlogSection({ posts }: BlogSectionProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/20">
        <BookOpen className="h-10 w-10 text-muted-foreground/60 mb-3" />
        <p className="text-base font-medium text-muted-foreground">No blog posts available right now.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => {
        const formattedDate = new Date(post.date).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })

        return (
          <Card
            key={post.id}
            className="group flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border bg-card"
          >
            {/* Image Container with Floating Category Badge */}
            <Link href={`/blog/${post.slug}`} className="block relative aspect-video bg-muted overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              {post.category && (
                <Badge className="absolute top-3 left-3 z-10 shadow-sm font-medium bg-background/90 text-foreground backdrop-blur-md hover:bg-background">
                  {post.category}
                </Badge>
              )}
            </Link>

            {/* Content Body */}
            <CardContent className="p-4 flex flex-col flex-1">
              {/* Title & External Link Indicator Icon */}
              <Link href={`/blog/${post.slug}`} className="group/title flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg leading-snug group-hover/title:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 group-hover/title:opacity-100 group-hover/title:text-primary transition-all duration-200 -translate-x-1 group-hover/title:translate-x-0" />
              </Link>

              {/* Excerpt */}
              <p className="text-sm text-muted-foreground mt-2.5 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>

              {/* Metadata Footer with Icons */}
              <div className="mt-auto pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary/70" />
                  <time dateTime={post.date}>{formattedDate}</time>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary/70" />
                  <span>{post.readTime || '5 min read'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}