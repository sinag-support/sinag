'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
   User, Package, Heart, LogOut, Settings, 
   Mail, Phone, MapPin, ArrowLeft 
} from 'lucide-react'

export default function ProfilePage() {
   const router = useRouter()
   const [user, setUser] = useState<any>(null)
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
         setUser(user)
         setName(user.user_metadata?.name || '')
         setEmail(user.email || '')
         setLoading(false)
      }
      fetchUser()
   }, [router])

   const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/')
   }

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

   if (loading) {
      return (
         <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
         </div>
      )
   }

   const getInitials = (name: string) => {
      if (!name) return 'U'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
   }

   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-4xl">
         {/* Header */}
         <div className="flex items-center gap-3 mb-6">
            <Link
               href="/"
               className="hidden sm:inline-flex text-muted-foreground hover:text-foreground transition-colors"
            >
               <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold">My Profile</h1>
         </div>

         {/* Profile Card */}
         <Card className="mb-6">
            <CardContent className="p-6 flex items-center gap-4">
               <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                     {getInitials(name || user?.email || '')}
                  </AvatarFallback>
               </Avatar>
               <div>
                  <h2 className="text-xl font-semibold">{name || 'User'}</h2>
                  <p className="text-sm text-muted-foreground">{email}</p>
               </div>
            </CardContent>
         </Card>

         {/* Tabs */}
         <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
               <TabsTrigger value="settings">Settings</TabsTrigger>
               <TabsTrigger value="orders">Orders</TabsTrigger>
               <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings">
               <Card>
                  <CardContent className="p-6 space-y-4">
                     <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="name">Full Name</Label>
                           <Input
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Your name"
                              disabled={isUpdating}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="email">Email</Label>
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
                        <Button type="submit" disabled={isUpdating}>
                           {isUpdating ? 'Saving...' : 'Save Changes'}
                        </Button>
                     </form>
                  </CardContent>
               </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
               <Card>
                  <CardContent className="p-6">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">My Orders</h3>
                        <Link href="/orders" className="text-sm text-primary hover:underline">
                           View all
                        </Link>
                     </div>
                     <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3" />
                        <p>You have no orders yet.</p>
                        <Link href="/products" className="text-sm text-primary hover:underline mt-2 inline-block">
                           Start shopping
                        </Link>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
               <Card>
                  <CardContent className="p-6">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Wishlist</h3>
                        <Link href="/wishlist" className="text-sm text-primary hover:underline">
                           View all
                        </Link>
                     </div>
                     <div className="text-center py-8 text-muted-foreground">
                        <Heart className="h-12 w-12 mx-auto mb-3" />
                        <p>Your wishlist is empty.</p>
                        <Link href="/products" className="text-sm text-primary hover:underline mt-2 inline-block">
                           Explore products
                        </Link>
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>
         </Tabs>

         {/* Logout Button */}
         <div className="mt-6">
            <Button
               variant="destructive"
               className="w-full sm:w-auto"
               onClick={handleLogout}
            >
               <LogOut className="h-4 w-4 mr-2" />
               Logout
            </Button>
         </div>
      </div>
   )
}