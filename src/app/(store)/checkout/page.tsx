'use client'

import dynamic from 'next/dynamic'

// Import the client component with SSR disabled
const CheckoutClient = dynamic(
  () => import('./checkout-client'),
  { 
    ssr: false,
    loading: () => (
      <div className="container mx-auto px-4 py-8 max-w-4xl pb-24 md:pb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 space-y-4 border rounded-lg">
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 border rounded-lg">
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
                  <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
                  <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
          </div>
          <div className="md:col-span-1">
            <div className="p-6 space-y-4 border rounded-lg">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between">
                  <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-3/4 mx-auto bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }
)

export default function CheckoutPage() {
  return <CheckoutClient />
}