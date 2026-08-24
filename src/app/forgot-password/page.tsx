import Image from 'next/image'
import { ThemeToggle } from '@/components/theme-toggle'
import { ForgotPasswordForm } from './components/forgot-password-form'

export const metadata = {
   title: 'Forgot Password - SINAG',
   description: 'Reset your SINAG account password.',
}

export default function ForgotPasswordPage() {
   return (
      <div className="flex min-h-screen">
         <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-background border-r p-12">
            <div className="flex flex-col items-center text-center space-y-6 max-w-sm">
               <Image
                  src="/sinag.png"
                  alt="SINAG Logo"
                  width={80}
                  height={80}
                  className="h-20 w-auto"
                  priority
               />
               <h1 className="text-3xl font-bold tracking-tight">SINAG</h1>
               <p className="text-sm text-muted-foreground/80 leading-relaxed">
                  Essentials for every kitchen.
               </p>
               <div className="w-16 h-0.5 bg-primary/20 rounded-full mt-2" />
            </div>
            <div className="absolute bottom-8 text-xs text-muted-foreground/60">
               © {new Date().getFullYear()} SINAG. All rights reserved.
            </div>
         </div>

         <div className="flex-1 flex items-center justify-center bg-background p-8">
            <div className="w-full max-w-md space-y-6">
               <div className="flex items-center justify-between lg:hidden">
                  <div className="flex items-center gap-2">
                     <Image
                        src="/sinag.png"
                        alt="SINAG Logo"
                        width={28}
                        height={28}
                        className="h-7 w-auto"
                     />
                     <span className="text-xl font-bold">SINAG</span>
                  </div>
                  <ThemeToggle />
               </div>

               <div className="hidden lg:flex lg:justify-end">
                  <ThemeToggle />
               </div>

               <ForgotPasswordForm />
            </div>
         </div>
      </div>
   )
}