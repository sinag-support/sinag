'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// ✅ Simplified schema - NO .default()
const optionSchema = z.object({
  name: z.string().min(1, 'Option name is required'),
  price: z.number().min(0, 'Price must be positive'),
  image: z.string().optional(),
  stock: z.number().int().min(0),
})

const productSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  discount: z.number().min(0).max(100),
  stock: z.number().int().min(0),
  isAvailable: z.boolean(),
  categoryId: z.string().optional(),
  images: z.string().optional(),
  options: z.array(optionSchema).optional(),
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
      options: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
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
    const options = initialData.options?.map((opt: any) => ({
      name: opt.name,
      price: Number(opt.price),
      image: opt.image || '',
      stock: Number(opt.stock || 0),
    })) || []

    form.reset({
      title: initialData.title ?? '',
      description: initialData.description ?? '',
      price: Number(initialData.price ?? 0),
      discount: Number(initialData.discount ?? 0),
      stock: Number(initialData.stock ?? 0),
      isAvailable: Boolean(initialData.isAvailable),
      categoryId: categoryId,
      images: initialData.images?.[0] ?? '',
      options: options,
    })
  }, [initialData, form, categoriesLoaded])

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const payload = {
        ...data,
        categoryId: data.categoryId || undefined,
        images: data.images ? [data.images] : [],
        options: data.options || [],
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
                <FormLabel>Base Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val === '' ? 0 : Number(val))
                    }}
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
                    value={field.value || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val === '' ? 0 : Number(val))
                    }}
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
                <FormLabel>Base Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    value={field.value || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val === '' ? 0 : Number(val))
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  value={field.value || 'none'}
                  onValueChange={(value) => {
                    field.onChange(value === 'none' ? '' : value)
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="max-w-full truncate">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent side="bottom" align="start">
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
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

        {/* Product Options */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Product Options / Packages</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: '', price: 0, image: '', stock: 0 })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Option
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">No options added yet.</p>
          )}

          {fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardContent className="p-4 space-y-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-7 w-7 p-0"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`options.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Option Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 500g Bulk Pack" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`options.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={field.value || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              field.onChange(val === '' ? 0 : Number(val))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name={`options.${index}.stock`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={field.value || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              field.onChange(val === '' ? 0 : Number(val))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`options.${index}.image`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Image URL (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/option.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button type="submit" className="w-full">
          {initialData ? 'Update Product' : 'Create Product'}
        </Button>
      </form>
    </Form>
  )
}