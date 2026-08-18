'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Filter } from 'lucide-react'
import { ProductFilters } from './product-filters'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface Category {
   id: string
   title: string
}

interface MobileFilterButtonProps {
   categories: Category[]
}

export function MobileFilterButton({ categories }: MobileFilterButtonProps) {
   const [open, setOpen] = useState(false)

   return (
      <Sheet open={open} onOpenChange={setOpen}>
         <SheetTrigger>
            <div
               role="button"
               tabIndex={0}
               className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'md:hidden gap-2 cursor-pointer')}
               onClick={() => setOpen(true)}
               onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
            >
               <Filter className="h-4 w-4" />
               Filters
            </div>
         </SheetTrigger>
         <SheetContent side="left" className="w-[300px] sm:w-[350px]">
            <SheetHeader>
               <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
               <ProductFilters categories={categories} />
            </div>
            <button
               className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
               onClick={() => setOpen(false)}
            >
               Apply Filters
            </button>
         </SheetContent>
      </Sheet>
   )
}