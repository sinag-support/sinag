'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
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
  ChevronUp,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'
import { useRole } from '@/hooks/use-role'
import { supabase } from '@/lib/supabase'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

interface NavItem {
  href?: string
  label: string
  icon: React.ElementType
  roles: string[]
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'STAFF', 'RIDER'],
  },
  {
    label: 'Store',
    icon: Store,
    roles: ['ADMIN'],
    children: [
      {
        href: '/admin/products',
        label: 'Products',
        icon: Package,
        roles: ['ADMIN'],
      },
      {
        href: '/admin/categories',
        label: 'Categories',
        icon: Tag,
        roles: ['ADMIN'],
      },
      {
        href: '/admin/banners',
        label: 'Banners',
        icon: ImageIcon,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: ShoppingCart,
    roles: ['ADMIN', 'STAFF'],
  },
  {
    href: '/admin/delivery',
    label: 'Delivery',
    icon: Truck,
    roles: ['ADMIN', 'RIDER'],
  },
  {
    href: '/admin/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: ['ADMIN'],
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
    roles: ['ADMIN'],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { role, loading } = useRole()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    Store: true,
  })
  const [profileOpen, setProfileOpen] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Fetch user name from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        setUserName(name)
      }
    }
    fetchUser()
  }, [])

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target as Node) &&
        !document.getElementById('mobile-menu-button')?.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(role || '')
  )

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setProfileOpen(false)
    setIsMobileMenuOpen(false)

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      await supabase.auth.signOut()
      window.location.href = '/'
    } finally {
      setIsLoggingOut(false)
    }
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname?.startsWith(href + '/')
  }

  const getInitials = () => {
    if (role === 'ADMIN') return 'AD'
    if (role === 'STAFF') return 'ST'
    if (role === 'RIDER') return 'RD'
    return 'SA'
  }

  // Get display name based on role
  const getDisplayName = () => {
    if (userName) return userName
    if (role === 'ADMIN') return 'Administrator'
    if (role === 'STAFF') return 'Staff User'
    if (role === 'RIDER') return 'Rider'
    return 'Admin'
  }

  // Desktop Sidebar Component
  const DesktopSidebar = () => (
    <aside className="hidden lg:flex h-screen flex-col border-r bg-background w-64 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/sinag.png"
            alt="SINAG Logo"
            width={32}
            height={32}
            className="h-8 w-auto"
            priority
          />
          <span className="text-lg font-bold">SINAG</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <TooltipProvider>
          <div className="space-y-1">
            {filteredItems.map((item) => {
              if (item.children) {
                const isExpanded = expandedItems[item.label]
                const Icon = item.icon

                return (
                  <div key={item.label}>
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(item.label)}
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
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
                            .filter((child) => child.roles.includes(role || ''))
                            .map((child) => {
                              const ChildIcon = child.icon
                              const active = isActive(child.href)

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href || '#'}
                                  className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                                    active && 'bg-accent text-accent-foreground font-medium'
                                  )}
                                >
                                  <ChildIcon className="h-4 w-4 shrink-0" />
                                  <span>{child.label}</span>
                                </Link>
                              )
                            })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )
              }

              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href || '#'}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                        active && 'bg-accent text-accent-foreground font-medium'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </TooltipProvider>
      </nav>

      {/* Footer - Profile with dropdown */}
      <div className="border-t p-2 flex flex-col relative" ref={containerRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-xs font-bold">{getInitials()}</span>
          </div>
          <div className="flex-1 truncate text-left">
            <p className="text-sm font-medium truncate">{getDisplayName()}</p>
            <p className="text-xs text-muted-foreground">{role || 'Admin'}</p>
          </div>
          <ChevronUp className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            profileOpen ? "rotate-0" : "rotate-180"
          )} />
        </button>

        {profileOpen && (
          <div className="absolute left-full bottom-0 ml-2 mb-2 w-56 rounded-lg border bg-popover shadow-lg overflow-hidden z-50">
            <div className="flex flex-col gap-0.5 p-1">
              <button
                onClick={() => {
                  setProfileOpen(false)
                  router.push('/admin/profile')
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-all hover:bg-destructive/10 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )

  // Mobile Sidebar Component
  const MobileSidebar = () => (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/sinag.png"
            alt="SINAG Logo"
            width={32}
            height={32}
            className="h-8 w-auto"
            priority
          />
          <span className="text-lg font-bold">SINAG</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            id="mobile-menu-button"
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        ref={mobileMenuRef}
        className={cn(
          "lg:hidden fixed top-0 right-0 z-50 h-full w-80 bg-background border-l transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/sinag.png"
              alt="SINAG Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <span className="text-lg font-bold">SINAG</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {filteredItems.map((item) => {
              if (item.children) {
                const isExpanded = expandedItems[item.label]
                const Icon = item.icon

                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleExpanded(item.label)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground'
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
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                        {item.children
                          .filter((child) => child.roles.includes(role || ''))
                          .map((child) => {
                            const ChildIcon = child.icon
                            const active = isActive(child.href)

                            return (
                              <Link
                                key={child.href}
                                href={child.href || '#'}
                                className={cn(
                                  'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                                  active && 'bg-accent text-accent-foreground font-medium'
                                )}
                              >
                                <ChildIcon className="h-4 w-4 shrink-0" />
                                <span>{child.label}</span>
                              </Link>
                            )
                          })}
                      </div>
                    )}
                  </div>
                )
              }

              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href || '#'}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                    active && 'bg-accent text-accent-foreground font-medium'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer - Profile */}
        <div className="border-t p-4">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false)
              router.push('/admin/profile')
            }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-xs font-bold">{getInitials()}</span>
            </div>
            <div className="flex-1 truncate text-left">
              <p className="text-sm font-medium truncate">{getDisplayName()}</p>
              <p className="text-xs text-muted-foreground">{role || 'Admin'}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-all hover:bg-destructive/10 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </>
  )

  if (loading) {
    return (
      <>
        <DesktopSidebarSkeleton />
        <MobileSidebarSkeleton />
      </>
    )
  }

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
      {/* Spacer for mobile header */}
      <div className="lg:hidden h-16" />
    </>
  )
}

function DesktopSidebarSkeleton() {
  return (
    <aside className="hidden lg:flex h-screen flex-col border-r bg-background w-64 fixed left-0 top-0 z-30">
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
      </div>
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
    </aside>
  )
}

function MobileSidebarSkeleton() {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
        <div className="h-5 w-16 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
        <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
      </div>
    </header>
  )
}