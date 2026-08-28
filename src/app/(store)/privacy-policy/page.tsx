'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Lock, Eye, FileText } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Your privacy matters to us. Here's how we protect your data.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Data Protection</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use industry-standard encryption and security measures to protect your
                  personal information. All data is stored securely and access is strictly limited.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">What We Collect</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We collect basic information such as your name, email, and shipping address
                  only when you create an account or place an order. We never store payment
                  details directly on our servers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Data Usage</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your information is used solely to process orders, send order updates,
                  and improve your shopping experience. We never sell your data to third parties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Your Rights</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You have the right to access, modify, or delete your personal data at any time.
                  Simply visit your profile settings or contact our support team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}