'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Truck, Clock, MapPin, Package } from 'lucide-react'

export default function ShippingPolicyPage() {
  const router = useRouter()

  const goBack = () => {
    router.back()
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-4xl">
      {/* Back button - only visible on mobile */}
      <button
        onClick={goBack}
        className="md:hidden inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>

      <div className="text-center space-y-4 mb-8 sm:mb-12">
        <Badge variant="outline" className="px-4 py-1 text-xs font-medium">
          Shipping Policy
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Shipping Policy
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          We aim to deliver your orders quickly and reliably.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Delivery Time</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Orders are typically delivered within 2-5 business days within Metro Manila,
                  and 3-7 business days for provincial areas. Delivery times may vary depending
                  on your location and the courier service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Order Processing</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Orders are processed within 1-2 business days after payment confirmation.
                  You will receive a tracking number once your order has been shipped.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Shipping Locations</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We currently ship to all locations within the Philippines. International shipping
                  is not yet available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Shipping Fees</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Shipping fees are calculated at checkout based on your location and order weight.
                  Free shipping is available for orders over ₱1,000.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}