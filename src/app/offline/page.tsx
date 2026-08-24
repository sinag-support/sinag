'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function OfflinePage() {
   const router = useRouter()
   const [isOnline, setIsOnline] = useState(false)

   useEffect(() => {
      const handleOnline = () => {
         setIsOnline(true)
         // Optionally redirect after a short delay
         setTimeout(() => {
            window.location.href = '/'
         }, 1000)
      }
      const handleOffline = () => setIsOnline(false)

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
         window.removeEventListener('online', handleOnline)
         window.removeEventListener('offline', handleOffline)
      }
   }, [])

   const handleRetry = () => {
      if (navigator.onLine) {
         window.location.href = '/'
      } else {
         // Trigger a page reload to re-check connectivity
         window.location.reload()
      }
   }

   return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
         <div className="max-w-md space-y-6">
            {/* Icon with pulse animation */}
            <div className="relative inline-block">
               <div className="absolute inset-0 rounded-full bg-muted/30 animate-ping" />
               <div className="relative rounded-full bg-muted/50 p-6">
                  <WifiOff className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
               </div>
            </div>

            <div className="space-y-2">
               <h1 className="text-3xl font-bold tracking-tight">You're offline</h1>
               <p className="text-muted-foreground">
                  It looks like you've lost your internet connection.
                  Please check your network settings and try again.
               </p>
            </div>

            {isOnline ? (
               <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-600 dark:text-green-400">
                  <p className="text-sm font-medium">Connection restored! Redirecting...</p>
               </div>
            ) : (
               <Button onClick={handleRetry} className="gap-2" size="lg">
                  Try again
               </Button>
            )}

            <p className="text-xs text-muted-foreground/60 pt-4">
               Some content may be available while you're offline.
            </p>
         </div>
      </div>
   )
}