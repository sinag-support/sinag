"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image: string;
  link: string | null;
  active: boolean;
  order: number;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();
      setBanners(data);
    } catch {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const filteredBanners = banners.filter((banner) => {
    const searchLower = search.toLowerCase();
    return (
      banner.title.toLowerCase().includes(searchLower) ||
      (banner.description &&
        banner.description.toLowerCase().includes(searchLower)) ||
      (banner.link && banner.link.toLowerCase().includes(searchLower))
    );
  });

  // Update image preview when editing
  useEffect(() => {
    if (editing?.image) {
      setImageLoading(true);
      setImagePreview(editing.image);
      setTimeout(() => setImageLoading(false), 300);
    } else {
      setImagePreview("");
      setImageLoading(false);
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const image = formData.get("image") as string;
    const link = (formData.get("link") as string) || null;
    const order = parseInt(formData.get("order") as string) || 0;

    if (!title || !image) {
      toast.error("Title and image URL are required");
      return;
    }

    try {
      const url = editing
        ? `/api/admin/banners/${editing.id}`
        : "/api/admin/banners";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, image, link, order }),
      });
      if (res.ok) {
        toast.success(editing ? "Banner updated" : "Banner created");
        setDialogOpen(false);
        fetchBanners();
      } else {
        const err = await res.json();
        toast.error(err.error || "Something went wrong");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/banners/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Banner deleted");
        fetchBanners();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Error");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !current }),
      });
      if (res.ok) {
        toast.success("Banner updated");
        fetchBanners();
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Error");
    }
  };

  // Skeleton rows for table
  const renderSkeletonRows = () => {
    return Array.from({ length: 4 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <Skeleton className="h-12 w-20 rounded" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-40" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-8" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-12" />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  // Skeleton cards for mobile
  const renderSkeletonCards = () => {
    return Array.from({ length: 4 }).map((_, i) => (
      <Card
        key={i}
        className="overflow-hidden !bg-background shadow-none border-border"
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-16 w-24 rounded flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Banner Card Component for Mobile - FIXED with truncated description
  const BannerCard = ({ banner }: { banner: Banner }) => {
    // Truncate description to max 40 characters
    const truncateText = (text: string | null, maxLength: number = 40) => {
      if (!text) return "No description";
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + "...";
    };

    // Truncate link to max 30 characters
    const truncateLink = (text: string | null, maxLength: number = 30) => {
      if (!text) return null;
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + "...";
    };

    return (
      <Card className="overflow-hidden !bg-background shadow-none border-border">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Image */}
            <div className="h-16 w-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {banner.image ? (
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{banner.title}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {truncateText(banner.description)}
              </p>
              {banner.link && (
                <div className="flex items-center gap-1 mt-0.5">
                  <LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground truncate">
                    {truncateLink(banner.link)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Badge
                variant={banner.active ? "default" : "secondary"}
                className="text-[10px] px-2 py-0 h-5 flex-shrink-0 whitespace-nowrap"
              >
                {banner.active ? "Active" : "Inactive"}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0 h-5 flex-shrink-0 whitespace-nowrap"
              >
                Order: {banner.order}
              </Badge>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 !bg-background hover:!bg-accent flex-shrink-0"
                onClick={() => {
                  setEditing(banner);
                  setDialogOpen(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() => setDeleteId(banner.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Banners</h1>
        <p className="text-muted-foreground">
          Manage homepage carousel banners
        </p>
      </div>

      {/* Search Bar & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search banners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full !bg-background"
          />
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setImagePreview("");
            setDialogOpen(true);
          }}
          className="w-full sm:w-auto sm:ml-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Banner
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-32 inline-block" />
        ) : (
          <>
            {filteredBanners.length}{" "}
            {filteredBanners.length === 1 ? "banner" : "banners"} found
            {search && ` matching "${search}"`}
          </>
        )}
      </div>

      {/* Mobile: Cards View */}
      <div className="md:hidden space-y-2">
        {loading ? (
          renderSkeletonCards()
        ) : filteredBanners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search ? "No banners found matching your search" : "No banners"}
          </div>
        ) : (
          filteredBanners.map((banner) => (
            <BannerCard key={banner.id} banner={banner} />
          ))
        )}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Image</TableHead>
                <TableHead className="min-w-[120px]">Title</TableHead>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead className="min-w-[150px]">Link</TableHead>
                <TableHead className="min-w-[60px]">Order</TableHead>
                <TableHead className="min-w-[80px]">Active</TableHead>
                <TableHead className="text-right min-w-[100px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderSkeletonRows()
              ) : filteredBanners.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {search
                      ? "No banners found matching your search"
                      : "No banners"}
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
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {b.description || "-"}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {b.link || "-"}
                    </TableCell>
                    <TableCell>{b.order}</TableCell>
                    <TableCell>
                      <Switch
                        checked={b.active}
                        onCheckedChange={() => toggleActive(b.id, b.active)}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-1 sm:space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="!bg-background hover:!bg-accent h-8 w-8 sm:h-9 sm:w-9 p-0"
                        onClick={() => {
                          setEditing(b);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0"
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
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto !bg-background">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Banner" : "Create Banner"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update banner details"
                : "Add a new banner to the carousel"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter banner title"
                  defaultValue={editing?.title || ""}
                  className="!bg-background"
                  required
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
                  className="!bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter banner description"
                defaultValue={editing?.description || ""}
                className="!bg-background"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-medium">
                  Image URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="image"
                  name="image"
                  placeholder="https://example.com/image.jpg"
                  defaultValue={editing?.image || ""}
                  className="!bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link" className="text-sm font-medium">
                  Link URL{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="link"
                  name="link"
                  placeholder="/products or https://example.com"
                  defaultValue={editing?.link || ""}
                  className="!bg-background"
                />
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Preview:</p>
                <div className="relative h-32 w-full rounded-md overflow-hidden border !bg-background">
                  {imageLoading ? (
                    <Skeleton className="h-full w-full" />
                  ) : (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full">
              {editing ? "Update Banner" : "Create Banner"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="!bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              banner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="!bg-background hover:!bg-accent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
