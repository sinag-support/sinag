import { ThemeProvider } from '@/components/theme-provider'
import { Inter, Work_Sans, Geist } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })
const workSans = Work_Sans({
   subsets: ['latin'],
   weight: ['800'],
   variable: '--font-work-sans',
})

export const metadata = {
   title: 'SINAG',
   description: 'Your online store for cooking essentials — spices, coffee, grains, dried seafood & more.',
   manifest: '/manifest.json',
   appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'SINAG',
   },
   applicationName: 'SINAG',
   generator: 'Next.js',
   keywords: ['SINAG', 'cooking essentials', 'spices', 'coffee', 'grains', 'dried seafood'],
   authors: [{ name: 'SINAG', url: 'https://sinag-store.vercel.app' }],
   formatDetection: {
      telephone: false,
   },
}

export const viewport = {
   width: 'device-width',
   initialScale: 1,
   maximumScale: 1,
   userScalable: false,
   themeColor: '#0a0a0a',
}

export default function RootLayout({
   children,
}: {
   children: React.ReactNode
}) {
   return (
      <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
         <head>
            <link rel="apple-touch-icon" href="/192x192.png" sizes="192x192" />
            <link rel="icon" type="image/png" sizes="32x32" href="/32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/16x16.png" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
         </head>
         <body className={`${inter.className} ${workSans.variable}`}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
               {children}
            </ThemeProvider>
         </body>
      </html>
   )
}