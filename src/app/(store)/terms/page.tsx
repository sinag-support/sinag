'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Scale, AlertCircle, CheckCircle } from 'lucide-react'

export default function TermsPage() {
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
          Terms of Service
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Terms of Service
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          By using SINAG, you agree to our terms and conditions.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Acceptance of Terms</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  By creating an account or using SINAG, you agree to comply with these terms
                  and conditions. If you do not agree, please refrain from using the platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">User Responsibilities</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You are responsible for maintaining the security of your account and ensuring
                  that all information you provide is accurate and up to date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Ordering & Payments</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All orders are subject to availability and confirmation of payment.
                  We reserve the right to cancel or refuse any order at our discretion.
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
                <h2 className="font-semibold text-lg">Limitation of Liability</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SINAG is not liable for any indirect, incidental, or consequential damages
                  arising from the use of our platform or products.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}