"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

// ✅ Simplified schema - NO .default()
const optionSchema = z.object({
  name: z.string().min(1, "Option name is required"),
  price: z.number().min(0, "Price must be positive"),
  image: z.string().optional(),
  stock: z.number().int().min(0),
});

const productSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  discount: z.number().min(0).max(100),
  stock: z.number().int().min(0),
  isAvailable: z.boolean(),
  categoryId: z.string().optional(),
  images: z.string().optional(),
  options: z.array(optionSchema).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const [categories, setCategories] = useState<{ id: string; title: string }[]>(
    [],
  );
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(!!initialData);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      discount: 0,
      stock: 0,
      isAvailable: true,
      categoryId: "",
      images: "",
      options: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  // Watch the images field for preview
  const imagesValue = form.watch("images");

  // Update image preview when images field changes
  useEffect(() => {
    if (imagesValue && imagesValue.trim() !== "") {
      setImageLoading(true);
      setImagePreview(imagesValue.trim());
      // Simulate image loading
      setTimeout(() => setImageLoading(false), 500);
    } else {
      setImagePreview("");
      setImageLoading(false);
    }
  }, [imagesValue]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Reset form when editing
  useEffect(() => {
    if (!initialData) {
      setIsLoading(false);
      return;
    }
    if (categoriesLoading) return;

    const categoryId = initialData.categoryId ?? "";
    const options =
      initialData.options?.map((opt: any) => ({
        name: opt.name,
        price: Number(opt.price),
        image: opt.image || "",
        stock: Number(opt.stock || 0),
      })) || [];

    const imageUrl = initialData.images?.[0] ?? "";
    setImagePreview(imageUrl);

    form.reset({
      title: initialData.title ?? "",
      description: initialData.description ?? "",
      price: Number(initialData.price ?? 0),
      discount: Number(initialData.discount ?? 0),
      stock: Number(initialData.stock ?? 0),
      isAvailable: Boolean(initialData.isAvailable),
      categoryId: categoryId,
      images: imageUrl,
      options: options,
    });

    setIsLoading(false);
  }, [initialData, form, categoriesLoading]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const payload = {
        ...data,
        categoryId: data.categoryId || undefined,
        images: data.images ? [data.images] : [],
        options: data.options || [],
      };
      const url = initialData
        ? `/api/admin/products/${initialData.id}`
        : "/api/admin/products";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(initialData ? "Product updated" : "Product created");
        onSuccess();
      } else {
        const error = await res.json();
        toast.error(error.error || "Something went wrong");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const clearImage = () => {
    setImagePreview("");
    form.setValue("images", "");
  };

  // Show skeleton ONLY when editing (loading existing product data)
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Title</Label>
          <Skeleton className="h-10 w-full" />
        </div>
        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Description</Label>
          <Skeleton className="h-24 w-full" />
        </div>
        {/* Price & Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Base Price</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Discount %</Label>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        {/* Stock & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Base Stock</Label>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        {/* Image URL */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Image URL</Label>
          <Skeleton className="h-10 w-full" />
        </div>
        {/* Checkbox */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Label className="text-sm font-medium">Available for sale</Label>
        </div>
        {/* Options section */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Product Options / Packages
            </Label>
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-20 w-full" />
        </div>
        {/* Submit button */}
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Product name"
                  {...field}
                  className="!bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Product description"
                  {...field}
                  className="!bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? 0 : Number(val));
                    }}
                    className="!bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount %</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={field.value || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? 0 : Number(val));
                    }}
                    className="!bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    value={field.value || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? 0 : Number(val));
                    }}
                    className="!bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) => {
                    field.onChange(value === "none" ? "" : value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full truncate !bg-background">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent side="bottom" align="start">
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Image URL with Preview */}
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <div className="space-y-3">
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      {...field}
                      className={cn(
                        "w-full !bg-background",
                        imagePreview && "pr-10",
                      )}
                    />
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 !bg-background hover:!bg-accent"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </FormControl>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative rounded-md overflow-hidden border p-2 !bg-background">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                        {imageLoading ? (
                          <Skeleton className="h-full w-full" />
                        ) : (
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {imageLoading ? (
                          <>
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-32" />
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium truncate">
                              Image Preview
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {imagePreview}
                            </p>
                          </>
                        )}
                      </div>
                      {!imageLoading && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearImage}
                          className="text-muted-foreground hover:text-destructive flex-shrink-0 !bg-background hover:!bg-accent"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove image</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              </FormControl>
              <FormLabel className="!mt-0 cursor-pointer">
                Available for sale
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Options */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Product Options / Packages</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="!bg-background hover:!bg-accent"
              onClick={() =>
                append({ name: "", price: 0, image: "", stock: 0 })
              }
            >
              <Plus className="h-4 w-4 mr-1" /> Add Option
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No options added yet.
            </p>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="relative border rounded-lg p-4 space-y-3 !bg-background"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 w-7 p-0 !bg-background hover:!bg-accent"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name={`options.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Option Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 500g Bulk Pack"
                          {...field}
                          className="!bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`options.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? 0 : Number(val));
                          }}
                          className="!bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name={`options.${index}.stock`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? 0 : Number(val));
                          }}
                          className="!bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`options.${index}.image`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        Image URL (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/option.jpg"
                          {...field}
                          className="!bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full">
          {initialData ? "Update Product" : "Create Product"}
        </Button>
      </form>
    </Form>
  );
}
