'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, RefreshCw, Clock, AlertCircle } from 'lucide-react'

export default function ReturnsPolicyPage() {
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
          Returns Policy
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Returns & Refunds
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          We want you to be completely satisfied with your purchase.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Return Window</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You may return items within 7 days of delivery for a full refund or exchange.
                  Items must be in their original condition and packaging.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Eligibility</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Items that are defective, damaged during shipping, or incorrect are eligible
                  for return. Personalized or intimate items may not be eligible unless faulty.
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
                <h2 className="font-semibold text-lg">Refund Process</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Refunds are processed within 5-7 business days after we receive your return.
                  The refund will be issued to your original payment method.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">How to Initiate a Return</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To initiate a return, please contact our support team at support@sinag.com
                  with your order number and the reason for return. We'll guide you through the process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}