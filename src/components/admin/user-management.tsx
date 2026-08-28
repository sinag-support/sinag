'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Skeleton } from '@/components/ui/skeleton'
import { isEmailValid, isPasswordValid } from '@/lib/validation'
import { Loader2, Plus, Trash2, Search, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<any>(null)
  
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
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (response.ok) {
        // ✅ Check if data is an array (API returns array directly)
        const usersArray = Array.isArray(data) ? data : (data.users || [])
        // ✅ Filter out ADMIN users from the list
        const filteredUsers = usersArray.filter(
          (user: any) => user.role !== 'ADMIN'
        )
        setUsers(filteredUsers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase()
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    )
  })

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

  async function handleEditUser(e: React.FormEvent) {
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

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {}),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update user')
        setIsSubmitting(false)
        return
      }

      setIsEditDialogOpen(false)
      setEditingUser(null)
      setFormData({ email: '', password: '', name: '', role: 'STAFF' })
      setTouched({ email: false, password: false, name: false })
      fetchUsers()
    } catch (error) {
      setError('Failed to update user')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchUsers()
      } else {
        console.error('Failed to delete user')
      }
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36 ml-auto" />
        </div>
        <div className="border rounded-lg overflow-hidden">
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
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          onClick={() => {
            setIsDialogOpen(true)
            setFormData({ email: '', password: '', name: '', role: 'STAFF' })
            setTouched({ email: false, password: false, name: false })
          }}
          className="gap-2 ml-auto"
        >
          <Plus className="h-4 w-4" />
          Add Staff/Rider
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
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
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {search ? 'No users found matching your search' : 'No users found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
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
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUser(user)
                        setFormData({
                          email: user.email,
                          password: '',
                          name: user.name || '',
                          role: user.role,
                        })
                        setTouched({ email: false, password: false, name: false })
                        setIsEditDialogOpen(true)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="edit-name"
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
              <Label htmlFor="edit-email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="edit-email"
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
              <Label htmlFor="edit-password">
                Password 
                <span className="text-xs text-muted-foreground ml-2">(Leave blank to keep current)</span>
              </Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Leave blank to keep current"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onBlur={() => setTouched({ ...touched, password: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role <span className="text-destructive">*</span></Label>
              <select
                id="edit-role"
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
              Update User
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}