'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Banner {
   id: number
   image: string
   title: string
   description: string
   link: string
}

interface BannerCarouselProps {
   banners: Banner[]
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
   const [currentIndex, setCurrentIndex] = useState(0)
   const [isAutoPlaying, setIsAutoPlaying] = useState(true)

   useEffect(() => {
      if (!isAutoPlaying) return
      const interval = setInterval(() => {
         setCurrentIndex((prev) => (prev + 1) % banners.length)
      }, 5000)
      return () => clearInterval(interval)
   }, [banners.length, isAutoPlaying])

   const goToSlide = (index: number) => {
      setCurrentIndex(index)
      setIsAutoPlaying(false)
   }

   if (!banners.length) return null

   return (
      <div className="relative w-full overflow-hidden group">
         <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
         >
            {banners.map((banner) => (
               <Link
                  key={banner.id}
                  href={banner.link}
                  className="relative w-full flex-shrink-0 h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px]"
               >
                  <Image
                     src={banner.image}
                     alt={banner.title}
                     fill
                     sizes="100vw"
                     className="object-cover"
                     priority={banner.id === 1}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-start p-6 sm:p-12 text-white">
                     <div className="max-w-md">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                           {banner.title}
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg text-white/90 mb-4">
                           {banner.description}
                        </p>
                        <Button className="bg-white text-black hover:bg-gray-200">
                           Shop Now
                        </Button>
                     </div>
                  </div>
               </Link>
            ))}
         </div>

         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
               <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                     index === currentIndex
                        ? 'bg-white w-6'
                        : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
               />
            ))}
         </div>
      </div>
   )
}