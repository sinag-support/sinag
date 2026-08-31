"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ProductForm } from "./components/product-form";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  price: number;
  discount: number;
  stock: number;
  isAvailable: boolean;
  category?: { id: string; title: string } | null;
  images: string[];
  options?: { id: string; name: string; price: number }[];
  createdAt: string;
}

interface Category {
  id: string;
  title: string;
}

interface PaginatedResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      if (selectedCategory !== "all") {
        url += `&categoryId=${encodeURIComponent(selectedCategory)}`;
      }
      const res = await fetch(url);
      const data: PaginatedResponse = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/products/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Error");
    } finally {
      setDeleteId(null);
    }
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getCategoryTitle = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.title || id;
  };

  // Show loading skeletons only for the table rows
  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <div className="flex items-center gap-2 min-w-[120px]">
            <Skeleton className="w-10 h-10 rounded flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-12" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-20" />
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">Manage your product catalog</p>
      </div>

      {/* Search, Category Filter, and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full !bg-background"
          />
        </div>

        <div className="w-full sm:w-[200px]">
          <Select
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value)}
          >
            <SelectTrigger className="w-full !bg-background">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="!bg-background">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => {
            setEditingProduct(null);
            setDialogOpen(true);
          }}
          className="w-full sm:w-auto sm:ml-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Results count - Always visible with loading state */}
      <p className="text-sm text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-48 inline-block" />
        ) : (
          <>
            {total} {total === 1 ? "product" : "products"} found
            {selectedCategory !== "all" &&
              ` in ${getCategoryTitle(selectedCategory)}`}
            {search && ` matching "${search}"`}
          </>
        )}
      </p>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Options</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderSkeletonRows()
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {search || selectedCategory !== "all"
                      ? "No products found matching your filters"
                      : "No products found"}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <Package className="h-10 w-10 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{p.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.category?.title || "Uncategorized"}
                    </TableCell>
                    <TableCell>₱{p.price.toFixed(2)}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      {p.options && p.options.length > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <Layers className="h-3 w-3" />
                                {p.options.length}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                {p.options.map((opt) => (
                                  <div
                                    key={opt.id}
                                    className="text-xs flex justify-between gap-4"
                                  >
                                    <span>{opt.name}</span>
                                    <span className="font-medium">
                                      ₱{opt.price.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isAvailable ? "default" : "secondary"}>
                        {p.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="!bg-background hover:!bg-accent"
                        onClick={() => {
                          setEditingProduct(p);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(p.id)}
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

      {/* Pagination - Always visible with loading state */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 py-2">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-4 w-32 inline-block" />
            ) : (
              `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, total)} of ${total}`
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1 || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    disabled={loading}
                    className="h-8 w-8 p-0 text-sm"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages || loading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto scrollbar-hide !bg-background">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Create Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update product details"
                : "Add a new product to the store"}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-hidden">
            <ProductForm
              initialData={editingProduct}
              onSuccess={() => {
                setDialogOpen(false);
                fetchProducts();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog for Delete */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="!bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product.
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
