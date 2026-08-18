'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog'
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { isEmailValid, isPasswordValid } from '@/lib/validation'
import { Loader2, Plus, Trash2, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'

export function UserManagement() {
   const router = useRouter()
   const [users, setUsers] = useState<any[]>([])
   const [loading, setLoading] = useState(true)
   const [isDialogOpen, setIsDialogOpen] = useState(false)
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [error, setError] = useState('')
   
   const [formData, setFormData] = useState({
      email: '',
      password: '',
      name: '',
      role: 'STAFF' as 'STAFF' | 'RIDER'
   })

   const [touched, setTouched] = useState({
      email: false,
      password: false,
      name: false,
   })

   const emailError = touched.email && formData.email && !isEmailValid(formData.email)
      ? 'Please enter a valid email address'
      : ''

   const isPasswordValidCheck = isPasswordValid(formData.password)
   const passwordErrors = touched.password && formData.password && !isPasswordValidCheck
      ? 'Please meet all password requirements'
      : ''

   useEffect(() => {
      fetchUsers()
   }, [])

   async function fetchUsers() {
      try {
         const response = await fetch('/api/admin/users')
         const data = await response.json()
         
         if (response.ok) {
            setUsers(data.users || [])
         }
      } catch (error) {
         console.error('Error fetching users:', error)
      } finally {
         setLoading(false)
      }
   }

   async function handleCreateUser(e: React.FormEvent) {
      e.preventDefault()
      setIsSubmitting(true)
      setError('')

      if (!formData.name.trim()) {
         setError('Name is required')
         setIsSubmitting(false)
         return
      }

      if (!isEmailValid(formData.email)) {
         setError('Please enter a valid email')
         setIsSubmitting(false)
         return
      }

      if (!isPasswordValidCheck) {
         setError('Please meet all password requirements')
         setIsSubmitting(false)
         return
      }

      try {
         const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               email: formData.email,
               password: formData.password,
               name: formData.name,
               role: formData.role,
            }),
         })

         const data = await response.json()

         if (!response.ok) {
            setError(data.error || 'Failed to create user')
            setIsSubmitting(false)
            return
         }

         setIsDialogOpen(false)
         setFormData({ email: '', password: '', name: '', role: 'STAFF' })
         setTouched({ email: false, password: false, name: false })
         fetchUsers()
      } catch (error) {
         setError('Failed to create user')
         console.error(error)
      } finally {
         setIsSubmitting(false)
      }
   }

   async function handleDeleteUser(userId: string) {
      if (!confirm('Are you sure you want to delete this user?')) return

      try {
         await prisma.user.delete({
            where: { id: userId }
         })
         fetchUsers()
      } catch (error) {
         console.error('Error deleting user:', error)
      }
   }

   const getRoleColor = (role: string) => {
      switch (role) {
         case 'ADMIN': return 'destructive'
         case 'STAFF': return 'default'
         case 'RIDER': return 'secondary'
         default: return 'outline'
      }
   }

   if (loading) {
      return <div className="flex items-center justify-center h-32">Loading users...</div>
   }

   return (
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">User Management</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
               <DialogTrigger>
                  <Button className="gap-2">
                     <Plus className="h-4 w-4" />
                     Add Staff/Rider
                  </Button>
               </DialogTrigger>
               <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                     <DialogTitle>Create Staff or Rider Account</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                        <Input
                           id="name"
                           placeholder="John Doe"
                           value={formData.name}
                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                           onBlur={() => setTouched({ ...touched, name: true })}
                           className={touched.name && !formData.name.trim() ? 'border-destructive' : ''}
                           required
                        />
                        {touched.name && !formData.name.trim() && (
                           <p className="text-sm text-destructive">Name is required</p>
                        )}
                     </div>

                     <div className="space-y-2">
                        <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                        <Input
                           id="email"
                           type="email"
                           placeholder="name@example.com"
                           value={formData.email}
                           onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                           onBlur={() => setTouched({ ...touched, email: true })}
                           className={emailError ? 'border-destructive' : ''}
                           required
                        />
                        {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                     </div>

                     <div className="space-y-2">
                        <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                        <Input
                           id="password"
                           type="password"
                           placeholder="••••••••"
                           value={formData.password}
                           onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                           onBlur={() => setTouched({ ...touched, password: true })}
                           className={passwordErrors ? 'border-destructive' : ''}
                           required
                        />
                        {touched.password && formData.password && (
                           <div className="space-y-1">
                              {[
                                 { id: 'minLength', label: 'At least 8 characters', isValid: formData.password.length >= 8 },
                                 { id: 'uppercase', label: 'One uppercase letter', isValid: /[A-Z]/.test(formData.password) },
                                 { id: 'number', label: 'One number', isValid: /[0-9]/.test(formData.password) },
                                 { id: 'special', label: 'One special character', isValid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
                              ].map((req) => (
                                 <div key={req.id} className="flex items-center gap-2 text-sm">
                                    {req.isValid ? (
                                       <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                       <XCircle className="h-4 w-4 text-destructive" />
                                    )}
                                    <span className={req.isValid ? 'text-green-500' : 'text-muted-foreground'}>
                                       {req.label}
                                    </span>
                                 </div>
                              ))}
                           </div>
                        )}
                        {passwordErrors && <p className="text-sm text-destructive">{passwordErrors}</p>}
                     </div>

                     <div className="space-y-2">
                        <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
                        <select
                           id="role"
                           className="w-full rounded-md border border-input bg-background px-3 py-2"
                           value={formData.role}
                           onChange={(e) => setFormData({ ...formData, role: e.target.value as 'STAFF' | 'RIDER' })}
                        >
                           <option value="STAFF">Staff</option>
                           <option value="RIDER">Rider</option>
                        </select>
                     </div>

                     {error && <p className="text-sm text-destructive">{error}</p>}

                     <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                     </Button>
                  </form>
               </DialogContent>
            </Dialog>
         </div>

         <div className="rounded-md border">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Name</TableHead>
                     <TableHead>Email</TableHead>
                     <TableHead>Role</TableHead>
                     <TableHead>Created</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {users.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                           No users found
                        </TableCell>
                     </TableRow>
                  ) : (
                     users.map((user) => (
                        <TableRow key={user.id}>
                           <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                           <TableCell>{user.email}</TableCell>
                           <TableCell>
                              <Badge variant={getRoleColor(user.role)}>
                                 {user.role}
                              </Badge>
                           </TableCell>
                           <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                           </TableCell>
                           <TableCell className="text-right">
                              {user.role !== 'ADMIN' && (
                                 <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-destructive hover:text-destructive"
                                 >
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              )}
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </div>
      </div>
   )
}