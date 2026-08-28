import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowUpRight, BookOpen, Heart, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlogPost {
  id: number | string
  title: string
  excerpt: string
  image: string
  date: string
  slug: string
  category?: string
  readTime?: string
  likeCount?: number
  commentCount?: number
}

interface BlogSectionProps {
  posts: BlogPost[]
}

export function BlogSection({ posts }: BlogSectionProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/20">
        <BookOpen className="h-10 w-10 text-muted-foreground/60 mb-3" />
        <p className="text-base font-medium text-muted-foreground">
          No blog posts available right now.
        </p>
      </div>
    )
  }

  // Limit to 3 posts max for desktop & mobile view
  const displayPosts = posts.slice(0, 3)

  const renderCard = (post: BlogPost) => {
    const formattedDate = new Date(post.date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    const likeCount = post.likeCount || 0
    const commentCount = post.commentCount || 0

    return (
      <Card
        key={post.id}
        className="group flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border bg-card h-full rounded-xl p-0 pt-0"
      >
        {/* Image Container */}
        <Link
          href={`/blog/${post.slug}`}
          className="block relative aspect-video bg-muted overflow-hidden rounded-t-xl"
        >
          {post.image ? (
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <span className="text-gray-400 dark:text-gray-500 text-sm">No image</span>
            </div>
          )}
          {post.category && (
            <Badge className="absolute top-3 left-3 z-10 shadow-sm font-medium bg-background/90 text-foreground backdrop-blur-md hover:bg-background">
              {post.category}
            </Badge>
          )}
        </Link>

        {/* Content Body */}
        <CardContent className="p-4 flex flex-col flex-1">
          <Link
            href={`/blog/${post.slug}`}
            className="group/title flex items-start justify-between gap-2"
          >
            <h3 className="font-semibold text-base sm:text-lg leading-snug group-hover/title:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 group-hover/title:opacity-100 group-hover/title:text-primary transition-all duration-200 -translate-x-1 group-hover/title:translate-x-0" />
          </Link>

          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Like & Comment Count */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Heart className={cn(
                "h-3.5 w-3.5",
                likeCount > 0 ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )} />
              <span>{likeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{commentCount}</span>
            </div>
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
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
  }

  return (
    <>
      {/* Desktop: 3 Columns Grid */}
      <div className="hidden lg:grid grid-cols-3 gap-6">
        {displayPosts.map((post) => renderCard(post))}
      </div>

      {/* Mobile/Tablet: Horizontal Scrollable Stack */}
      <div className="lg:hidden">
        <div
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayPosts.map((post) => (
            <div
              key={post.id}
              className="flex-shrink-0 w-[280px] sm:w-[320px]"
            >
              {renderCard(post)}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}