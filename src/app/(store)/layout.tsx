export default function StoreLayout({
   children,
}: {
   children: React.ReactNode
}) {
   return (
      <>
         <main className="min-h-screen">
            {children}
         </main>
      </>
   )
}