'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function NotificationsPage() {
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
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Notifications</h1>
         </div>

         <Card>
            <CardContent className="p-6">
               <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                     <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium">Notification preferences</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                     Manage your notification settings for promotions and order alerts.
                  </p>
               </div>
            </CardContent>
         </Card>
      </div>
   )
}