'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  className?: string
}

export function BackButton({ className }: BackButtonProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className={cn(
        'inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </button>
  )
}