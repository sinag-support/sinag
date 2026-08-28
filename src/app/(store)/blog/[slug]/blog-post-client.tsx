'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, Share2, User, Heart, MessageCircle, ThumbsUp, Reply, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { BackButton } from '@/components/ui/back-button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Comment {
  id: string
  content: string
  userId: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  replies?: Comment[]
}

// Update the BlogPost interface
interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  coverImage: string | null
  createdAt: string
  tags: string[]
  author: string
}

interface BlogPostClientProps {
  post: BlogPost
}

export default function BlogPostClient({ post }: BlogPostClientProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [liking, setLiking] = useState(false)

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    checkAuth()
  }, [])

  // Fetch comments and likes
  useEffect(() => {
    fetchComments()
    fetchLikes()
  }, [post.slug])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/blog/${post.slug}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLikes = async () => {
    try {
      const response = await fetch(`/api/blog/${post.slug}/like`)
      if (response.ok) {
        const data = await response.json()
        setLikeCount(data.likeCount)
        setUserLiked(data.userLiked)
      }
    } catch (error) {
      console.error('Error fetching likes:', error)
    }
  }

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like this post')
      router.push('/login')
      return
    }

    if (liking) return
    setLiking(true)

    try {
      const response = await fetch(`/api/blog/${post.slug}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        setLikeCount(data.likeCount)
        setUserLiked(data.liked)
        toast.success(data.liked ? 'Liked!' : 'Unliked')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like')
    } finally {
      setLiking(false)
    }
  }

  const handleAddComment = async () => {
    if (!user) {
      toast.error('Please login to comment')
      router.push('/login')
      return
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/blog/${post.slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments([comment, ...comments])
        setNewComment('')
        toast.success('Comment added!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddReply = async (parentId: string) => {
    if (!user) {
      toast.error('Please login to reply')
      router.push('/login')
      return
    }

    if (!replyContent.trim()) {
      toast.error('Please enter a reply')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/blog/${post.slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId,
        }),
      })

      if (response.ok) {
        const reply = await response.json()
        // Add reply to the parent comment
        setComments(prev =>
          prev.map(comment =>
            comment.id === parentId
              ? { ...comment, replies: [...(comment.replies || []), reply] }
              : comment
          )
        )
        setReplyContent('')
        setReplyTo(null)
        toast.success('Reply added!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add reply')
      }
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error('Failed to add reply')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    if (!confirm('Delete this comment?')) return

    try {
      const response = await fetch(`/api/blog/${post.slug}/comments?id=${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        toast.success('Comment deleted')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderContent = (content: string | null) => {
    if (!content) return null

    const lines = content.split('\n').filter((line) => line.trim())

    return lines.map((line, index) => {
      const trimmed = line.trim()

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
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        return (
          <li key={index} className="ml-4 mb-1 text-muted-foreground">
            {trimmed.replace(/^[-•]\s*/, '')}
          </li>
        )
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={index} className="ml-4 mb-1 text-muted-foreground list-decimal list-inside">
            {trimmed.replace(/^\d+\.\s*/, '')}
          </li>
        )
      }
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

  const goBack = () => {
    router.back()
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-4xl">
      {/* Back Button - Always visible */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <article>
        {/* Header - Removed the tag badge from top */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(post.createdAt)}
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

        {/* Tags at bottom */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t">
            <span className="text-sm text-muted-foreground mr-2">Tags:</span>
            {post.tags.map((tag: string) => (
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

      {/* Likes & Comments Section */}
      <div className="mt-12 pt-8 border-t">
        {/* Like Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant={userLiked ? 'default' : 'outline'}
            size="lg"
            className={cn(
              "gap-2",
              userLiked && "bg-red-500 hover:bg-red-600 text-white"
            )}
            onClick={handleLike}
            disabled={liking}
          >
            <Heart className={cn(
              "h-5 w-5",
              userLiked && "fill-white"
            )} />
            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <MessageCircle className="h-5 w-5" />
            {comments.length} Comments
          </Button>
        </div>

        {/* Add Comment */}
        <div className="mb-8">
          {user ? (
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {getInitials(user.user_metadata?.full_name || user.user_metadata?.name || user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={submitting || !newComment.trim()}
                  className="gap-2"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground mb-2">Sign in to join the conversation</p>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={comment.user.avatar || undefined} />
                    <AvatarFallback>
                      {getInitials(comment.user.name || comment.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.user.name || comment.user.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground gap-1"
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      >
                        <Reply className="h-3 w-3" />
                        Reply
                      </Button>
                      {user && user.id === comment.userId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive gap-1 hover:text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      )}
                    </div>

                    {/* Reply Input */}
                    {replyTo === comment.id && (
                      <div className="mt-3 flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.user_metadata?.avatar_url} />
                          <AvatarFallback>
                            {getInitials(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Write a reply..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="min-h-[60px] text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAddReply(comment.id)}
                              disabled={submitting || !replyContent.trim()}
                            >
                              {submitting ? 'Posting...' : 'Post Reply'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReplyTo(null)
                                setReplyContent('')
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-muted space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={reply.user.avatar || undefined} />
                              <AvatarFallback>
                                {getInitials(reply.user.name || reply.user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {reply.user.name || reply.user.email}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm mt-0.5">{reply.content}</p>
                              {user && user.id === reply.userId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-destructive gap-1 hover:text-destructive mt-0.5"
                                  onClick={() => handleDeleteComment(reply.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}