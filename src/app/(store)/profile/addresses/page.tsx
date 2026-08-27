'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, ArrowLeft, MapPin, Plus, Edit, Trash2, CheckCircle, Moon, Globe, Map } from 'lucide-react'

declare global {
  interface Window {
    L: any
  }
}

interface Address {
  id: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt: string
}

// Tile Layer Configurations
const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    },
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 20,
      subdomains: 'abcd',
    },
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
    },
  },
}

// Multi-tier fallback geocoding with safe fetch error handling
async function getCoordinates(address: string, city: string, province: string) {
  try {
    const headers = { 'Accept-Language': 'en' }

    if (address.trim() && city.trim()) {
      const primaryQuery = `${address}, ${city}, ${province}, Philippines`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(primaryQuery)}&limit=1`,
        { headers }
      )
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        }
      }
    }

    if (city.trim()) {
      const fallbackQuery = `${city}, ${province}, Philippines`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`,
        { headers }
      )
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        }
      }
    }

    return { lat: 14.5995, lng: 120.9842 }
  } catch (error) {
    return { lat: 14.5995, lng: 120.9842 }
  }
}

// Address Map Dialog Component
function AddressMapDialog({ address, city, province }: { address: string; city: string; province: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const [mapTheme, setMapTheme] = useState<'street' | 'dark' | 'satellite'>('street')
  const [mapReady, setMapReady] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  // Load Leaflet & DotLottie
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    if (!window.L && !document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => setLeafletLoaded(true)
      script.onerror = () => setMapError(true)
      document.body.appendChild(script)
    } else if (window.L) {
      setLeafletLoaded(true)
    }

    if (!document.getElementById('lottie-player-js')) {
      const lottieScript = document.createElement('script')
      lottieScript.id = 'lottie-player-js'
      lottieScript.src = 'https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs'
      lottieScript.type = 'module'
      document.body.appendChild(lottieScript)
    }
  }, [])

  // Geocode address
  useEffect(() => {
    const fetchCoordinates = async () => {
      const coords = await getCoordinates(address, city, province)
      setCoordinates(coords)
    }

    fetchCoordinates()
  }, [address, city, province])

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !coordinates || !mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const timer = setTimeout(() => {
      try {
        if (!mapRef.current) return

        const position: [number, number] = [coordinates.lat, coordinates.lng]

        const map = window.L.map(mapRef.current, {
          center: position,
          zoom: 15,
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: true,
          attributionControl: false,
        })

        const activeConfig = TILE_LAYERS[mapTheme]
        const tileLayer = window.L.tileLayer(activeConfig.url, activeConfig.options).addTo(map)
        tileLayerRef.current = tileLayer

        const locationIcon = window.L.divIcon({
          className: 'custom-leaflet-animated-icon',
          html: `
            <div style="width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
              <dotlottie-player
                src="/animations/location.json"
                background="transparent"
                speed="1"
                style="width: 56px; height: 56px;"
                loop
                autoplay
              ></dotlottie-player>
            </div>
          `,
          iconSize: [56, 56],
          iconAnchor: [28, 56],
          popupAnchor: [0, -56],
        })

        const marker = window.L.marker(position, { icon: locationIcon }).addTo(map)

        // Only show popup content when actual address details exist (no "Loading...")
        const hasInfo = address.trim() || city.trim()
        if (hasInfo) {
          marker.bindPopup(`
            <div style="font-size: 13px; max-width: 200px;">
              <strong>📍 Address</strong><br/>
              ${address}${city ? `, ${city}` : ''}${province ? `, ${province}` : ''}
            </div>
          `)
          setTimeout(() => marker.openPopup(), 300)
        }

        mapInstanceRef.current = map
        setMapReady(true)
        setMapError(false)

        setTimeout(() => map.invalidateSize(), 300)

      } catch (error) {
        console.error('Map initialization error:', error)
        setMapError(true)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [leafletLoaded, coordinates, address, city, province])

  // Dynamic Theme Switcher Effect
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return

    const map = mapInstanceRef.current
    const activeConfig = TILE_LAYERS[mapTheme]

    map.removeLayer(tileLayerRef.current)
    const newTileLayer = window.L.tileLayer(activeConfig.url, activeConfig.options).addTo(map)
    tileLayerRef.current = newTileLayer
  }, [mapTheme])

  if (mapError) {
    return (
      <div className="w-full h-full min-h-[260px] bg-muted flex flex-col items-center justify-center rounded-md">
        <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Map unavailable</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full min-h-[260px] rounded-md overflow-hidden bg-muted">
      {mapReady && !mapError && (
        <div className="absolute top-2 right-2 z-[1000] bg-background/80 backdrop-blur-md p-1 rounded-lg border shadow-md flex gap-1">
          <Button
            size="sm"
            variant={mapTheme === 'street' ? 'default' : 'ghost'}
            onClick={() => setMapTheme('street')}
            className="h-6 text-[10px] font-medium px-1.5 gap-0.5"
          >
            <Map className="w-3 h-3" />
            Street
          </Button>
          <Button
            size="sm"
            variant={mapTheme === 'dark' ? 'default' : 'ghost'}
            onClick={() => setMapTheme('dark')}
            className="h-6 text-[10px] font-medium px-1.5 gap-0.5"
          >
            <Moon className="w-3 h-3" />
            Dark
          </Button>
          <Button
            size="sm"
            variant={mapTheme === 'satellite' ? 'default' : 'ghost'}
            onClick={() => setMapTheme('satellite')}
            className="h-6 text-[10px] font-medium px-1.5 gap-0.5"
          >
            <Globe className="w-3 h-3" />
            Satellite
          </Button>
        </div>
      )}

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full min-h-[260px]" />
    </div>
  )
}

export default function AddressesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Philippines',
    isDefault: false,
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchAddresses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/addresses')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch addresses')
      }
      const data = await response.json()
      setAddresses(data)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const resetForm = () => {
    setFormData({
      address: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Philippines',
      isDefault: false,
    })
    setEditingId(null)
  }

  const openAddDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (address: Address) => {
    setFormData({
      address: address.address,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    })
    setEditingId(address.id)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    const { address, city, province, postalCode } = formData
    if (!address || !city || !province || !postalCode) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save address')
      }

      toast.success(editingId ? 'Address updated' : 'Address added')
      setDialogOpen(false)
      fetchAddresses()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }
      toast.success('Address deleted')
      fetchAddresses()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const goBack = () => router.back()

  // --- Skeleton Loading State ---
  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>

        {/* Skeleton Cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Saved Addresses</h1>
        </div>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No addresses saved</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Add your delivery addresses to speed up checkout.
              </p>
              <Button onClick={openAddDialog} className="mt-4">
                Add Your First Address
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <Card key={addr.id} className={addr.isDefault ? 'border-primary/50 bg-primary/5' : ''}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{addr.address}</span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        <CheckCircle className="h-3 w-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {addr.city}, {addr.province} {addr.postalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">{addr.country}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(addr)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This address will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(addr.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog with Map on Left & Form on Right */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
            {/* Left Side: Map Preview */}
            <div className="flex flex-col space-y-1.5 h-full">
              <Label className="text-sm font-medium">Location Preview</Label>
              <div className="flex-1 min-h-[260px]">
                <AddressMapDialog
                  address={formData.address}
                  city={formData.city}
                  province={formData.province}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center pt-1">
                Pin shows the approximate location of your address
              </p>
            </div>

            {/* Right Side: Form Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Manila"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="province" className="text-sm font-medium">
                    Province
                  </Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Metro Manila"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="postalCode" className="text-sm font-medium">
                    Postal Code
                  </Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="1000"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Philippines"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isDefault: checked === true })
                  }
                />
                <Label htmlFor="isDefault" className="text-sm cursor-pointer">
                  Set as default address
                </Label>
              </div>

              <Button
                className="w-full h-11 mt-2"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Address'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}