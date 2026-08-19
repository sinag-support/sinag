import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Truck, Shield, HeadphonesIcon, Package, Sparkles } from 'lucide-react'

export const metadata = {
   title: 'About Us - SINAG',
   description: 'Learn about SINAG, your trusted online store for quality products.',
}

export default function AboutPage() {
   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-6xl">
         {/* Hero Section */}
         <div className="relative mb-12 sm:mb-16">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-3xl" />
            <div className="text-center space-y-4 py-8 sm:py-12">
               <Badge variant="outline" className="mx-auto px-4 py-1 text-xs font-medium">
                  About SINAG
               </Badge>
               <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  Your trusted online store
               </h1>
               <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                  We're on a mission to make online shopping simple, reliable, and enjoyable for everyone.
               </p>
            </div>
         </div>

         {/* Story Section */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12 sm:mb-16">
            <div className="space-y-4">
               <h2 className="text-2xl sm:text-3xl font-bold">Our Story</h2>
               <p className="text-muted-foreground leading-relaxed">
                  SINAG was born from a simple idea: to create an online marketplace where quality meets convenience.
                  What started as a small passion project has grown into a trusted destination for thousands of
                  customers across the Philippines.
               </p>
               <p className="text-muted-foreground leading-relaxed">
                  We carefully curate every product we offer, ensuring that each item meets our high standards
                  for quality and value. Whether you're shopping for the latest gadgets, fashion, or home essentials,
                  we're here to make your experience seamless.
               </p>
               <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                     <CheckCircle2 className="h-5 w-5 text-primary" />
                     <span>Curated selection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                     <CheckCircle2 className="h-5 w-5 text-primary" />
                     <span>100% satisfaction</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                     <CheckCircle2 className="h-5 w-5 text-primary" />
                     <span>Fast delivery</span>
                  </div>
               </div>
            </div>
            <div className="relative aspect-square lg:aspect-auto lg:h-[300px] w-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl overflow-hidden flex items-center justify-center">
               <div className="text-center p-6">
                  <div className="text-6xl mb-4">🇵🇭</div>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                     Proudly serving customers across the Philippines with quality products and reliable service.
                  </p>
               </div>
            </div>
         </div>

         {/* Values / Features Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            <Card className="hover:shadow-md transition-shadow">
               <CardContent className="p-6 text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                     <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Fast Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                     Get your orders delivered quickly and reliably.
                  </p>
               </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
               <CardContent className="p-6 text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                     <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Secure Shopping</h3>
                  <p className="text-sm text-muted-foreground">
                     Your transactions are safe and protected.
                  </p>
               </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
               <CardContent className="p-6 text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                     <HeadphonesIcon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">24/7 Support</h3>
                  <p className="text-sm text-muted-foreground">
                     We're here to help, anytime you need us.
                  </p>
               </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
               <CardContent className="p-6 text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                     <Package className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Quality Guaranteed</h3>
                  <p className="text-sm text-muted-foreground">
                     Every product is carefully vetted for quality.
                  </p>
               </CardContent>
            </Card>
         </div>

         {/* Mission & Vision */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
            <Card className="border-l-4 border-l-primary">
               <CardContent className="p-6 space-y-2">
                  <div className="flex items-center gap-2">
                     <Sparkles className="h-5 w-5 text-primary" />
                     <h3 className="font-semibold text-lg">Our Mission</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                     To empower Filipino shoppers by providing a trusted, convenient, and enjoyable online shopping
                     experience that brings quality products right to their doorstep.
                  </p>
               </CardContent>
            </Card>
            <Card className="border-l-4 border-l-secondary">
               <CardContent className="p-6 space-y-2">
                  <div className="flex items-center gap-2">
                     <Sparkles className="h-5 w-5 text-secondary" />
                     <h3 className="font-semibold text-lg">Our Vision</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                     To become the most trusted online shopping destination in the Philippines, known for quality,
                     reliability, and exceptional customer service.
                  </p>
               </CardContent>
            </Card>
         </div>

         {/* CTA */}
         <div className="text-center bg-muted/30 rounded-2xl p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Ready to start shopping?</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
               Explore our collection and find your next favorite item today.
            </p>
            <Link href="/products">
               <Button size="lg" className="mt-6">
                  Browse Products
               </Button>
            </Link>
         </div>
      </div>
   )
}