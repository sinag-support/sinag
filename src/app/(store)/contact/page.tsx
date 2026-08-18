import { ContactForm } from './components/contact-form'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Phone, MapPin } from 'lucide-react'

export const metadata = {
   title: 'Contact Us - SINAG',
   description: 'Get in touch with SINAG support.',
}

export default function ContactPage() {
   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl">
         <div className="space-y-6 sm:space-y-8">
            <div>
               <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Contact Us</h1>
               <p className="text-base sm:text-lg text-muted-foreground mt-1 sm:mt-2">
                  We'd love to hear from you.
               </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
               <Card>
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center space-y-1 sm:space-y-2">
                     <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                     <h3 className="font-semibold text-sm sm:text-base">Email</h3>
                     <p className="text-xs sm:text-sm text-muted-foreground">
                        support@sinag.com
                     </p>
                  </CardContent>
               </Card>
               <Card>
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center space-y-1 sm:space-y-2">
                     <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                     <h3 className="font-semibold text-sm sm:text-base">Phone</h3>
                     <p className="text-xs sm:text-sm text-muted-foreground">
                        +63 912 345 6789
                     </p>
                  </CardContent>
               </Card>
               <Card>
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center space-y-1 sm:space-y-2">
                     <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                     <h3 className="font-semibold text-sm sm:text-base">Address</h3>
                     <p className="text-xs sm:text-sm text-muted-foreground">
                        123 SINAG Street, Metro Manila, Philippines
                     </p>
                  </CardContent>
               </Card>
            </div>

            <div className="max-w-2xl mx-auto w-full">
               <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Send us a message</h2>
               <ContactForm />
            </div>
         </div>
      </div>
   )
}