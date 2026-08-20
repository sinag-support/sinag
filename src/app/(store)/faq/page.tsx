import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
} from '@/components/ui/accordion'

export const metadata = {
   title: 'FAQ - SINAG',
   description: 'Frequently asked questions about SINAG.',
}

const faqs = [
   {
      question: 'How do I place an order?',
      answer:
         'Simply browse our products, select the items you want, add them to your cart, and proceed to checkout. Follow the on-screen instructions to complete your purchase.',
   },
   {
      question: 'What payment methods do you accept?',
      answer:
         'We accept Cash on Delivery (COD) and GCash. More payment options will be added soon.',
   },
   {
      question: 'How long does shipping take?',
      answer:
         'Shipping typically takes 2-5 business days within Metro Manila, and 3-7 business days for provincial areas.',
   },
   {
      question: 'How can I track my order?',
      answer:
         'Once your order is shipped, you will receive a tracking number via email. You can also check your order status in your profile under "My Orders".',
   },
   {
      question: 'What is your return policy?',
      answer:
         'We accept returns within 7 days of delivery for defective or incorrect items. Please refer to our Returns Policy page for more details.',
   },
   {
      question: 'Is my personal information secure?',
      answer:
         'Yes, we take your privacy seriously. All your data is encrypted and we never share your information with third parties. Read our Privacy Policy for more details.',
   },
]

export default function FAQPage() {
   return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-4xl">
         {/* Header */}
         <div className="text-center space-y-4 mb-8 sm:mb-12">
            <Badge variant="outline" className="px-4 py-1 text-xs font-medium">
               FAQ
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
               Frequently Asked Questions
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
               Find answers to the most common questions about SINAG.
            </p>
         </div>

         {/* FAQ Accordion */}
         <Card>
            <CardContent className="p-4 sm:p-6">
               <Accordion className="w-full">
                  {faqs.map((faq, index) => (
                     <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left font-medium text-sm sm:text-base hover:no-underline">
                           {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                           {faq.answer}
                        </AccordionContent>
                     </AccordionItem>
                  ))}
               </Accordion>
            </CardContent>
         </Card>
      </div>
   )
}