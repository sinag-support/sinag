'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Wallet, Truck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PaymentsPage() {
  const router = useRouter()
  const goBack = () => router.back()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={goBack}
          className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Payment Methods</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium">Available Payment Methods</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              We currently support the following payment options for your orders.
            </p>
          </div>

          <div className="divide-y divide-border rounded-lg border overflow-hidden">
            {/* COD */}
            <div className="flex items-center justify-between p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-muted/50 shrink-0">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Cash on Delivery (COD)</p>
                  <p className="text-xs text-muted-foreground">
                    Pay when your order arrives
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-normal border-primary/30 text-primary">
                Available
              </Badge>
            </div>

            {/* GCash */}
            <div className="flex items-center justify-between p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-muted/50 shrink-0">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">GCash</p>
                    <img
                      src="/gcash.png"
                      alt="GCash"
                      className="h-4 w-auto object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pay via GCash mobile wallet
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-normal border-primary/30 text-primary">
                Available
              </Badge>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">
              💳 More payment options will be added soon. For now, you can pay using 
              <span className="font-medium text-foreground"> Cash on Delivery</span> or 
              <span className="font-medium text-foreground"> GCash</span>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}