import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
   return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
         <h1 className="text-4xl font-bold">You're offline</h1>
         <p className="text-muted-foreground mt-2">Please check your internet connection.</p>
         <Button className="mt-6">
            <Link href="/">Try again</Link>
         </Button>
      </div>
   )
}