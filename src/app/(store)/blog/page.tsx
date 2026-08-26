import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import prisma from '@/lib/prisma'
import { safeQuery } from '@/lib/safe-query'

export const metadata = {
  title: 'Blog - SINAG',
  description: 'Read the latest articles and updates from SINAG.',
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const searchQuery = params.search || ''

  // Fetch blog posts from database with search filter
  const blogPosts = await safeQuery(
    () =>
      prisma.blogPost.findMany({
        where: {
          published: true,
          ...(searchQuery
            ? {
                OR: [
                  { title: { contains: searchQuery, mode: 'insensitive' } },
                  { excerpt: { contains: searchQuery, mode: 'insensitive' } },
                  { content: { contains: searchQuery, mode: 'insensitive' } },
                  { author: { contains: searchQuery, mode: 'insensitive' } },
                  { tags: { has: searchQuery } },
                ],
              }
            : {}),
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          createdAt: true,
          tags: true,
          author: true,
        },
      }),
    []
  )

  // Map posts to the format expected by the component
  const posts = blogPosts.map((post: any) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt || '',
    image: post.coverImage || '',
    date: post.createdAt.toISOString(),
    slug: post.slug,
    readTime: 5,
    tags: post.tags || [],
    author: post.author,
  }))

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

      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-8">
        <form action="/blog" method="GET" className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="search"
            placeholder="Search articles by title, author, or tag..."
            defaultValue={searchQuery}
            className="pl-9 w-full"
          />
        </form>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Showing results for &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </div>

      {/* Blog Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium">
            {searchQuery ? 'No matching articles found' : 'No blog posts yet'}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Check back later for new articles.'}
          </p>
          {searchQuery && (
            <Link
              href="/blog"
              className="inline-block mt-4 text-sm text-primary hover:underline"
            >
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'} found
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <Card
                key={post.id}
                className="overflow-hidden hover:shadow-lg transition-shadow group rounded-lg p-0 border flex flex-col"
              >
                <Link href={`/blog/${post.slug}`}>
                  <div className="relative aspect-video bg-gray-100 overflow-hidden rounded-t-lg">
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-gray-400 dark:text-gray-500 text-sm">No image</span>
                      </div>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <Badge className="absolute top-3 left-3 z-10 shadow-sm font-medium bg-background/90 text-foreground backdrop-blur-md hover:bg-background">
                        {post.tags[0]}
                      </Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-5 space-y-3 flex-1 flex flex-col">
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
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex flex-wrap items-center justify-between pt-2 gap-2">
                    <span className="text-xs text-muted-foreground">By {post.author}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                    >
                      Read more →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}