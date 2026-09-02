"use client";

import { useEffect, useState, useRef } from "react";
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
  MapPin,
  Store,
  Flag,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddressMapPicker } from "@/components/admin/address-map-picker";

interface Address {
  id: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  landmark: string | null;
  isStoreLocation: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
  createdAt: string;
  storeLocation: Address | null;
}

export default function AdminProfilePage() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Store location states - only for ADMIN
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [storeFormData, setStoreFormData] = useState({
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Philippines",
    latitude: null as number | null,
    longitude: null as number | null,
    landmark: "",
  });
  const [storeAddressChanged, setStoreAddressChanged] = useState(0);
  const [savingStore, setSavingStore] = useState(false);

  const isAdmin = role === "ADMIN";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfile(data);
      setName(data.name || "");

      // Populate store form data if exists (only for admin)
      if (data.storeLocation) {
        setStoreFormData({
          address: data.storeLocation.address,
          city: data.storeLocation.city,
          province: data.storeLocation.province,
          postalCode: data.storeLocation.postalCode,
          country: data.storeLocation.country,
          latitude: data.storeLocation.latitude,
          longitude: data.storeLocation.longitude,
          landmark: data.storeLocation.landmark || "",
        });
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

      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const data = await res.json();
      setProfile(data);
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStoreLocation = async () => {
    if (!isAdmin) return; // Only admin can update store location

    const { address, city, province, postalCode, latitude, longitude } =
      storeFormData;

    if (!address.trim() || !city.trim() || !province.trim()) {
      toast.error("Please fill in address, city, and province");
      return;
    }

    if (latitude === null || longitude === null) {
      toast.error("Please pin your location on the map");
      return;
    }

    setSavingStore(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeLocation: {
            address: address.trim(),
            city: city.trim(),
            province: province.trim(),
            postalCode: postalCode.trim() || "0000",
            country: storeFormData.country || "Philippines",
            latitude,
            longitude,
            landmark: storeFormData.landmark.trim() || null,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update store location");
      }

      const data = await res.json();
      setProfile(data);

      if (data.storeLocation) {
        setStoreFormData({
          address: data.storeLocation.address,
          city: data.storeLocation.city,
          province: data.storeLocation.province,
          postalCode: data.storeLocation.postalCode,
          country: data.storeLocation.country,
          latitude: data.storeLocation.latitude,
          longitude: data.storeLocation.longitude,
          landmark: data.storeLocation.landmark || "",
        });
      }

      toast.success("Store location updated successfully");
      setStoreDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update store location");
    } finally {
      setSavingStore(false);
    }
  };

  const handleStoreLocationChange = (
    partialData: Partial<typeof storeFormData>,
  ) => {
    setStoreFormData((prev) => ({ ...prev, ...partialData }));
  };

  const handleStoreTextChange = (
    field: keyof typeof storeFormData,
    value: string,
  ) => {
    setStoreFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "address" || field === "city" || field === "province") {
      setStoreAddressChanged((prev) => prev + 1);
    }
  };

  const openStoreDialog = () => {
    if (profile?.storeLocation) {
      setStoreFormData({
        address: profile.storeLocation.address,
        city: profile.storeLocation.city,
        province: profile.storeLocation.province,
        postalCode: profile.storeLocation.postalCode,
        country: profile.storeLocation.country,
        latitude: profile.storeLocation.latitude,
        longitude: profile.storeLocation.longitude,
        landmark: profile.storeLocation.landmark || "",
      });
    }
    setStoreDialogOpen(true);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase signout error:", error);
      }
      localStorage.removeItem("supabase-auth-token");
      localStorage.removeItem("sb-access-token");
      localStorage.removeItem("sb-refresh-token");
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      await supabase.auth.signOut();
      window.location.href = "/";
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
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
          Profile
        </h1>
        <p className="text-muted-foreground">
          View and manage your account information
        </p>
      </div>

      {/* Profile Card */}
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

      {/* Store Location Card - Admin only */}
      {isAdmin && (
        <Card className="py-4 px-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Store Location
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {profile.storeLocation ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {profile.storeLocation.address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile.storeLocation.city}, {profile.storeLocation.province}{" "}
                  {profile.storeLocation.postalCode}
                </p>
                {profile.storeLocation.landmark && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Flag className="h-3 w-3" />
                    Landmark: {profile.storeLocation.landmark}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openStoreDialog}
                  className="mt-2 gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Update Store Location
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  No store location set. Please set your store location for
                  delivery tracking.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openStoreDialog}
                  className="mt-2 gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Set Store Location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Store Location Dialog - Admin only */}
      {isAdmin && (
        <Dialog open={storeDialogOpen} onOpenChange={setStoreDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                {profile.storeLocation
                  ? "Update Store Location"
                  : "Set Store Location"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
              <div className="flex flex-col space-y-1.5 h-full">
                <Label className="text-sm font-medium">
                  Drag Map to Set Store Location
                </Label>
                <div className="flex-1 min-h-[280px]">
                  {storeDialogOpen && (
                    <AddressMapPicker
                      key="store-location-map"
                      formData={storeFormData}
                      onLocationChange={handleStoreLocationChange}
                      addressChanged={storeAddressChanged}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Move the map under the pin to automatically detect the
                  address.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="store-address"
                    className="text-sm font-medium"
                  >
                    Address / Street
                  </Label>
                  <Input
                    id="store-address"
                    value={storeFormData.address}
                    onChange={(e) =>
                      handleStoreTextChange("address", e.target.value)
                    }
                    placeholder="123 Main St"
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-city" className="text-sm font-medium">
                      City
                    </Label>
                    <Input
                      id="store-city"
                      value={storeFormData.city}
                      onChange={(e) =>
                        handleStoreTextChange("city", e.target.value)
                      }
                      placeholder="Lipa"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="store-province"
                      className="text-sm font-medium"
                    >
                      Province
                    </Label>
                    <Input
                      id="store-province"
                      value={storeFormData.province}
                      onChange={(e) =>
                        handleStoreTextChange("province", e.target.value)
                      }
                      placeholder="Batangas"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="store-postal"
                      className="text-sm font-medium"
                    >
                      Postal Code
                    </Label>
                    <Input
                      id="store-postal"
                      value={storeFormData.postalCode}
                      onChange={(e) =>
                        handleStoreTextChange("postalCode", e.target.value)
                      }
                      placeholder="4217"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="store-country"
                      className="text-sm font-medium"
                    >
                      Country
                    </Label>
                    <Input
                      id="store-country"
                      value={storeFormData.country}
                      onChange={(e) =>
                        handleStoreTextChange("country", e.target.value)
                      }
                      placeholder="Philippines"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="store-landmark"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    Landmark (Optional)
                  </Label>
                  <Input
                    id="store-landmark"
                    value={storeFormData.landmark}
                    onChange={(e) =>
                      handleStoreTextChange("landmark", e.target.value)
                    }
                    placeholder="e.g., Near Barangay Hall, Yellow gate"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add a landmark to help customers find your store.
                  </p>
                </div>

                <Button
                  className="w-full h-11 mt-2"
                  onClick={handleUpdateStoreLocation}
                  disabled={savingStore}
                >
                  {savingStore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Store Location"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
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
