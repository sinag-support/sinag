"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  ImageIcon,
  LogOut,
  ChevronDown,
  ChevronRight,
  Store,
  BarChart3,
  Truck,
  User,
  X,
  Newspaper,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useRole } from "@/hooks/use-role";
import { supabase } from "@/lib/supabase";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItem {
  href?: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "STAFF", "RIDER"],
  },
  {
    label: "Store",
    icon: Store,
    roles: ["ADMIN", "STAFF"],
    children: [
      {
        href: "/admin/products",
        label: "Products",
        icon: Package,
        roles: ["ADMIN", "STAFF"],
      },
      {
        href: "/admin/categories",
        label: "Categories",
        icon: Tag,
        roles: ["ADMIN", "STAFF"],
      },
      {
        href: "/admin/banners",
        label: "Banners",
        icon: ImageIcon,
        roles: ["ADMIN", "STAFF"],
      },
      {
        href: "/admin/blog",
        label: "Blog",
        icon: Newspaper,
        roles: ["ADMIN", "STAFF"],
      },
    ],
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingCart,
    roles: ["ADMIN", "STAFF"],
  },
  {
    href: "/admin/delivery",
    label: "Delivery",
    icon: Truck,
    roles: ["ADMIN", "RIDER"],
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["ADMIN"],
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    roles: ["ADMIN"],
  },
];

const getMobileNavItems = (userRole: string) => {
  const role = userRole.toUpperCase();
  const items: NavItem[] = [];

  items.push({
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "STAFF", "RIDER"],
  });

  if (role === "ADMIN" || role === "STAFF") {
    items.push({
      href: "/admin/orders",
      label: "Orders",
      icon: ShoppingCart,
      roles: ["ADMIN", "STAFF"],
    });

    items.push({
      label: "Store",
      icon: Store,
      roles: ["ADMIN", "STAFF"],
      children: [
        {
          href: "/admin/products",
          label: "Products",
          icon: Package,
          roles: ["ADMIN", "STAFF"],
        },
        {
          href: "/admin/categories",
          label: "Categories",
          icon: Tag,
          roles: ["ADMIN", "STAFF"],
        },
        {
          href: "/admin/banners",
          label: "Banners",
          icon: ImageIcon,
          roles: ["ADMIN", "STAFF"],
        },
        {
          href: "/admin/blog",
          label: "Blog",
          icon: Newspaper,
          roles: ["ADMIN", "STAFF"],
        },
      ],
    });
  }

  if (role === "ADMIN" || role === "RIDER") {
    items.push({
      href: "/admin/delivery",
      label: "Delivery",
      icon: Truck,
      roles: ["ADMIN", "RIDER"],
    });
  }

  if (role === "ADMIN") {
    items.push({
      label: "Profile",
      icon: User,
      roles: ["ADMIN"],
      children: [
        {
          href: "/admin/reports",
          label: "Reports",
          icon: BarChart3,
          roles: ["ADMIN"],
        },
        {
          href: "/admin/users",
          label: "Users",
          icon: Users,
          roles: ["ADMIN"],
        },
        {
          href: "/admin/profile",
          label: "Profile",
          icon: User,
          roles: ["ADMIN"],
        },
        {
          href: "#",
          label: "Logout",
          icon: LogOut,
          roles: ["ADMIN"],
        },
      ],
    });
  } else {
    items.push({
      href: "/admin/profile",
      label: "Profile",
      icon: User,
      roles: ["STAFF", "RIDER"],
    });
  }

  return items;
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, loading } = useRole();
  const normalizedRole = role?.toUpperCase() || "";

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    Store: true,
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [storePopoverOpen, setStorePopoverOpen] = useState(false);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const name =
          user.user_metadata?.name || user.email?.split("@")[0] || "User";
        setUserName(name);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setStorePopoverOpen(false);
    setProfilePopoverOpen(false);
  }, [pathname]);

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(normalizedRole),
  );

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // ✅ Updated handleLogout with full cleanup
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setProfileOpen(false);
    setStorePopoverOpen(false);
    setProfilePopoverOpen(false);

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
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      await supabase.auth.signOut();
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (href?: string) => {
    if (!href || href === "#") return false;
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const isParentActive = (item: NavItem) => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) {
      return item.children.some((child) => isActive(child.href));
    }
    return false;
  };

  const getInitials = () => {
    if (normalizedRole === "ADMIN") return "AD";
    if (normalizedRole === "STAFF") return "ST";
    if (normalizedRole === "RIDER") return "RD";
    return "SA";
  };

  const getDisplayName = () => {
    if (userName) return userName;
    if (normalizedRole === "ADMIN") return "Administrator";
    if (normalizedRole === "STAFF") return "Staff User";
    if (normalizedRole === "RIDER") return "Rider";
    return "Admin";
  };

  const handleChildClick = (child: NavItem) => {
    if (child.label === "Logout") {
      handleLogout();
      return;
    }
    if (child.href) {
      setStorePopoverOpen(false);
      setProfilePopoverOpen(false);
      router.push(child.href);
    }
  };

  const DesktopSidebar = () => (
    <aside className="hidden lg:flex h-screen flex-col border-r bg-background w-64 fixed left-0 top-0 z-30">
      <div className="flex items-center justify-between border-b p-2">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/sinag.png"
            alt="SINAG Logo"
            width={32}
            height={32}
            className="h-5 w-auto"
            priority
          />
          <span className="text-md font-semibold">SINAG</span>
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <TooltipProvider>
          <div className="space-y-1">
            {filteredItems.map((item) => {
              if (item.children) {
                const isExpanded = expandedItems[item.label];
                const Icon = item.icon;
                const parentActive = isParentActive(item);

                return (
                  <div key={item.label}>
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(item.label)}
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            parentActive &&
                              "bg-background border border-border font-medium text-foreground shadow-sm",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                          {item.children
                            .filter((child) =>
                              child.roles.includes(normalizedRole),
                            )
                            .map((child) => {
                              const ChildIcon = child.icon;
                              const active = isActive(child.href);

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href || "#"}
                                  className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                                    active &&
                                      "bg-background border border-border font-medium text-foreground shadow-sm",
                                  )}
                                >
                                  <ChildIcon className="h-4 w-4 shrink-0" />
                                  <span>{child.label}</span>
                                </Link>
                              );
                            })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              }

              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href || "#"}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                        active &&
                          "bg-background border border-border font-medium text-foreground shadow-sm",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </nav>

      <div
        className="border-t border-border px-2 py-3 flex flex-col relative"
        ref={containerRef}
      >
        {profileOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-2 rounded-md border border-border bg-background shadow-md overflow-hidden z-50">
            <div className="flex flex-col p-1">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/admin/profile");
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </div>
        )}

        <div className="w-full flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-xs font-bold">{getInitials()}</span>
            </div>
            <div className="flex-1 truncate text-left">
              <p className="text-sm font-medium truncate">{getDisplayName()}</p>
            </div>
          </div>

          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
            aria-label="User Options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  const MobileBottomNav = () => {
    const mobileItems = getMobileNavItems(normalizedRole);
    const isAnyPopoverOpen = storePopoverOpen || profilePopoverOpen;

    // ✅ Calculate grid columns based on number of items
    const getGridCols = () => {
      const count = mobileItems.length;
      if (count <= 4) return `grid-cols-${count}`;
      return "grid-cols-5";
    };

    return (
      <>
        {isAnyPopoverOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            onClick={() => {
              setStorePopoverOpen(false);
              setProfilePopoverOpen(false);
            }}
          />
        )}

        <div
          className={cn(
            "lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-200",
            isAnyPopoverOpen
              ? "bg-background/95 border-t border-border/20"
              : "bg-background border-t border-border",
          )}
        >
          <nav
            className={cn(
              "grid w-full h-16 items-center",
              mobileItems.length <= 4
                ? `grid-cols-${mobileItems.length}`
                : "grid-cols-5",
            )}
          >
            {mobileItems.map((item) => {
              const Icon = item.icon;
              const active = isParentActive(item);
              const hasChildren = !!item.children;
              const isOpen =
                item.label === "Store" ? storePopoverOpen : profilePopoverOpen;

              if (hasChildren) {
                const children = item.children?.filter((c) =>
                  c.roles.includes(normalizedRole),
                );

                return (
                  <Popover
                    key={item.label}
                    open={isOpen}
                    onOpenChange={(open) => {
                      if (item.label === "Store") {
                        setStorePopoverOpen(open);
                        if (open) setProfilePopoverOpen(false);
                      } else {
                        setProfilePopoverOpen(open);
                        if (open) setStorePopoverOpen(false);
                      }
                    }}
                  >
                    <PopoverTrigger
                      className={cn(
                        "flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors py-1 px-1 rounded-md w-full h-full",
                        isOpen
                          ? "text-primary relative z-50"
                          : active
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:text-primary",
                        isAnyPopoverOpen &&
                          !isOpen &&
                          "opacity-40 blur-sm pointer-events-none",
                      )}
                    >
                      {isOpen ? (
                        <>
                          <X className="h-5 w-5" />
                          <span className="leading-none">Close</span>
                        </>
                      ) : (
                        <>
                          <Icon className="h-5 w-5" />
                          <span className="leading-none">{item.label}</span>
                        </>
                      )}
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="center"
                      className="w-[calc(100vw-2rem)] max-w-xs mb-3 p-2 rounded-xl z-50 shadow-xl border border-border bg-background"
                      sideOffset={8}
                    >
                      <div className="grid grid-cols-4 gap-2">
                        {children?.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive = isActive(child.href);

                          return (
                            <button
                              key={child.label}
                              onClick={() => handleChildClick(child)}
                              className={cn(
                                "flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-[10px] transition-all hover:bg-accent hover:text-accent-foreground",
                                isChildActive &&
                                  "bg-accent text-accent-foreground font-medium",
                              )}
                            >
                              <ChildIcon className="h-5 w-5 shrink-0" />
                              <span className="leading-none text-center truncate w-full">
                                {child.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href || "#"}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors py-1 px-1 rounded-md w-full h-full",
                    active
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary",
                    isAnyPopoverOpen &&
                      "opacity-40 blur-sm pointer-events-none",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-none">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </>
    );
  };

  // Show sidebar layout with skeleton only for user data
  if (loading) {
    return (
      <>
        <aside className="hidden lg:flex h-screen flex-col border-r bg-background w-64 fixed left-0 top-0 z-30">
          {/* Header - Always visible with skeleton for logo text */}
          <div className="flex items-center justify-between border-b p-2">
            <div className="flex items-center gap-3">
              <Image
                src="/sinag.png"
                alt="SINAG Logo"
                width={32}
                height={32}
                className="h-5 w-auto"
                priority
              />
              <span className="text-md font-semibold">SINAG</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Nav items - Show skeleton for nav items */}
          <nav className="flex-1 px-3 py-4">
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                  <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </nav>

          {/* User profile - Skeleton for user data only */}
          <div className="border-t border-border px-2 py-3">
            <div className="flex items-center gap-3 px-1">
              <div className="h-8 w-8 shrink-0 rounded-full bg-muted animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        </aside>

        {/* Mobile bottom nav - Always visible with skeleton for icons */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background">
          <div className="grid grid-cols-5 w-full h-16">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center gap-1"
              >
                <div className="h-5 w-5 rounded bg-muted animate-pulse" />
                <div className="h-3 w-12 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:hidden h-16" />
      </>
    );
  }

  return (
    <>
      <DesktopSidebar />
      <MobileBottomNav />
      <div className="lg:hidden h-16" />
    </>
  );
}
