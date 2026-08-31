"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRole } from "@/hooks/use-role";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Save,
  Loader2,
  LogOut,
  Edit2,
  X,
  Check,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
  createdAt: string;
}

export default function AdminProfilePage() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const res = await fetch(`/api/admin/users?email=${user.email}`);
        const data = await res.json();

        const userData = Array.isArray(data)
          ? data.find((u: any) => u.email === user.email)
          : data.users?.find((u: any) => u.email === user.email);

        if (userData) {
          setProfile({
            id: userData.id,
            email: userData.email,
            name: userData.name || user.user_metadata?.name || "",
            role: userData.role,
            avatar: user.user_metadata?.avatar_url || null,
            createdAt: userData.createdAt,
          });
          setName(userData.name || user.user_metadata?.name || "");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { name },
      });
      if (authError) throw authError;

      const res = await fetch(`/api/admin/users/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: profile.email,
          role: profile.role,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }

      setProfile({ ...profile, name });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API first
      const response = await fetch("/api/auth/logout", { method: "POST" });

      // Sign out from Supabase client
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase signout error:", error);
      }

      // Clear any client-side auth data
      localStorage.removeItem("supabase-auth-token");
      localStorage.removeItem("sb-access-token");
      localStorage.removeItem("sb-refresh-token");
      sessionStorage.clear();

      // Clear all cookies manually (client-side)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Force hard navigation
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-destructive text-destructive-foreground";
      case "STAFF":
        return "bg-blue-500 text-white";
      case "RIDER":
        return "bg-orange-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return <div className="text-center py-12">Failed to load profile</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          View and manage your account information
        </p>
      </div>

      {/* Profile Card with py-4 px-2 */}
      <Card className="py-4 px-2">
        <CardContent className="pt-0">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name || "Avatar"}
                  width={100}
                  height={100}
                  className="rounded-full border-4 border-primary/20"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                  {getInitials(profile.name || profile.email)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">
                  {profile.name || profile.email}
                </h2>
                <div
                  className={`px-2 py-0.5 rounded-full text-white text-xs font-medium ${getRoleBadgeColor(profile.role)}`}
                >
                  {profile.role}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                {profile.email}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Edit Button */}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4" /> Cancel
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4" /> Edit Profile
                </>
              )}
            </Button>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="mt-6 border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    value={profile.email}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setName(profile.name || "");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="py-4 px-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">
                {profile.id.slice(0, 8)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{profile.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4 px-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                window.location.href = "/admin";
              }}
            >
              <Shield className="h-4 w-4" /> Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>
      <Card className="py-4 px-2">
        <CardContent className="pt-0">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="py-4 px-2">
          <CardContent className="pt-0 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
        <Card className="py-4 px-2">
          <CardContent className="pt-0 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
