'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, User, Mail, Save } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsPage() {
   const router = useRouter()
   const [loading, setLoading] = useState(true)
   const [name, setName] = useState('')
   const [email, setEmail] = useState('')
   const [isUpdating, setIsUpdating] = useState(false)
   const [updateMessage, setUpdateMessage] = useState('')

   useEffect(() => {
      const fetchUser = async () => {
         const { data: { user } } = await supabase.auth.getUser()
         if (!user) {
            router.push('/login')
            return
         }
         setName(user.user_metadata?.name || '')
         setEmail(user.email || '')
         setLoading(false)
      }
      fetchUser()
   }, [router])

   const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsUpdating(true)
      setUpdateMessage('')

      try {
         const { error } = await supabase.auth.updateUser({
            data: { name },
         })
         if (error) throw error
         setUpdateMessage('Profile updated successfully!')
      } catch (error: any) {
         setUpdateMessage(error.message || 'Failed to update')
      } finally {
         setIsUpdating(false)
      }
   }

   const goBack = () => router.back()

   if (loading) {
      return (
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
               <Skeleton className="md:hidden h-5 w-5 rounded" />
               <Skeleton className="h-8 w-32" />
            </div>
            <Card>
               <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-24" />
               </CardContent>
            </Card>
         </div>
      )
   }

   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-3xl">
         {/* Header – back button only on mobile */}
         <div className="flex items-center gap-3 mb-8">
            <button
               onClick={goBack}
               className="md:hidden inline-flex text-muted-foreground hover:text-foreground transition-colors"
               aria-label="Go back"
            >
               <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Settings</h1>
         </div>

         {/* Form Card */}
         <Card>
            <CardContent className="p-6 space-y-4">
               <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Full Name
                     </Label>
                     <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        disabled={isUpdating}
                        className="focus:ring-2 focus:ring-primary/20"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email
                     </Label>
                     <Input
                        id="email"
                        value={email}
                        disabled
                        className="bg-muted"
                     />
                     <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  {updateMessage && (
                     <p className={`text-sm ${updateMessage.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                        {updateMessage}
                     </p>
                  )}
                  <Button type="submit" disabled={isUpdating} className="gap-2">
                     <Save className="h-4 w-4" />
                     {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
               </form>
            </CardContent>
         </Card>
      </div>
   )
}