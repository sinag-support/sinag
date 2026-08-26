'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

interface CategoryChipsProps {
   categories: { id: string; title: string }[]
   currentCategory: string | null
}

export function CategoryChips({ categories, currentCategory }: CategoryChipsProps) {
   const router = useRouter()
   const searchParams = useSearchParams()

   const handleCategoryClick = (categoryId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (categoryId === null) {
         params.delete('category')
      } else {
         params.set('category', categoryId)
      }
      router.push(`/products?${params.toString()}`)
   }

   const isAllActive = currentCategory === null

   return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:hidden scrollbar-hide">
         {/* All chip */}
         <button
            onClick={() => handleCategoryClick(null)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
               isAllActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
            }`}
         >
            All
         </button>

         {categories.map((cat) => (
            <button
               key={cat.id}
               onClick={() => handleCategoryClick(cat.id)}
               className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                  cat.id === currentCategory
                     ? 'bg-primary text-primary-foreground'
                     : 'bg-muted hover:bg-muted/80'
               }`}
            >
               {cat.title}
            </button>
         ))}
      </div>
   )
}