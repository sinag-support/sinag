'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'
import {
  LogOut,
  ShoppingCart,
  Heart,
  Bell,
  Search,
  UserCircle,
  Package,
  Home,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  title: string
  price: number
  image: string
  category: string | null
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const desktopSearchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedInsideDesktop = desktopSearchRef.current?.contains(target)
      const clickedInsideMobile = mobileSearchRef.current?.contains(target)
      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        await performSearch(searchQuery.trim())
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const performSearch = async (query: string) => {
    setIsSearching(true)
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(query)}&limit=5`
      )
      const data = await res.json()
      const products = (data.products || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        image: p.images?.[0] || '',
        category: p.category?.title || null,
      }))
      setSearchResults(products)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchSubmit = (
    e: React.KeyboardEvent<HTMLInputElement> | React.FormEvent
  ) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowResults(false)
      router.push(`/products?query=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  const fetchUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    } catch (error) {
      console.error('Error getting user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [pathname])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setUser(session?.user || null)
        }
        setLoading(false)
      }
    )
    return () => subscription?.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      await supabase.auth.signOut()
      window.location.href = '/'
    }
  }

  // Hide on admin
  if (pathname?.startsWith('/admin')) return null

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/blog', label: 'Blog' },
  ]

  // Define pages where header should be hidden on mobile
  const hideOnMobilePage =
    pathname === '/notifications' ||
    pathname === '/help' ||
    pathname === '/contact' ||
    pathname === '/blog' ||
    pathname?.startsWith('/blog/') ||
    pathname === '/about-us' ||
    pathname === '/faq' ||
    pathname === '/privacy' ||
    pathname === '/returns-policy' ||
    pathname === '/shipping-policy' ||
    pathname === '/terms' ||
    pathname?.startsWith('/profile')

  const hideTopHeader = isMobile && hideOnMobilePage

  const hideBottomNav =
    isMobile &&
    (hideOnMobilePage ||
      pathname === '/profile/settings' ||
      pathname === '/profile/orders' ||
      pathname === '/profile/wishlist' ||
      pathname === '/profile/addresses' ||
      pathname === '/profile/help' ||
      pathname === '/profile/notifications' ||
      pathname === '/profile/payments' ||
      pathname === '/profile/privacy' ||
      pathname === '/profile/security')

  // Hide header on mobile cart
  const hideCartHeader = isMobile && pathname === '/cart'

  // Loading skeleton – shows on desktop, hidden on mobile when needed
  if (loading) {
    return (
      <>
        <header
          className={cn(
            'sticky top-0 z-50 border-b bg-background/95 backdrop-blur',
            (hideTopHeader || hideCartHeader) && 'max-md:hidden'
          )}
        >
          <div className="hidden md:flex px-4 sm:px-6 lg:px-8 h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-xl font-bold font-work-sans shrink-0">SINAG</div>
              <div className="flex items-center gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 w-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-48 h-9 bg-muted animate-pulse rounded" />
              <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
              <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
              <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
            </div>
          </div>
          <div className="md:hidden px-4 py-2 flex items-center gap-3">
            <div className="flex-1 h-9 rounded-md bg-muted animate-pulse" />
            <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
            <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
          </div>
        </header>
        <div
          className={cn(
            'md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background',
            (hideBottomNav || hideCartHeader) && 'hidden'
          )}
        >
          <nav className="flex items-center justify-evenly h-16">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                <div className="w-10 h-3 rounded-md bg-muted animate-pulse" />
              </div>
            ))}
          </nav>
        </div>
      </>
    )
  }

  // Full render
  return (
    <>
      {/* Top Header */}
      <header
        className={cn(
          'sticky top-0 z-50 border-b bg-background/95 backdrop-blur',
          (hideTopHeader || hideCartHeader) && 'max-md:hidden'
        )}
      >
        {/* Desktop */}
        <div className="hidden md:flex px-4 sm:px-6 lg:px-8 h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Image
              src="/sinag.png"
              alt="SINAG Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <Link href="/" className="text-xl font-bold font-work-sans shrink-0">
              SINAG
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-primary ${
                    pathname === link.href
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64 lg:w-80" ref={desktopSearchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-9 w-full pr-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowResults(true)
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>

              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto min-w-[400px]">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No products found
                    </div>
                  ) : (
                    <>
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products?productId=${encodeURIComponent(product.id)}`}
                          onClick={() => setShowResults(false)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left border-b border-border/50 last:border-0"
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {product.title}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                ₱{product.price.toFixed(2)}
                              </p>
                              {product.category && (
                                <span className="text-xs text-muted-foreground/60">
                                  • {product.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                      <div className="border-t p-2 bg-muted/20">
                        <Link
                          href={`/products?query=${encodeURIComponent(searchQuery.trim())}`}
                          onClick={() => setShowResults(false)}
                          className="block w-full text-center text-sm text-primary hover:underline font-medium py-1"
                        >
                          View all results →
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <ThemeToggle />
            <NotificationsDropdown />
            <Link href={user ? '/cart' : '/login'}>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="cursor-pointer rounded-full h-9 w-9 bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-transparent text-primary">
                        {getInitials(user.user_metadata?.name || user.email || '')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex flex-col space-y-1 px-4 py-2">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.name || user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <UserCircle className="mr-2 h-4 w-4" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/orders')}>
                      <Package className="mr-2 h-4 w-4" /> My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/wishlist')}>
                      <Heart className="mr-2 h-4 w-4" /> Wishlist
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm">Login</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden px-4 py-2 flex items-center gap-3">
          <Image
            src="/sinag.png"
            alt="SINAG Logo"
            width={28}
            height={28}
            className="h-7 w-auto"
            priority
          />
          <div className="relative flex-1" ref={mobileSearchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-9 w-full pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true)
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>

            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No products found
                  </div>
                ) : (
                  <>
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products?productId=${encodeURIComponent(product.id)}`}
                        onClick={() => setShowResults(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left border-b border-border/50 last:border-0"
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              ₱{product.price.toFixed(2)}
                            </p>
                            {product.category && (
                              <span className="text-xs text-muted-foreground/60">
                                • {product.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                    <div className="border-t p-2 bg-muted/20">
                      <Link
                        href={`/products?query=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => setShowResults(false)}
                        className="block w-full text-center text-sm text-primary hover:underline font-medium py-1"
                      >
                        View all results →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <ThemeToggle />
          <Link href={user ? '/cart' : '/login'}>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Bottom Navigation */}
      <div
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background',
          (hideBottomNav || hideCartHeader) && 'hidden'
        )}
      >
        <nav className="flex items-center justify-evenly h-16">
          <Link
            href="/"
            className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
              pathname === '/' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/products"
            className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
              pathname?.startsWith('/products')
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            <Package className="h-5 w-5" />
            <span>Products</span>
          </Link>
          <Link
            href="/notifications"
            className={`relative flex flex-col items-center gap-0.5 text-xs transition-colors ${
              pathname === '/notifications'
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                0
              </span>
            </div>
            <span>Notifications</span>
          </Link>
          <Link
            href={user ? '/profile' : '/login'}
            className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
              pathname?.startsWith('/profile')
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            {user ? (
              <Avatar className="h-6 w-6 border-2 border-primary/20">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(user.user_metadata?.name || user.email || '')}
                </AvatarFallback>
              </Avatar>
            ) : (
              <UserCircle className="h-5 w-5" />
            )}
            <span>{user ? 'Profile' : 'Login'}</span>
          </Link>
        </nav>
      </div>
    </>
  )
}