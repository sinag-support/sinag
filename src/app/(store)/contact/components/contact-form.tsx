'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2 } from 'lucide-react'

export function ContactForm() {
   const [formData, setFormData] = useState({
      name: '',
      email: '',
      message: '',
   })
   const [submitted, setSubmitted] = useState(false)

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      // Handle form submission (e.g., send to API)
      setSubmitted(true)
   }

   if (submitted) {
      return (
         <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-6 rounded-lg text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto" />
            <p className="text-green-700 dark:text-green-300 font-medium text-base">
               Thank you for your message!
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
               We'll get back to you within 24 hours.
            </p>
         </div>
      )
   }

   return (
      <form onSubmit={handleSubmit} className="space-y-5">
         <div>
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
               required
               className="mt-1.5"
            />
         </div>
         <div>
            <Label htmlFor="email" className="text-sm font-medium">
               Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
               id="email"
               type="email"
               placeholder="you@example.com"
               value={formData.email}
               onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
               }
               required
               className="mt-1.5"
            />
         </div>
         <div>
            <Label htmlFor="message" className="text-sm font-medium">
               Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
               id="message"
               placeholder="How can we help you?"
               rows={5}
               value={formData.message}
               onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
               }
               required
               className="mt-1.5 resize-none"
            />
         </div>
         <Button type="submit" className="w-full sm:w-auto">
            Send Message
         </Button>
      </form>
   )
}