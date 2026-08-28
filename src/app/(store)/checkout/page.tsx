import dynamic from 'next/dynamic'

// Import the client component with SSR disabled
const CheckoutClient = dynamic(
  () => import('./checkout-client'),
  { ssr: false }
)

export default function CheckoutPage() {
  return <CheckoutClient />
}