'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isOTPValid } from '@/lib/validation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function VerifyOTPForm() {
   const searchParams = useSearchParams()
   const router = useRouter()
   const email = searchParams.get('email') || ''
   const [otp, setOtp] = useState('')
   const [isLoading, setIsLoading] = useState(false)
   const [error, setError] = useState('')
   const [success, setSuccess] = useState(false)
   const [timeLeft, setTimeLeft] = useState(600)
   const [isResending, setIsResending] = useState(false)

   useEffect(() => {
      if (timeLeft <= 0) return
      const timer = setInterval(() => {
         setTimeLeft((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
   }, [timeLeft])

   const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, '')
      if (value.length <= 6) {
         setOtp(value)
      }
   }

   async function onSubmit(e: React.FormEvent) {
      e.preventDefault()
      setIsLoading(true)
      setError('')

      if (!isOTPValid(otp)) {
         setError('Please enter a valid 6-digit OTP')
         setIsLoading(false)
         return
      }

      try {
         const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               email,
               otp,
               step: 'verify-otp',
            }),
         })

         const data = await response.json()

         if (!response.ok) {
            setError(data.error || 'Invalid OTP')
            setIsLoading(false)
            return
         }

         setSuccess(true)
         setTimeout(() => {
            window.location.href = '/'
         }, 1500)
      } catch (error) {
         setError('An unexpected error occurred')
         console.error(error)
      } finally {
         setIsLoading(false)
      }
   }

   async function handleResend() {
      if (isResending || timeLeft > 540) return
      setIsResending(true)
      setError('')

      try {
         const response = await fetch('/api/auth/resend-otp', {
            method: 'POST',
         })

         const data = await response.json()

         if (!response.ok) {
            setError(data.error || 'Failed to resend OTP')
            setIsResending(false)
            return
         }

         setTimeLeft(600)
         setError('New OTP sent! Check your email.')
      } catch (error) {
         setError('Failed to resend OTP')
         console.error(error)
      } finally {
         setIsResending(false)
      }
   }

   if (success) {
      return (
         <div className="text-center py-8">
            <div className="rounded-full bg-green-100 p-3 w-16 h-16 mx-auto flex items-center justify-center">
               <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
               </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Email Verified!</h3>
            <p className="text-sm text-muted-foreground mt-2">
               Your account has been created. Redirecting to store...
            </p>
         </div>
      )
   }

   const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <Link
               href="/register"
               className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
               <ArrowLeft className="mr-2 h-4 w-4" />
               Back to Register
            </Link>
         </div>

         <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Verify Email</h1>
            <p className="text-sm text-muted-foreground">
               Enter the 6-digit OTP sent to <span className="font-medium">{email}</span>
            </p>
            <p className="text-xs text-muted-foreground">
               OTP expires in <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
            </p>
         </div>

         <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
               <Label htmlFor="otp">OTP Code <span className="text-destructive">*</span></Label>
               <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={handleOTPChange}
                  maxLength={6}
                  disabled={isLoading}
                  className={otp && !isOTPValid(otp) ? 'border-destructive' : ''}
                  required
               />
               {otp && !isOTPValid(otp) && (
                  <p className="text-sm text-destructive">Please enter a valid 6-digit OTP</p>
               )}
            </div>

            {error && (
               <p className={`text-sm ${error.includes('sent') ? 'text-green-600' : 'text-destructive'}`}>
                  {error}
               </p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Verify OTP
            </Button>

            <div className="text-center">
               <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || timeLeft > 540}
                  className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {isResending ? (
                     <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                  ) : timeLeft > 540 ? (
                     `Resend available in ${formatTime(timeLeft - 540)}`
                  ) : (
                     'Resend OTP'
                  )}
               </button>
            </div>
         </form>
      </div>
   )
}