'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, X, Image, Calendar, User, Tag, Link2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

// Schema with all fields required or optional with defaults
const blogSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only (e.g., my-blog-post)'),
  excerpt: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  coverImage: z.string().optional(),
  author: z.string().min(2, 'Author name is required'),
  published: z.boolean(),
})

// Infer the type
type BlogFormValues = z.infer<typeof blogSchema>

interface BlogFormProps {
  initialData?: any
  onSuccess: () => void
  onCancel: () => void
}

export function BlogForm({ initialData, onSuccess, onCancel }: BlogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [imagePreview, setImagePreview] = useState<string>('')

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      author: 'SINAG Editorial',
      published: true,
    },
  })

  // Watch the coverImage field for preview
  const coverImageValue = form.watch('coverImage')

  // Update image preview when coverImage changes
  useEffect(() => {
    if (coverImageValue && coverImageValue.trim() !== '') {
      setImagePreview(coverImageValue.trim())
    } else {
      setImagePreview('')
    }
  }, [coverImageValue])

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      const imageUrl = initialData.coverImage || ''
      setImagePreview(imageUrl)

      form.reset({
        title: initialData.title || '',
        slug: initialData.slug || '',
        excerpt: initialData.excerpt || '',
        content: initialData.content || '',
        coverImage: imageUrl,
        author: initialData.author || 'SINAG Editorial',
        published: initialData.published !== undefined ? initialData.published : true,
      })
      setTags(initialData.tags || [])
    }
  }, [initialData, form])

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    form.setValue('title', title)
    if (!initialData) {
      form.setValue('slug', generateSlug(title))
    }
  }

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  const clearImage = () => {
    setImagePreview('')
    form.setValue('coverImage', '')
  }

  const onSubmit = async (data: BlogFormValues) => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        tags: tags,
        excerpt: data.excerpt || null,
        coverImage: data.coverImage || null,
      }

      const url = initialData
        ? `/api/admin/blog/${initialData.id}`
        : '/api/admin/blog'
      const method = initialData ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save post')
      }

      toast.success(initialData ? 'Post updated' : 'Post created')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Title
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="My Amazing Blog Post"
                  {...field}
                  onChange={handleTitleChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                Slug (URL)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="my-amazing-blog-post"
                  {...field}
                  disabled={!!initialData}
                />
              </FormControl>
              {!initialData && (
                <p className="text-xs text-muted-foreground">
                  Auto-generated from title. Must be unique.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Author
                </FormLabel>
                <FormControl>
                  <Input placeholder="SINAG Editorial" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-6">
                <FormControl>
                    <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm font-medium leading-none">
                    Published
                </FormLabel>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Excerpt (Short Description)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A brief summary of your post..."
                  {...field}
                  className="min-h-[60px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cover Image with Preview - Banner Ratio */}
        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Image className="h-4 w-4 text-muted-foreground" />
                Cover Image URL (Banner)
              </FormLabel>
              <div className="space-y-3">
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="https://images.unsplash.com/photo-..."
                      {...field}
                      value={field.value || ''}
                      className={cn(
                        "w-full",
                        imagePreview && "pr-10"
                      )}
                    />
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </FormControl>

                {/* Image Preview - Banner Ratio (16:9) */}
                {imagePreview && (
                  <div className="relative rounded-md overflow-hidden border bg-muted/20 p-2">
                    <div className="flex flex-col gap-2">
                      <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden bg-muted">
                        <img
                          src={imagePreview}
                          alt="Cover image preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {imagePreview}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearImage}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove image</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Content
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your blog post content here..."
                  {...field}
                  className="min-h-[200px] font-mono"
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Use plain text. Line breaks will be preserved.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags - Custom component not part of react-hook-form */}
        <div className="space-y-2">
          <FormLabel className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Tags
          </FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag (press Enter or comma)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addTag}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {tags.length === 0 && (
              <span className="text-sm text-muted-foreground">No tags added</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              initialData ? 'Update Post' : 'Create Post'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

// Need to import FileText for the icon
import { FileText } from 'lucide-react'