'use client'

import { useEffect, useState } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

const productSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  discount: z.number().min(0).max(100),
  stock: z.number().int().min(0),
  isAvailable: z.boolean(),
  categoryId: z.string().optional(),
  images: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  initialData?: any
  onSuccess: () => void
}

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      discount: 0,
      stock: 0,
      isAvailable: true,
      categoryId: '',
      images: '',
    },
  })

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setCategoriesLoaded(true)
      }
    }
    fetchCategories()
  }, [])

  // Reset form when editing – wait for categories to load
  useEffect(() => {
    if (!initialData) return
    if (!categoriesLoaded) return

    const categoryId = initialData.categoryId ?? ''
    form.reset({
      title: initialData.title ?? '',
      description: initialData.description ?? '',
      price: Number(initialData.price ?? 0),
      discount: Number(initialData.discount ?? 0),
      stock: Number(initialData.stock ?? 0),
      isAvailable: Boolean(initialData.isAvailable),
      categoryId: categoryId,
      images: initialData.images?.[0] ?? '',
    })
  }, [initialData, form, categoriesLoaded])

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const payload = {
        ...data,
        categoryId: data.categoryId || undefined,
        images: data.images ? [data.images] : [],
      }
      const url = initialData
        ? `/api/admin/products/${initialData.id}`
        : '/api/admin/products'
      const method = initialData ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(initialData ? 'Product updated' : 'Product created')
        onSuccess()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Something went wrong')
      }
    } catch {
      toast.error('Network error')
    }
  }

  // Find the category title for display
  const getCategoryTitle = (id: string) => {
    if (!id) return ''
    const cat = categories.find(c => c.id === id)
    return cat?.title || id
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Product description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount %</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => {
              // Use a separate state to track the displayed value
              const displayValue = categoriesLoaded 
                ? (field.value ? getCategoryTitle(field.value) : '')
                : ''

              return (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={field.value || ''}
                    onValueChange={(value: string | null) => {
                      // ✅ Handle null by converting to empty string
                      field.onChange(value || '')
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="max-w-full truncate">
                        {/* Show the category name, not the ID */}
                        <SelectValue className="truncate">
                          {displayValue || 'Select category'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent 
                      side="bottom" 
                      align="start"
                    >
                      <SelectItem value="">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        </div>

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </FormControl>
              <FormLabel className="!mt-0">Available for sale</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {initialData ? 'Update Product' : 'Create Product'}
        </Button>
      </form>
    </Form>
  )
}