"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Layers } from "lucide-react";
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
import { CategoryForm } from "./components/category-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  title: string;
  description: string | null;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) => {
    const searchLower = search.toLowerCase();
    return (
      cat.title.toLowerCase().includes(searchLower) ||
      (cat.description && cat.description.toLowerCase().includes(searchLower))
    );
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/categories/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Category deleted");
        fetchCategories();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Error");
    } finally {
      setDeleteId(null);
    }
  };

  // Skeleton rows for desktop table
  const renderSkeletonRows = () => {
    return Array.from({ length: 4 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-40" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12" />
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
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-12 flex-shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Category Card Component for Mobile - FIXED with truncated description
  const CategoryCard = ({ category }: { category: Category }) => {
    // Truncate description to max 50 characters
    const truncateDescription = (
      text: string | null,
      maxLength: number = 50,
    ) => {
      if (!text) return "No description";
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + "...";
    };

    return (
      <Card className="overflow-hidden !bg-background shadow-none border-border">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{category.title}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {truncateDescription(category.description)}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0 h-5 flex-shrink-0 whitespace-nowrap"
            >
              <Layers className="h-3 w-3 mr-1" />
              {category._count?.products || 0}
            </Badge>
          </div>
          <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 !bg-background hover:!bg-accent flex-shrink-0"
              onClick={() => {
                setEditing(category);
                setDialogOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 w-7 p-0 flex-shrink-0"
              onClick={() => setDeleteId(category.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground">Manage product categories</p>
      </div>

      {/* Search Bar & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full !bg-background"
          />
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="w-full sm:w-auto sm:ml-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-32 inline-block" />
        ) : (
          <>
            {filteredCategories.length}{" "}
            {filteredCategories.length === 1 ? "category" : "categories"} found
            {search && ` matching "${search}"`}
          </>
        )}
      </div>

      {/* Mobile: Cards View */}
      <div className="md:hidden space-y-2">
        {loading ? (
          renderSkeletonCards()
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {search
              ? "No categories found matching your search"
              : "No categories"}
          </div>
        ) : (
          filteredCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))
        )}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Title</TableHead>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead className="min-w-[80px]">Products</TableHead>
                <TableHead className="text-right min-w-[100px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderSkeletonRows()
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {search
                      ? "No categories found matching your search"
                      : "No categories"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.description || "-"}</TableCell>
                    <TableCell>{c._count?.products || 0}</TableCell>
                    <TableCell className="text-right space-x-1 sm:space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="!bg-background hover:!bg-accent h-8 w-8 sm:h-9 sm:w-9 p-0"
                        onClick={() => {
                          setEditing(c);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        onClick={() => setDeleteId(c.id)}
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
        <DialogContent className="w-[95vw] max-w-md !bg-background">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {editing ? "Update category details" : "Add a new category"}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            initialData={editing}
            onSuccess={() => {
              setDialogOpen(false);
              fetchCategories();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* AlertDialog for Delete */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="!bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the category. Products will remain but become
              uncategorized.
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
