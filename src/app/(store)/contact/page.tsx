'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ContactForm } from './components/contact-form'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react'

export default function ContactPage() {
  const router = useRouter()

  const goBack = () => {
    router.back()
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-5xl">
      {/* Back button - only visible on mobile */}
      <button
        onClick={goBack}
        className="md:hidden inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>

      {/* Hero Section */}
      <div className="text-center space-y-4 mb-8 sm:mb-12">
        <Badge variant="outline" className="px-4 py-1 text-xs font-medium">
          Get in Touch
        </Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Contact Us
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Have questions, feedback, or need assistance? We're here to help.
          Reach out to us through any of the channels below.
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Email</h3>
            <p className="text-sm text-muted-foreground">
              <a href="mailto:support@sinag.com" className="hover:text-primary transition-colors">
                support@sinag.com
              </a>
            </p>
            <p className="text-xs text-muted-foreground">We respond within 24 hours</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Phone</h3>
            <p className="text-sm text-muted-foreground">
              <a href="tel:+639123456789" className="hover:text-primary transition-colors">
                +63 912 345 6789
              </a>
            </p>
            <p className="text-xs text-muted-foreground">Mon–Fri, 9 AM – 6 PM</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Visit Us</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              123 SINAG Street, Barangay San Lorenzo,<br />
              Metro Manila, Philippines
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Divider */}
      <div className="relative mb-8 sm:mb-12">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-4 text-muted-foreground">or send us a message</span>
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-muted/30 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Send us a message</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Fill in the form below and we'll get back to you as soon as possible.
          </p>
          <ContactForm />
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-8 sm:mt-12 text-center text-sm text-muted-foreground border-t pt-6">
        <p>
          <Clock className="inline-block h-4 w-4 mr-1" />
          Our support team is available Monday to Friday, 9:00 AM – 6:00 PM (PHT).
        </p>
      </div>
    </div>
  )
}