'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
         <div className="bg-green-50 dark:bg-green-950 p-4 sm:p-6 rounded-lg text-center">
            <p className="text-green-700 dark:text-green-300 font-medium text-sm sm:text-base">
               Thank you for your message! We'll get back to you soon.
            </p>
         </div>
      )
   }

   return (
      <form onSubmit={handleSubmit} className="space-y-4">
         <div>
            <Label htmlFor="name" className="text-sm sm:text-base">Name</Label>
            <Input
               id="name"
               placeholder="Your name"
               value={formData.name}
               onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
               }
               required
               className="text-sm sm:text-base"
            />
         </div>
         <div>
            <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
            <Input
               id="email"
               type="email"
               placeholder="you@example.com"
               value={formData.email}
               onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
               }
               required
               className="text-sm sm:text-base"
            />
         </div>
         <div>
            <Label htmlFor="message" className="text-sm sm:text-base">Message</Label>
            <Textarea
               id="message"
               placeholder="Your message..."
               rows={5}
               value={formData.message}
               onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
               }
               required
               className="text-sm sm:text-base"
            />
         </div>
         <Button type="submit" className="w-full sm:w-auto">
            Send Message
         </Button>
      </form>
   )
}