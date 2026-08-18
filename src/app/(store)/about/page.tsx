import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
   title: 'About Us - SINAG',
   description: 'Learn about SINAG, your trusted online store.',
}

export default function AboutPage() {
   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
         <div className="space-y-6 sm:space-y-8">
            <div>
               <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">About SINAG</h1>
               <p className="text-base sm:text-lg text-muted-foreground mt-1 sm:mt-2">
                  Your trusted online store for quality products.
               </p>
            </div>

            <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
               <p>
                  SINAG is a modern e-commerce platform dedicated to providing
                  customers with a seamless shopping experience. We offer a
                  curated selection of high-quality products across multiple
                  categories, including electronics, fashion, home essentials,
                  and more.
               </p>
               <p>
                  Our mission is to bring convenience and reliability to online
                  shopping, with a focus on customer satisfaction and fast
                  delivery.
               </p>
               <p>
                  We believe in transparency, quality, and building trust with
                  every order. Whether you're looking for the latest gadgets,
                  stylish apparel, or everyday essentials, SINAG has you covered.
               </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
               <Card>
                  <CardContent className="p-4 sm:p-6 text-center space-y-1 sm:space-y-2">
                     <div className="text-3xl sm:text-4xl">🚀</div>
                     <h3 className="font-semibold text-sm sm:text-base">Fast Delivery</h3>
                     <p className="text-xs sm:text-sm text-muted-foreground">
                        Get your orders delivered quickly and reliably.
                     </p>
                  </CardContent>
               </Card>
               <Card>
                  <CardContent className="p-4 sm:p-6 text-center space-y-1 sm:space-y-2">
                     <div className="text-3xl sm:text-4xl">🛡️</div>
                     <h3 className="font-semibold text-sm sm:text-base">Secure Shopping</h3>
                     <p className="text-xs sm:text-sm text-muted-foreground">
                        Your transactions are safe and protected.
                     </p>
                  </CardContent>
               </Card>
               <Card>
                  <CardContent className="p-4 sm:p-6 text-center space-y-1 sm:space-y-2">
                     <div className="text-3xl sm:text-4xl">💬</div>
                     <h3 className="font-semibold text-sm sm:text-base">24/7 Support</h3>
                     <p className="text-xs sm:text-sm text-muted-foreground">
                        We're here to help, anytime you need us.
                     </p>
                  </CardContent>
               </Card>
            </div>

            <div className="text-center pt-6 sm:pt-8 border-t">
               <h2 className="text-xl sm:text-2xl font-semibold">Ready to start shopping?</h2>
               <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                  Explore our collection and find your next favorite item.
               </p>
               <Link href="/products">
                  <Button className="mt-4">Browse Products</Button>
               </Link>
            </div>
         </div>
      </div>
   )
}