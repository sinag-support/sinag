"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isEmailValid, isPasswordValid } from "@/lib/validation";
import { Loader2, Plus, Trash2, Search, Pencil, X, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type UserRole = "STAFF" | "RIDER" | "ADMIN";

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
  createdAt: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    name: "",
    role: "STAFF" as "STAFF" | "RIDER",
  });

  const [touched, setTouched] = useState({
    email: false,
    phone: false,
    password: false,
    name: false,
  });

  const emailError =
    touched.email && formData.email && !isEmailValid(formData.email)
      ? "Please enter a valid email address"
      : "";

  const isPasswordValidCheck = isPasswordValid(formData.password);
  const passwordErrors =
    touched.password && formData.password && !isPasswordValidCheck
      ? "Please meet all password requirements"
      : "";

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (response.ok) {
        const usersArray = Array.isArray(data) ? data : data.users || [];
        const filteredUsers = usersArray.filter(
          (user: any) => user.role !== "ADMIN",
        );
        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      user.name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.phone && user.phone.toLowerCase().includes(searchLower)) ||
      user.role.toLowerCase().includes(searchLower);

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      setIsSubmitting(false);
      return;
    }

    if (!isEmailValid(formData.email)) {
      setError("Please enter a valid email");
      setIsSubmitting(false);
      return;
    }

    if (!isPasswordValidCheck) {
      setError("Please meet all password requirements");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          name: formData.name,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create user");
        setIsSubmitting(false);
        return;
      }

      setIsDialogOpen(false);
      setFormData({
        email: "",
        phone: "",
        password: "",
        name: "",
        role: "STAFF",
      });
      setTouched({ email: false, phone: false, password: false, name: false });
      fetchUsers();
    } catch (error) {
      setError("Failed to create user");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      setIsSubmitting(false);
      return;
    }

    if (!isEmailValid(formData.email)) {
      setError("Please enter a valid email");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${editingUser?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          role: formData.role,
          ...(formData.password ? { password: formData.password } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update user");
        setIsSubmitting(false);
        return;
      }

      setIsEditDialogOpen(false);
      setEditingUser(null);
      setFormData({
        email: "",
        phone: "",
        password: "",
        name: "",
        role: "STAFF",
      });
      setTouched({ email: false, phone: false, password: false, name: false });
      fetchUsers();
    } catch (error) {
      setError("Failed to update user");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/users/${deleteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
        setDeleteId(null);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An unexpected error occurred while deleting the user");
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "STAFF":
        return "default";
      case "RIDER":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Skeleton rows for table
  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
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

  const userCounts = {
    all: users.length,
    STAFF: users.filter((u) => u.role === "STAFF").length,
    RIDER: users.filter((u) => u.role === "RIDER").length,
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter, and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, phone, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full !bg-background"
          />
        </div>

        <Tabs
          value={roleFilter}
          onValueChange={setRoleFilter}
          className="w-auto"
        >
          <TabsList className="bg-background border border-border p-1 rounded-lg w-auto h-8">
            <TabsTrigger
              value="all"
              className="text-xs px-3 py-1 rounded-md font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All ({userCounts.all})
            </TabsTrigger>
            <TabsTrigger
              value="STAFF"
              className="text-xs px-3 py-1 rounded-md font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Staff ({userCounts.STAFF})
            </TabsTrigger>
            <TabsTrigger
              value="RIDER"
              className="text-xs px-3 py-1 rounded-md font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Rider ({userCounts.RIDER})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={() => {
            setIsDialogOpen(true);
            setFormData({
              email: "",
              phone: "",
              password: "",
              name: "",
              role: "STAFF",
            });
            setTouched({
              email: false,
              phone: false,
              password: false,
              name: false,
            });
          }}
          className="w-full sm:w-auto sm:ml-auto gap-2"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="text-sm text-muted-foreground">
          {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}{" "}
          found
          {roleFilter !== "all" && ` with role ${roleFilter}`}
          {search && ` matching "${search}"`}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              renderSkeletonRows()
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {search || roleFilter !== "all"
                    ? "No users found matching your filters"
                    : "No users found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.avatar || undefined}
                          alt={user.name || user.email}
                        />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="!bg-background hover:!bg-accent h-8 w-8 p-0"
                      onClick={() => {
                        setEditingUser(user);
                        setFormData({
                          email: user.email,
                          phone: user.phone || "",
                          password: "",
                          name: user.name || "",
                          role:
                            user.role === "STAFF" || user.role === "RIDER"
                              ? user.role
                              : "STAFF",
                        });
                        setTouched({
                          email: false,
                          phone: false,
                          password: false,
                          name: false,
                        });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-8 w-8 p-0 !bg-background hover:!bg-destructive/10"
                      onClick={() => setDeleteId(user.id)}
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
        <DialogContent className="sm:max-w-[425px] !bg-background">
          <DialogHeader>
            <DialogTitle>Create User Account</DialogTitle>
            <DialogDescription>
              Add a new staff or rider user to the system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                onBlur={() => setTouched({ ...touched, name: true })}
                className={cn(
                  "!bg-background",
                  touched.name && !formData.name.trim()
                    ? "border-destructive"
                    : "",
                )}
                required
              />
              {touched.name && !formData.name.trim() && (
                <p className="text-sm text-destructive">Name is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                onBlur={() => setTouched({ ...touched, email: true })}
                className={cn(
                  "!bg-background",
                  emailError ? "border-destructive" : "",
                )}
                required
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+63 912 345 6789"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                onBlur={() => setTouched({ ...touched, phone: true })}
                className="!bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                onBlur={() => setTouched({ ...touched, password: true })}
                className={cn(
                  "!bg-background",
                  passwordErrors ? "border-destructive" : "",
                )}
                required
              />
              {touched.password && formData.password && (
                <div className="space-y-1">
                  {[
                    {
                      id: "minLength",
                      label: "At least 8 characters",
                      isValid: formData.password.length >= 8,
                    },
                    {
                      id: "uppercase",
                      label: "One uppercase letter",
                      isValid: /[A-Z]/.test(formData.password),
                    },
                    {
                      id: "number",
                      label: "One number",
                      isValid: /[0-9]/.test(formData.password),
                    },
                    {
                      id: "special",
                      label: "One special character",
                      isValid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
                    },
                  ].map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {req.isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={
                          req.isValid
                            ? "text-green-500"
                            : "text-muted-foreground"
                        }
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {passwordErrors && (
                <p className="text-sm text-destructive">{passwordErrors}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as "STAFF" | "RIDER" })
                }
              >
                <SelectTrigger className="w-full !bg-background">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="!bg-background">
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="RIDER">Rider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Account
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] !bg-background">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                onBlur={() => setTouched({ ...touched, name: true })}
                className={cn(
                  "!bg-background",
                  touched.name && !formData.name.trim()
                    ? "border-destructive"
                    : "",
                )}
                required
              />
              {touched.name && !formData.name.trim() && (
                <p className="text-sm text-destructive">Name is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                onBlur={() => setTouched({ ...touched, email: true })}
                className={cn(
                  "!bg-background",
                  emailError ? "border-destructive" : "",
                )}
                required
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-sm font-medium">
                Phone Number{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="+63 912 345 6789"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                onBlur={() => setTouched({ ...touched, phone: true })}
                className="!bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password" className="text-sm font-medium">
                Password
                <span className="text-xs text-muted-foreground ml-2">
                  (Leave blank to keep current)
                </span>
              </Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Leave blank to keep current"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                onBlur={() => setTouched({ ...touched, password: true })}
                className="!bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-sm font-medium">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as "STAFF" | "RIDER" })
                }
              >
                <SelectTrigger className="w-full !bg-background">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="!bg-background">
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="RIDER">Rider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update User
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="!bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="!bg-background hover:!bg-accent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
