'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isEmailValid } from '@/lib/validation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ForgotPasswordForm() {
   const router = useRouter()
   const [isLoading, setIsLoading] = useState(false)
   const [email, setEmail] = useState('')
   const [error, setError] = useState('')
   const [success, setSuccess] = useState(false)
   const [emailError, setEmailError] = useState('')

   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setEmail(value)
      if (value && !isEmailValid(value)) {
         setEmailError('Please enter a valid email address')
      } else {
         setEmailError('')
      }
   }

   async function onSubmit(e: React.FormEvent) {
      e.preventDefault()
      setIsLoading(true)
      setError('')

      if (!isEmailValid(email)) {
         setEmailError('Please enter a valid email address')
         setIsLoading(false)
         return
      }

      try {
         const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
         })

         const data = await response.json()

         if (!response.ok) {
            setError(data.error || 'Something went wrong')
            setIsLoading(false)
            return
         }

         setSuccess(true)
         router.push(`/verify-otp?email=${encodeURIComponent(email)}&mode=reset`)
      } catch (error) {
         setError('An unexpected error occurred')
         console.error(error)
      } finally {
         setIsLoading(false)
      }
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <Link
               href="/login"
               className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
               <ArrowLeft className="mr-2 h-4 w-4" />
               Back to Login
            </Link>
         </div>

         <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Forgot Password</h1>
            <p className="text-sm text-muted-foreground">
               Enter your email address and we'll send you a code to reset your password.
            </p>
         </div>

         {success ? (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-lg text-center">
               <p className="text-green-700 dark:text-green-300 font-medium">
                  OTP sent to your email!
               </p>
               <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Redirecting to verification...
               </p>
            </div>
         ) : (
            <form onSubmit={onSubmit} className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                     Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                     id="email"
                     type="email"
                     placeholder="name@example.com"
                     value={email}
                     onChange={handleEmailChange}
                     disabled={isLoading}
                     className={emailError ? 'border-destructive focus-visible:ring-destructive' : ''}
                     required
                  />
                  {emailError && (
                     <p className="text-sm text-destructive">{emailError}</p>
                  )}
               </div>

               {error && (
                  <p className="text-sm text-destructive">{error}</p>
               )}

               <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Code
               </Button>
            </form>
         )}
      </div>
   )
}