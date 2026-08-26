'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface Banner {
  id: string
  title: string
  image: string
  link: string | null
  active: boolean
  order: number
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/banners')
      const data = await res.json()
      setBanners(data)
    } catch {
      toast.error('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  // Filter banners based on search
  const filteredBanners = banners.filter(banner => {
    const searchLower = search.toLowerCase()
    return (
      banner.title.toLowerCase().includes(searchLower) ||
      (banner.link && banner.link.toLowerCase().includes(searchLower))
    )
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const image = formData.get('image') as string
    const link = formData.get('link') as string || null
    const order = parseInt(formData.get('order') as string) || 0

    if (!title || !image) {
      toast.error('Title and image URL are required')
      return
    }

    try {
      const url = editing
        ? `/api/admin/banners/${editing.id}`
        : '/api/admin/banners'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, image, link, order }),
      })
      if (res.ok) {
        toast.success(editing ? 'Banner updated' : 'Banner created')
        setDialogOpen(false)
        fetchBanners()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Something went wrong')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/banners/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Banner deleted')
        fetchBanners()
      } else {
        toast.error('Failed to delete')
      }
    } catch {
      toast.error('Error')
    } finally {
      setDeleteId(null)
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !current }),
      })
      if (res.ok) {
        toast.success('Banner updated')
        fetchBanners()
      } else {
        toast.error('Failed to update')
      }
    } catch {
      toast.error('Error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Banners</h1>
        <p className="text-muted-foreground">Manage homepage carousel banners</p>
      </div>

      {/* Search Bar & Add Button - Inline */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search banners by title or link..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          className="ml-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Banner
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBanners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search ? 'No banners found matching your search' : 'No banners'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBanners.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <img
                        src={b.image}
                        alt={b.title}
                        className="h-12 w-20 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>{b.title}</TableCell>
                    <TableCell>{b.link || '-'}</TableCell>
                    <TableCell>{b.order}</TableCell>
                    <TableCell>
                      <Switch
                        checked={b.active}
                        onCheckedChange={() => toggleActive(b.id, b.active)}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(b)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(b.id)}
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
      )}

      {/* Create/Edit Dialog - Fixed spacing */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Banner' : 'Create Banner'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter banner title"
                defaultValue={editing?.title || ''}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm font-medium">
                Image URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="image"
                name="image"
                placeholder="https://example.com/image.jpg"
                defaultValue={editing?.image || ''}
                required
              />
              {editing?.image && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                  <img
                    src={editing.image}
                    alt="Preview"
                    className="h-20 w-full object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="link" className="text-sm font-medium">
                Link URL <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="link"
                name="link"
                placeholder="/products or https://example.com"
                defaultValue={editing?.link || ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order" className="text-sm font-medium">
                Display Order
              </Label>
              <Input
                id="order"
                name="order"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={editing?.order || 0}
              />
            </div>

            <Button type="submit" className="w-full">
              {editing ? 'Update Banner' : 'Create Banner'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the banner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}