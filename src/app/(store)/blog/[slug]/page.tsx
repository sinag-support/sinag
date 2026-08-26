import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Share2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/prisma'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Fetch single blog post from database
  const post = await safeQuery(
    () =>
      prisma.blogPost.findUnique({
        where: {
          slug: slug,
          published: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          coverImage: true,
          createdAt: true,
          tags: true,
          author: true,
        },
      }),
    null
  )

  if (!post) {
    notFound()
  }

  const tags = post.tags || []

  // Render content with proper formatting
  const renderContent = (content: string) => {
    if (!content) return null

    // Split by new lines and render
    const lines = content.split('\n').filter((line) => line.trim())

    return lines.map((line, index) => {
      const trimmed = line.trim()

      // Headings
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-bold mt-6 mb-3">
            {trimmed.replace('### ', '')}
          </h3>
        )
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-bold mt-6 mb-3">
            {trimmed.replace('## ', '')}
          </h2>
        )
      }
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-bold mt-6 mb-3">
            {trimmed.replace('# ', '')}
          </h1>
        )
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        return (
          <li key={index} className="ml-4 mb-1 text-muted-foreground">
            {trimmed.replace(/^[-•]\s*/, '')}
          </li>
        )
      }

      // Numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={index} className="ml-4 mb-1 text-muted-foreground list-decimal list-inside">
            {trimmed.replace(/^\d+\.\s*/, '')}
          </li>
        )
      }

      // Regular paragraph
      if (trimmed) {
        return (
          <p key={index} className="mb-4 leading-relaxed text-muted-foreground">
            {trimmed}
          </p>
        )
      }

      return null
    })
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-4xl">
      {/* Back button */}
      <Link
        href="/blog"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Blog
      </Link>

      <article>
        {/* Header */}
        <div className="space-y-4 mb-8">
          {tags.length > 0 && (
            <Badge variant="outline" className="text-xs font-medium">
              {tags[0]}
            </Badge>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(post.createdAt).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              5 min read
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author || 'SINAG Editorial'}
            </span>
          </div>
        </div>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden mb-8">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-strong:text-foreground prose-ul:list-disc prose-ul:pl-6
          prose-li:mb-1">
          {renderContent(post.content || post.excerpt || '')}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t">
            <span className="text-sm text-muted-foreground mr-2">Tags:</span>
            {tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t">
          <span className="text-sm text-muted-foreground">Share this article</span>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </article>
    </div>
  )
}