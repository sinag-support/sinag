'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select'

export function ProductSort() {
   const router = useRouter()
   const searchParams = useSearchParams()
   const currentSort = searchParams.get('sort') || 'newest'

   const handleSortChange = (value: string | null) => {
      if (!value) return
      const params = new URLSearchParams(searchParams)
      if (value === 'newest') {
         params.delete('sort')
      } else {
         params.set('sort', value)
      }
      router.push(`/products?${params.toString()}`)
   }

   return (
      <Select value={currentSort} onValueChange={handleSortChange}>
         <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
         </SelectTrigger>
         <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
         </SelectContent>
      </Select>
   )
}