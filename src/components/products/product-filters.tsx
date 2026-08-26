'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface Category {
   id: string
   title: string
}

interface ProductFiltersProps {
   categories: Category[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
   const router = useRouter()
   const searchParams = useSearchParams()

   const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '')
   const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
   const [priceRange, setPriceRange] = useState<[number, number]>([
      parseInt(searchParams.get('minPrice') || '0'),
      parseInt(searchParams.get('maxPrice') || '1000'),
   ])
   const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true')

   // Update URL when filters change
   const updateFilters = useCallback(() => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('query', searchQuery)
      if (selectedCategory) params.set('category', selectedCategory)
      if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString())
      if (priceRange[1] < 1000) params.set('maxPrice', priceRange[1].toString())
      if (inStock) params.set('inStock', 'true')
      
      const url = `/products?${params.toString()}`
      router.push(url)
   }, [searchQuery, selectedCategory, priceRange, inStock, router])

   // Debounced search
   useEffect(() => {
      const timer = setTimeout(() => {
         updateFilters()
      }, 300)
      return () => clearTimeout(timer)
   }, [searchQuery, updateFilters])

   // Update when filters change (except searchQuery which is debounced)
   useEffect(() => {
      // Skip initial render
      const timer = setTimeout(() => {
         updateFilters()
      }, 100)
      return () => clearTimeout(timer)
   }, [selectedCategory, priceRange, inStock, updateFilters])

   const handleCategoryChange = (categoryId: string) => {
      const newCategory = selectedCategory === categoryId ? '' : categoryId
      setSelectedCategory(newCategory)
   }

   const handlePriceChange = (value: number | readonly number[]) => {
      const arr = Array.isArray(value) ? value : [value, value]
      setPriceRange([arr[0], arr[1] || arr[0]])
   }

   const handlePriceCommitted = (value: number | readonly number[]) => {
      const arr = Array.isArray(value) ? value : [value, value]
      setPriceRange([arr[0], arr[1] || arr[0]])
      // Immediately update on commit
      updateFilters()
   }

   const clearFilters = () => {
      setSearchQuery('')
      setSelectedCategory('')
      setPriceRange([0, 1000])
      setInStock(false)
      router.push('/products')
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="font-semibold">Filters</h2>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
               Clear all
            </Button>
         </div>

         {/* Search */}
         <div className="space-y-2">
            <Label htmlFor="search-products">Search</Label>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                  id="search-products"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
               />
            </div>
         </div>

         {/* Categories */}
         <div className="space-y-2">
            <Label>Categories</Label>
            <div className="space-y-1.5">
               {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2">
                     <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategory === category.id}
                        onCheckedChange={() => handleCategoryChange(category.id)}
                     />
                     <Label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-normal cursor-pointer"
                     >
                        {category.title}
                     </Label>
                  </div>
               ))}
            </div>
         </div>

         {/* Price Range */}
         <div className="space-y-2">
            <Label>Price Range</Label>
            <Slider
               value={priceRange}
               min={0}
               max={1000}
               step={100}
               onValueChange={handlePriceChange}
               onValueCommitted={handlePriceCommitted}
               className="py-2"
            />
            <div className="flex items-center justify-between text-sm">
               <span>₱{priceRange[0]}</span>
               <span>₱{priceRange[1]}</span>
            </div>
         </div>

         {/* In Stock */}
         <div className="flex items-center gap-2">
            <Checkbox
               id="in-stock"
               checked={inStock}
               onCheckedChange={(checked) => {
                  setInStock(checked === true)
               }}
            />
            <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">
               In Stock Only
            </Label>
         </div>
      </div>
   )
}