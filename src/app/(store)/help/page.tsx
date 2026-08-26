'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'How do I place an order?',
    answer:
      'Browse our product catalog, add items to your cart, and proceed to checkout. You\'ll need to provide your shipping address and choose a payment method. After confirming your order, you\'ll receive an email confirmation.',
  },
  {
    question: 'Can I modify or cancel my order after placing it?',
    answer:
      'Yes, but only if the order hasn\'t been processed yet. Contact us immediately via email or phone. If the order has already been packed or shipped, we cannot make changes.',
  },
  {
    question: 'How do I know if my order was successful?',
    answer:
      'You\'ll receive a confirmation email with your order number and summary. You can also check your order history under your profile.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept Cash on Delivery (COD) and GCash. You\'ll be able to choose your preferred method at checkout.',
  },
  {
    question: 'Is my payment information secure?',
    answer:
      'Absolutely. All transactions are processed through secure, encrypted connections. We never store your full payment details.',
  },
  {
    question: 'When will my payment be charged?',
    answer:
      'For COD, you pay when you receive the order. For GCash, your payment is processed immediately upon checkout.',
  },
  {
    question: 'How much does shipping cost?',
    answer:
      'Shipping fees depend on your location and order weight. You\'ll see the exact cost at checkout. Orders over ₱1,000 qualify for free shipping.',
  },
  {
    question: 'How long does delivery take?',
    answer:
      'We aim to deliver within 3–5 business days for Metro Manila, and 5–10 days for provincial areas. You\'ll receive a tracking link once your order ships.',
  },
  {
    question: 'Can I change my shipping address after ordering?',
    answer:
      'Please contact us immediately. If the order hasn\'t been shipped, we can update the address. Once shipped, we cannot reroute.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'You may return unopened and undamaged products within 7 days of delivery. Please contact our support team to initiate a return.',
  },
  {
    question: 'How do I get a refund?',
    answer:
      'Refunds will be processed via the original payment method within 5–10 business days after we receive and inspect the returned item.',
  },
  {
    question: 'What if I receive a damaged or incorrect item?',
    answer:
      'Please contact us immediately with your order number and photos of the item. We\'ll arrange a replacement or refund at no extra cost.',
  },
]

export default function HelpPage() {
  const router = useRouter()

  const goBack = () => {
    router.back()
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl">
      {/* Back button */}
      <button
        onClick={goBack}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold">How can we help you?</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Everything you need to know about buying products on SINAG.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Placing an Order', href: '#ordering' },
          { label: 'Payment', href: '#payment' },
          { label: 'Shipping', href: '#shipping' },
          { label: 'Returns', href: '#returns' },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center justify-center rounded-lg border bg-card p-4 text-center hover:bg-muted transition-colors"
          >
            <span className="text-sm font-medium">{item.label}</span>
          </a>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold" id="ordering">Placing an Order</h2>
        <Accordion className="w-full">
          {faqs.slice(0, 3).map((faq, index) => (
            <AccordionItem key={index} value={`ordering-${index}`}>
              <AccordionTrigger className="text-left font-medium text-sm sm:text-base hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <h2 className="text-2xl font-bold pt-6" id="payment">Payment</h2>
        <Accordion className="w-full">
          {faqs.slice(3, 6).map((faq, index) => (
            <AccordionItem key={index} value={`payment-${index}`}>
              <AccordionTrigger className="text-left font-medium text-sm sm:text-base hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <h2 className="text-2xl font-bold pt-6" id="shipping">Shipping & Delivery</h2>
        <Accordion className="w-full">
          {faqs.slice(6, 9).map((faq, index) => (
            <AccordionItem key={index} value={`shipping-${index}`}>
              <AccordionTrigger className="text-left font-medium text-sm sm:text-base hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <h2 className="text-2xl font-bold pt-6" id="returns">Returns & Refunds</h2>
        <Accordion className="w-full">
          {faqs.slice(9, 12).map((faq, index) => (
            <AccordionItem key={index} value={`returns-${index}`}>
              <AccordionTrigger className="text-left font-medium text-sm sm:text-base hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Still need help? */}
      <div className="mt-12 p-8 rounded-xl bg-muted/30 text-center">
        <h2 className="text-xl font-bold">Still need help?</h2>
        <p className="text-muted-foreground mt-2">
          Contact our support team and we'll get back to you within 24 hours.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Contact Us
          </a>
          <a
            href="/faq"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            View FAQ
          </a>
        </div>
      </div>
    </div>
  )
}