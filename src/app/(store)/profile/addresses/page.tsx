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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Moon,
  Globe,
  Map as MapIcon,
  Flag,
} from 'lucide-react'
import { useTheme } from 'next-themes'

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
  latitude: number | null
  longitude: number | null
  landmark: string | null
  isDefault: boolean
  createdAt: string
}

interface FormDataState {
  address: string
  city: string
  province: string
  postalCode: string
  country: string
  latitude: number | null
  longitude: number | null
  landmark: string
  isDefault: boolean
}

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      className: 'leaflet-normal-tiles',
    },
  },
  dark: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      className: 'leaflet-dark-tiles',
    },
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      className: 'leaflet-satellite-tiles',
    },
  },
}

async function getCoordinates(
  address: string,
  city: string,
  province: string
) {
  try {
    const headers = {
      'Accept-Language': 'en',
    }

    if (address.trim() && city.trim()) {
      const primaryQuery = `${address}, ${city}, ${province}, Philippines`

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(primaryQuery)}&limit=1`,
        { headers }
      )

      if (response.ok) {
        const data = await response.json()

        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          }
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
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          }
        }
      }
    }

    return null
  } catch {
    return null
  }
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const headers = {
      'Accept-Language': 'en',
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers }
    )

    if (!response.ok) return null

    const data = await response.json()

    if (!data || !data.address) return null

    const addr = data.address

    const road =
      addr.road ||
      addr.pedestrian ||
      addr.residential ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.village ||
      addr.hamlet ||
      addr.isolated_dwelling ||
      ''

    const city =
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.county ||
      ''

    const province =
      addr.state ||
      addr.region ||
      addr.province ||
      ''

    const postalCode = addr.postcode || ''

    const country = addr.country || 'Philippines'

    return {
      address: road,
      city,
      province,
      postalCode,
      country,
    }
  } catch {
    return null
  }
}

function AddressMapPicker({
  formData,
  onLocationChange,
  addressChanged,
}: {
  formData: FormDataState
  onLocationChange: (
    data: Partial<FormDataState>
  ) => void
  addressChanged: number
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)

  const typingTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null)

  const requestIdRef = useRef(0)

  const isUserDraggingRef = useRef(false)
  const isProgrammaticMoveRef = useRef(false)

  const initializedFromCoordinatesRef = useRef(false)

  const { theme, resolvedTheme } = useTheme()

  const [mapTheme, setMapTheme] =
    useState<'street' | 'dark' | 'satellite'>('street')

  const [mapReady, setMapReady] =
    useState(false)

  const [leafletLoaded, setLeafletLoaded] =
    useState(false)

  const [mapError, setMapError] =
    useState(false)

  const [isGeocoding, setIsGeocoding] =
    useState(false)

  useEffect(() => {
    const activeTheme = resolvedTheme || theme

    if (activeTheme === 'dark') {
      setMapTheme('dark')
    } else if (activeTheme === 'light') {
      setMapTheme('street')
    }
  }, [theme, resolvedTheme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')

      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href =
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'

      document.head.appendChild(link)
    }

    if (!document.getElementById('leaflet-smooth-map')) {
      const style = document.createElement('style')

      style.id = 'leaflet-smooth-map'

      style.textContent = `
        .leaflet-container {
          background: #e5e7eb;
          overflow: hidden;
        }

        .leaflet-tile {
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .leaflet-fade-anim .leaflet-tile {
          transition: opacity 0.18s linear;
        }

        .leaflet-layer,
        .leaflet-tile-container {
          will-change: transform;
        }

        .leaflet-dark-tiles {
          filter:
            invert(1)
            hue-rotate(180deg)
            brightness(0.78)
            contrast(0.9)
            saturate(0.65);
        }

        .leaflet-normal-tiles {
          filter: none;
        }

        .leaflet-satellite-tiles {
          filter: none;
        }

        .custom-lottie-pin {
          background: transparent !important;
          border: none !important;
        }

        @media (max-width: 640px) {
          .leaflet-control-zoom {
            transform: scale(0.9);
            transform-origin: top left;
          }
        }
      `

      document.head.appendChild(style)
    }

    if (!document.getElementById('lottie-player-js')) {
      const lottieScript = document.createElement('script')

      lottieScript.id = 'lottie-player-js'
      lottieScript.src =
        'https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs'
      lottieScript.type = 'module'

      document.body.appendChild(lottieScript)
    }

    if (
      !window.L &&
      !document.getElementById('leaflet-js')
    ) {
      const script = document.createElement('script')

      script.id = 'leaflet-js'
      script.src =
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

      script.onload = () => {
        setLeafletLoaded(true)
      }

      script.onerror = () => {
        setMapError(true)
      }

      document.body.appendChild(script)
    } else if (window.L) {
      setLeafletLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) {
      return
    }

    let isMounted = true

    const initMap = async () => {
      let initialCoords: {
        lat: number
        lng: number
      } | null = null

      if (
        formData.latitude !== null &&
        formData.longitude !== null
      ) {
        initialCoords = {
          lat: formData.latitude,
          lng: formData.longitude,
        }

        initializedFromCoordinatesRef.current = true
      } else {
        initializedFromCoordinatesRef.current = false

        initialCoords = await getCoordinates(
          formData.address,
          formData.city,
          formData.province
        )
      }

      if (!isMounted || !mapRef.current) {
        return
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      try {
        const position: [number, number] =
          initialCoords
            ? [
                initialCoords.lat,
                initialCoords.lng,
              ]
            : [
                14.5995,
                120.9842,
              ]

        const map = window.L.map(
          mapRef.current,
          {
            center: position,
            zoom: 16,
            zoomControl: true,
            dragging: true,
            scrollWheelZoom: true,
            attributionControl: false,
            fadeAnimation: true,
            zoomAnimation: true,
            markerZoomAnimation: true,
            inertia: true,
            inertiaDeceleration: 3000,
            easeLinearity: 0.1,
          }
        )

        const activeConfig =
          TILE_LAYERS[mapTheme]

        const tileLayer =
          window.L.tileLayer(
            activeConfig.url,
            {
              ...activeConfig.options,
              updateWhenZooming: false,
              updateWhenIdle: true,
              keepBuffer: 4,
              crossOrigin: true,
            }
          ).addTo(map)

        tileLayerRef.current = tileLayer

        map.on('dragstart', () => {
          isUserDraggingRef.current = true
          isProgrammaticMoveRef.current = false

          if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current)
            typingTimerRef.current = null
          }

          requestIdRef.current++
        })

        map.on('drag', () => {
          isUserDraggingRef.current = true
        })

        map.on('dragend', async () => {
          isUserDraggingRef.current = false

          if (isProgrammaticMoveRef.current) {
            return
          }

          const center = map.getCenter()

          setIsGeocoding(true)

          const result = await reverseGeocode(
            center.lat,
            center.lng
          )

          if (!isMounted) {
            return
          }

          onLocationChange({
            latitude: center.lat,
            longitude: center.lng,
            ...(result?.address
              ? { address: result.address }
              : {}),
            ...(result?.city
              ? { city: result.city }
              : {}),
            ...(result?.province
              ? { province: result.province }
              : {}),
            ...(result?.postalCode
              ? { postalCode: result.postalCode }
              : {}),
            ...(result?.country
              ? { country: result.country }
              : {}),
          })

          setIsGeocoding(false)
        })

        map.on('moveend', () => {
          if (isProgrammaticMoveRef.current) {
            isProgrammaticMoveRef.current = false
          }
        })

        mapInstanceRef.current = map

        setMapReady(true)
        setMapError(false)

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize({
              animate: false,
            })
          }
        }, 250)
      } catch (error) {
        console.error(
          'Map initialization error:',
          error
        )

        setMapError(true)
      }
    }

    initMap()

    return () => {
      isMounted = false

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = null
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.off()
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      tileLayerRef.current = null
      setMapReady(false)
    }
  }, [leafletLoaded])

  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !mapReady ||
      !addressChanged
    ) {
      return
    }

    if (initializedFromCoordinatesRef.current) {
      initializedFromCoordinatesRef.current = false
      return
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current)
    }

    const currentRequest =
      ++requestIdRef.current

    typingTimerRef.current =
      setTimeout(async () => {
        const address =
          formData.address.trim()

        const city =
          formData.city.trim()

        const province =
          formData.province.trim()

        if (!address || !city) {
          return
        }

        if (isUserDraggingRef.current) {
          return
        }

        setIsGeocoding(true)

        const coords =
          await getCoordinates(
            address,
            city,
            province
          )

        if (
          currentRequest !==
          requestIdRef.current
        ) {
          setIsGeocoding(false)
          return
        }

        if (
          !coords ||
          !mapInstanceRef.current
        ) {
          setIsGeocoding(false)
          return
        }

        if (isUserDraggingRef.current) {
          setIsGeocoding(false)
          return
        }

        const map =
          mapInstanceRef.current

        const target =
          window.L.latLng(
            coords.lat,
            coords.lng
          )

        const currentCenter =
          map.getCenter()

        const distance =
          currentCenter.distanceTo(target)

        if (distance > 25) {
          isProgrammaticMoveRef.current = true

          map.stop()

          map.flyTo(
            target,
            map.getZoom(),
            {
              animate: true,
              duration: 1.5,
              easeLinearity: 0.08,
              noMoveStart: true,
            }
          )

          onLocationChange({
            latitude: coords.lat,
            longitude: coords.lng,
          })
        }

        setIsGeocoding(false)
      }, 1100)

    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
      }
    }
  }, [
    addressChanged,
    formData.address,
    formData.city,
    formData.province,
    mapReady,
  ])

  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !tileLayerRef.current
    ) {
      return
    }

    const map =
      mapInstanceRef.current

    const activeConfig =
      TILE_LAYERS[mapTheme]

    const oldTileLayer =
      tileLayerRef.current

    const newTileLayer =
      window.L.tileLayer(
        activeConfig.url,
        {
          ...activeConfig.options,
          updateWhenZooming: false,
          updateWhenIdle: true,
          keepBuffer: 4,
          crossOrigin: true,
        }
      )

    newTileLayer.addTo(map)

    tileLayerRef.current =
      newTileLayer

    newTileLayer.once('load', () => {
      if (map.hasLayer(oldTileLayer)) {
        map.removeLayer(oldTileLayer)
      }
    })

    const fallbackTimer =
      setTimeout(() => {
        if (
          map.hasLayer(oldTileLayer) &&
          tileLayerRef.current ===
            newTileLayer
        ) {
          map.removeLayer(oldTileLayer)
        }
      }, 8000)

    return () => {
      clearTimeout(fallbackTimer)
    }
  }, [mapTheme])

  if (mapError) {
    return (
      <div className="w-full h-full min-h-[260px] bg-muted flex flex-col items-center justify-center rounded-md">
        <MapPin className="h-8 w-8 text-muted-foreground mb-2" />

        <p className="text-sm text-muted-foreground">
          Map unavailable
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-md overflow-hidden bg-muted">
      {mapReady && !mapError && (
        <div className="absolute top-2 right-2 z-[1000] bg-background/85 backdrop-blur-md p-1 rounded-lg border shadow-md flex gap-1">
          <Button
            size="sm"
            type="button"
            variant={
              mapTheme === 'street'
                ? 'default'
                : 'ghost'
            }
            onClick={() =>
              setMapTheme('street')
            }
            className="h-6 text-[10px] font-medium px-1.5 gap-0.5"
          >
            <MapIcon className="w-3 h-3" />
            Street
          </Button>

          <Button
            size="sm"
            type="button"
            variant={
              mapTheme === 'dark'
                ? 'default'
                : 'ghost'
            }
            onClick={() =>
              setMapTheme('dark')
            }
            className="h-6 text-[10px] font-medium px-1.5 gap-0.5"
          >
            <Moon className="w-3 h-3" />
            Dark
          </Button>

          <Button
            size="sm"
            type="button"
            variant={
              mapTheme === 'satellite'
                ? 'default'
                : 'ghost'
            }
            onClick={() =>
              setMapTheme('satellite')
            }
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

      {mapReady && (
        <div className="absolute inset-0 pointer-events-none z-[999] flex items-center justify-center">
          <div className="relative -mt-8 flex items-center justify-center">
            <div
              className="flex items-center justify-center"
              dangerouslySetInnerHTML={{
                __html: `
                  <dotlottie-player
                    src="/animations/location.json"
                    background="transparent"
                    speed="1"
                    style="width:64px;height:64px;"
                    loop
                    autoplay
                  ></dotlottie-player>
                `,
              }}
            />
          </div>
        </div>
      )}

      {isGeocoding && mapReady && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-background/90 backdrop-blur-sm border rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">
            Detecting location...
          </span>
        </div>
      )}

      <div
        ref={mapRef}
        className="w-full h-full min-h-[280px]"
      />
    </div>
  )
}

export default function AddressesPage() {
  const router = useRouter()

  const [addresses, setAddresses] =
    useState<Address[]>([])

  const [loading, setLoading] =
    useState(true)

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [formData, setFormData] =
    useState<FormDataState>({
      address: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Philippines',
      latitude: null,
      longitude: null,
      landmark: '',
      isDefault: false,
    })

  const [addressChanged, setAddressChanged] =
    useState(0)

  const [submitting, setSubmitting] =
    useState(false)

  const fetchAddresses = async () => {
    try {
      const {
        data: { session },
      } =
        await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const response =
        await fetch('/api/addresses')

      if (!response.ok) {
        const errorData =
          await response.json()

        throw new Error(
          errorData.error ||
            'Failed to fetch addresses'
        )
      }

      const data =
        await response.json()

      setAddresses(data)
    } catch (error) {
      console.error(error)

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load addresses'
      )
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
      latitude: null,
      longitude: null,
      landmark: '',
      isDefault: false,
    })

    setEditingId(null)
    setAddressChanged(0)
  }

  const openAddDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (
    address: Address
  ) => {
    setFormData({
      address: address.address,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
      latitude:
        address.latitude ?? null,
      longitude:
        address.longitude ?? null,
      landmark:
        address.landmark || '',
      isDefault:
        address.isDefault,
    })

    setAddressChanged(0)
    setEditingId(address.id)
    setDialogOpen(true)
  }

  const handleLocationChange = (
    partialData: Partial<FormDataState>
  ) => {
    setFormData(prev => ({
      ...prev,
      ...partialData,
    }))
  }

  const handleTextChange = (
    field: keyof FormDataState,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))

    if (
      field === 'address' ||
      field === 'city' ||
      field === 'province'
    ) {
      setAddressChanged(prev => prev + 1)
    }
  }

  const handleSubmit = async () => {
    const {
      city,
      province,
      postalCode,
      latitude,
      longitude,
    } = formData

    const address =
      formData.address.trim() ||
      'Pinned Location (No Street Name)'

    if (!city.trim() || !province.trim()) {
      toast.error(
        'Please enter at least a City and Province'
      )
      return
    }

    if (
      latitude === null ||
      longitude === null
    ) {
      toast.error(
        'Please pin your location on the map'
      )
      return
    }

    setSubmitting(true)

    try {
      const url = editingId
        ? `/api/addresses/${editingId}`
        : '/api/addresses'

      const method = editingId
        ? 'PUT'
        : 'POST'

      const payload = {
        address,
        city: city.trim(),
        province: province.trim(),
        postalCode:
          postalCode.trim() || '0000',
        country: formData.country,
        latitude,
        longitude,
        landmark:
          formData.landmark.trim() ||
          null,
        isDefault:
          formData.isDefault,
      }

      const response =
        await fetch(url, {
          method,
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(payload),
        })

      if (!response.ok) {
        const data =
          await response.json()

        throw new Error(
          data.error ||
            'Failed to save address'
        )
      }

      toast.success(
        editingId
          ? 'Address updated'
          : 'Address added'
      )

      setDialogOpen(false)

      fetchAddresses()
    } catch (error: any) {
      toast.error(
        error.message ||
          'Failed to save address'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (
    id: string
  ) => {
    try {
      const response =
        await fetch(
          `/api/addresses/${id}`,
          {
            method: 'DELETE',
          }
        )

      if (!response.ok) {
        const data =
          await response.json()

        throw new Error(
          data.error ||
            'Failed to delete'
        )
      }

      toast.success(
        'Address deleted'
      )

      fetchAddresses()
    } catch (error: any) {
      toast.error(
        error.message ||
          'Failed to delete address'
      )
    }
  }

  const goBack = () =>
    router.back()

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 md:pb-0 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>

          <Skeleton className="h-9 w-28 rounded-md" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map(i => (
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

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Saved Addresses
          </h1>
        </div>

        <Button
          onClick={openAddDialog}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>

              <p className="text-lg font-medium">
                No addresses saved
              </p>

              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Add your delivery addresses to speed up checkout.
              </p>

              <Button
                onClick={openAddDialog}
                className="mt-4"
              >
                Add Your First Address
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {addresses.map(addr => (
            <Card
              key={addr.id}
              className={
                addr.isDefault
                  ? 'border-primary/50 bg-primary/5'
                  : ''
              }
            >
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {addr.address}
                    </span>

                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        Default
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {addr.city},{' '}
                    {addr.province}{' '}
                    {addr.postalCode}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {addr.country}
                  </p>

                  {addr.landmark && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Flag className="h-3 w-3" />
                      Landmark:{' '}
                      {addr.landmark}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      openEditDialog(addr)
                    }
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Address?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                          This action cannot be undone. This address will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                          onClick={() =>
                            handleDelete(
                              addr.id
                            )
                          }
                        >
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

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? 'Edit Address'
                : 'Add New Address'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
            <div className="flex flex-col space-y-1.5 h-full">
              <Label className="text-sm font-medium">
                Drag Map to Set Location
              </Label>

              <div className="flex-1 min-h-[280px]">
                {dialogOpen && (
                  <AddressMapPicker
                    key={
                      editingId ||
                      'new-address-map'
                    }
                    formData={formData}
                    onLocationChange={
                      handleLocationChange
                    }
                    addressChanged={
                      addressChanged
                    }
                  />
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center pt-1">
                Move the map under the pin to automatically detect the address.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="address"
                  className="text-sm font-medium"
                >
                  Address / Street
                </Label>

                <Input
                  id="address"
                  value={
                    formData.address
                  }
                  onChange={e =>
                    handleTextChange(
                      'address',
                      e.target.value
                    )
                  }
                  placeholder="123 Main St"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="city"
                    className="text-sm font-medium"
                  >
                    City
                  </Label>

                  <Input
                    id="city"
                    value={formData.city}
                    onChange={e =>
                      handleTextChange(
                        'city',
                        e.target.value
                      )
                    }
                    placeholder="Lipa"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="province"
                    className="text-sm font-medium"
                  >
                    Province
                  </Label>

                  <Input
                    id="province"
                    value={
                      formData.province
                    }
                    onChange={e =>
                      handleTextChange(
                        'province',
                        e.target.value
                      )
                    }
                    placeholder="Batangas"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="postalCode"
                    className="text-sm font-medium"
                  >
                    Postal Code
                  </Label>

                  <Input
                    id="postalCode"
                    value={
                      formData.postalCode
                    }
                    onChange={e =>
                      handleTextChange(
                        'postalCode',
                        e.target.value
                      )
                    }
                    placeholder="4217"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="country"
                    className="text-sm font-medium"
                  >
                    Country
                  </Label>

                  <Input
                    id="country"
                    value={
                      formData.country
                    }
                    onChange={e =>
                      handleTextChange(
                        'country',
                        e.target.value
                      )
                    }
                    placeholder="Philippines"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="landmark"
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  Landmark (Optional)
                </Label>

                <Input
                  id="landmark"
                  value={
                    formData.landmark
                  }
                  onChange={e =>
                    handleTextChange(
                      'landmark',
                      e.target.value
                    )
                  }
                  placeholder="e.g., Near Barangay Hall, Yellow gate"
                  className="h-10"
                />

                <p className="text-xs text-muted-foreground">
                  Add a landmark to help riders find your location easily.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="isDefault"
                  checked={
                    formData.isDefault
                  }
                  onCheckedChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      isDefault:
                        checked === true,
                    }))
                  }
                />

                <Label
                  htmlFor="isDefault"
                  className="text-sm cursor-pointer"
                >
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