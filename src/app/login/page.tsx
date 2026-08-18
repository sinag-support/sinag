import { ThemeToggle } from '@/components/theme-toggle'
import { LoginForm } from './components/login-form'

export default function LoginPage() {
   return (
      <div className="flex min-h-screen">
         <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-background border-r p-12">
            <div>
               <span className="text-2xl font-bold">SINAG</span>
            </div>
            <div className="text-sm text-muted-foreground">
               © {new Date().getFullYear()} SINAG. All rights reserved.
            </div>
         </div>

         <div className="flex-1 flex items-center justify-center bg-background p-8">
            <div className="w-full max-w-md space-y-6">
               <div className="flex items-center justify-between lg:hidden">
                  <span className="text-xl font-bold">SINAG</span>
                  <ThemeToggle />
               </div>

               <div className="hidden lg:flex lg:justify-end">
                  <ThemeToggle />
               </div>

               <LoginForm />
            </div>
         </div>
      </div>
   )
}