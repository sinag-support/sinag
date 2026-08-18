import { Suspense } from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { ProductGrid } from '@/components/home/product-grid'
import { ProductFilters } from '@/components/products/product-filters'
import { ProductSort } from '@/components/products/product-sort'
import { MobileFilterButton } from '@/components/products/mobile-filter-button'
import { MobileShortcuts } from '@/components/products/mobile-shortcuts'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface SearchParams {
   query?: string
   category?: string
   minPrice?: string
   maxPrice?: string
   inStock?: string
   sort?: string
}

async function getProducts(searchParams: SearchParams) {
   const { query, category, minPrice, maxPrice, inStock, sort } = searchParams

   const where: any = {
      isAvailable: true,
   }

   if (query) {
      where.OR = [
         { title: { contains: query, mode: 'insensitive' } },
         { description: { contains: query, mode: 'insensitive' } },
      ]
   }

   if (category) {
      where.categoryId = category
   }

   if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
   }

   if (inStock === 'true') {
      where.stock = { gt: 0 }
   }

   let orderBy: any = { createdAt: 'desc' }
   if (sort === 'price-asc') orderBy = { price: 'asc' }
   else if (sort === 'price-desc') orderBy = { price: 'desc' }
   else if (sort === 'rating') orderBy = { rating: 'desc' }

   try {
      const products = await prisma.product.findMany({
         where,
         orderBy,
         include: {
            brand: true,
            category: true,
         },
      })
      return products
   } catch (error) {
      console.error('Error fetching products:', error)
      return []
   }
}

async function getCategories() {
   try {
      const categories = await prisma.category.findMany({
         orderBy: { title: 'asc' },
      })
      return categories
   } catch (error) {
      console.error('Error fetching categories:', error)
      return []
   }
}

export default async function ProductsPage({
   searchParams,
}: {
   searchParams: Promise<SearchParams>
}) {
   const params = await searchParams
   const [products, categories] = await Promise.all([
      getProducts(params),
      getCategories(),
   ])

   const hasFilters = Object.values(params).some(
      (value) => value && value !== ''
   )

   const removeFilter = (key: string) => {
      const newParams = { ...params }
      delete newParams[key as keyof SearchParams]
      const search = new URLSearchParams(newParams as Record<string, string>).toString()
      return `/products${search ? `?${search}` : ''}`
   }

   const clearAll = () => '/products'

   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
         {/* Header with title (desktop) and shortcuts (mobile) */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="hidden md:block">
               <h1 className="text-2xl sm:text-3xl font-bold">All Products</h1>
               <p className="text-sm text-muted-foreground mt-0.5">
                  {products.length} products found
               </p>
            </div>

            <MobileShortcuts />

            <div className="flex items-center gap-3">
               <MobileFilterButton categories={categories} />
               <ProductSort />
            </div>
         </div>

         {/* Active filters bar (unchanged) */}
         {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
               <span className="text-sm font-medium">Active filters:</span>
               {params.query && (
                  <span className="inline-flex items-center gap-1 bg-background px-2 py-1 rounded text-xs border">
                     Search: {params.query}
                     <Link href={removeFilter('query')} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                     </Link>
                  </span>
               )}
               {params.category && (
                  <span className="inline-flex items-center gap-1 bg-background px-2 py-1 rounded text-xs border">
                     Category: {categories.find((c: { id: string; title: string }) => c.id === params.category)?.title}
                     <Link href={removeFilter('category')} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                     </Link>
                  </span>
               )}
               {(params.minPrice || params.maxPrice) && (
                  <span className="inline-flex items-center gap-1 bg-background px-2 py-1 rounded text-xs border">
                     Price: {params.minPrice || '0'} - {params.maxPrice || '∞'}
                     <Link href={removeFilter('minPrice')} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                     </Link>
                  </span>
               )}
               {params.inStock === 'true' && (
                  <span className="inline-flex items-center gap-1 bg-background px-2 py-1 rounded text-xs border">
                     In Stock
                     <Link href={removeFilter('inStock')} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                     </Link>
                  </span>
               )}
               <Link href={clearAll()} className="text-xs text-primary hover:underline ml-auto">
                  Clear all
               </Link>
            </div>
         )}

         {/* Filters (desktop) + Product grid */}
         <div className="flex gap-6">
            <aside className="hidden md:block w-64 shrink-0">
               <div className="sticky top-20">
                  <ProductFilters categories={categories} />
               </div>
            </aside>

            <div className="flex-1">
               {products.length === 0 ? (
                  <div className="text-center py-12">
                     <div className="text-4xl mb-4">🛍️</div>
                     <h3 className="text-lg font-medium">No products found</h3>
                     <p className="text-muted-foreground text-sm mt-1">
                        Try adjusting your filters or search terms
                     </p>
                     <Link href="/products">
                        <Button variant="outline" className="mt-4">
                           Clear all filters
                        </Button>
                     </Link>
                  </div>
               ) : (
                  <Suspense fallback={<div>Loading...</div>}>
                     <ProductGrid products={products} />
                  </Suspense>
               )}
            </div>
         </div>
      </div>
   )
}