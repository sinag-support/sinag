import { connection } from 'next/server'
import prisma from '@/lib/prisma'
import { safeQuery } from '@/lib/safe-query'
import { Suspense } from 'react'
import Link from 'next/link'
import { ProductGrid } from '@/components/home/product-grid'
import { ProductFilters } from '@/components/products/product-filters'
import { MobileShortcuts } from '@/components/products/mobile-shortcuts'
import { CategoryChips } from '@/components/products/category-chips'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface SearchParams {
  query?: string
  category?: string
  minPrice?: string
  maxPrice?: string
  inStock?: string
  sort?: string
  productId?: string
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
        category: true,
        reviews: {
          select: { rating: true }, // fetch ratings
        },
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

  type ProductWithRelations = Awaited<ReturnType<typeof getProducts>>[number]

  // Format products with real rating and review count
  const formattedProducts = products.map((p: ProductWithRelations) => {
    const reviews = p.reviews || []
    const reviewCount = reviews.length
    const avgRating = reviewCount > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
      : 0

    return {
      id: p.id,
      name: p.title,
      price: p.price,
      discount: p.discount || 0,
      image: p.images?.[0] || '',
      category: p.category?.title || 'Uncategorized',
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount,
    }
  })

  // Check if any filters are active (excluding productId)
  const hasFilters = !!(params.query ||
    params.category ||
    params.minPrice ||
    params.maxPrice ||
    params.inStock ||
    params.sort)

  return (
    <div className="max-md:fixed max-md:inset-0 max-md:top-[64px] flex flex-col h-[calc(100dvh-64px)] md:h-[calc(100vh-64px)] overflow-hidden md:overflow-y-auto bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-0 sm:pt-10 pb-16 sm:pb-0 flex-1 flex flex-col h-full md:min-h-full overflow-hidden md:overflow-visible">
        {/* Mobile Shortcuts */}
        <div className="md:hidden flex-shrink-0 bg-background pt-1 pb-2">
          <MobileShortcuts />
        </div>

        {/* Category chips */}
        <div className="flex-shrink-0 bg-background pb-2">
          <CategoryChips
            categories={categories}
            currentCategory={params.category || null}
          />
        </div>

        {/* Main content area */}
        <div className="flex gap-6 flex-1 h-full min-h-0 overflow-hidden md:overflow-visible">
          {/* Left Sidebar */}
          <aside className="hidden md:block w-64 shrink-0 h-fit sticky top-0 [scrollbar-width:none] [-ms-overflow-style:none] [&-::-webkit-scrollbar]:hidden">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 flex-shrink-0">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">All Products</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formattedProducts.length} products found
                  </p>
                </div>
              </div>
              <ProductFilters categories={categories} />
            </div>
          </aside>

          {/* Right Content */}
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden md:overflow-visible">
            {/* Mobile header with title, subtitle and clear button */}
            <div className="md:hidden mb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">All Products</h1>
                {hasFilters && (
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors h-8"
                  >
                    Clear
                  </Link>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formattedProducts.length} products found
              </p>
            </div>

            <div className="flex-1 min-h-0 max-h-full overflow-y-auto overscroll-none md:overscroll-auto touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&-::-webkit-scrollbar]:hidden">
              {formattedProducts.length === 0 ? (
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
                  <ProductGrid
                    products={formattedProducts}
                    scrollable={false}
                    initialProductId={params.productId || null}
                  />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}