import Header from '@/components/nav/header'
import { Footer } from '@/components/home/footer'

export default function StoreLayout({
   children,
}: {
   children: React.ReactNode
}) {
   return (
      <>
         <Header />
         <main className="min-h-screen">
            {children}
         </main>
         <Footer />
      </>
   )
}