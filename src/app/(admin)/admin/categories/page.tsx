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

  const renderSkeletonCards = () => {
    return Array.from({ length: 4 }).map((_, i) => (
      <Card
        key={i}
        className="overflow-hidden !bg-background shadow-none box-border w-auto mx-0.5 rounded-xl min-w-0"
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="flex-1 min-w-0 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-12 flex-shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border">
            <Skeleton className="h-7 w-7 rounded-sm" />
            <Skeleton className="h-7 w-7 rounded-sm" />
          </div>
        </CardContent>
      </Card>
    ));
  };

  const CategoryCard = ({ category }: { category: Category }) => {
    return (
      <Card className="overflow-hidden !bg-background shadow-none box-border w-auto mx-0.5 rounded-xl min-w-0">
        <CardContent className="p-3 min-w-0">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate max-w-full">
                {category.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 break-words leading-relaxed mt-0.5">
                {category.description || "No description"}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0 h-5 flex-shrink-0 whitespace-nowrap rounded-sm"
            >
              <Layers className="h-3 w-3 mr-1 flex-shrink-0" />
              {category._count?.products || 0}
            </Badge>
          </div>
          <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 !bg-background hover:!bg-accent flex-shrink-0 rounded-sm"
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
              className="h-7 w-7 p-0 flex-shrink-0 rounded-sm"
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
    <div className="space-y-6 w-full max-w-full overflow-hidden box-border">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
          Categories
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage product categories
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full min-w-0 box-border">
        <div className="relative flex-1 min-w-0 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full !bg-background rounded-md"
          />
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="w-full sm:w-auto sm:ml-auto flex-shrink-0 rounded-md"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="text-sm text-muted-foreground truncate">
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

      {/* Mobile Card Layout with 1px margin inset */}
      <div className="md:hidden space-y-2 w-full min-w-0 box-border">
        {loading ? (
          renderSkeletonCards()
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
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

      <div className="hidden md:block border border-border rounded-md overflow-hidden w-full max-w-full box-border">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] [scrollbar-width:none]">
          <Table className="w-full">
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
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {c.title}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {c.description || "-"}
                    </TableCell>
                    <TableCell>{c._count?.products || 0}</TableCell>
                    <TableCell className="text-right space-x-1 sm:space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="!bg-background hover:!bg-accent h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-sm"
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
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-sm"
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[90vw] max-w-md !bg-background rounded-md [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] [scrollbar-width:none]">
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

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="w-[90vw] max-w-md !bg-background rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the category. Products will remain but become
              uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="!bg-background hover:!bg-accent mt-0 rounded-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-sm">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
