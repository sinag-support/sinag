"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import type { ControllerRenderProps } from "react-hook-form";

const categorySchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
  } | null;
  onSuccess: () => void;
}

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
    },
  });

  // Reset form when initialData changes (editing)
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        description: initialData.description || "",
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      const url = initialData
        ? `/api/admin/categories/${initialData.id}`
        : "/api/admin/categories";
      const method = initialData ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success(initialData ? "Category updated" : "Category created");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Something went wrong");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // Show skeleton ONLY when editing (loading existing category data)
  if (initialData && !form.formState.isDirty && !form.formState.isValid) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Title</Label>
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Description (optional)</Label>
          <Skeleton className="h-24 w-full" />
        </div>
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
          render={({
            field,
          }: {
            field: ControllerRenderProps<CategoryFormValues, "title">;
          }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Category name"
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
          render={({
            field,
          }: {
            field: ControllerRenderProps<CategoryFormValues, "description">;
          }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description"
                  {...field}
                  className="!bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {initialData ? "Update Category" : "Create Category"}
        </Button>
      </form>
    </Form>
  );
}
