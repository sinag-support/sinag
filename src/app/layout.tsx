import { ThemeProvider } from '@/components/theme-provider'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
   title: 'SINAG',
   description: 'Your trusted online store',
   manifest: '/manifest.json',
   appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'SINAG',
   },
}

export const viewport = {
   width: 'device-width',
   initialScale: 1,
   maximumScale: 1,
   themeColor: '#0a0a0a',
}

export default function RootLayout({
   children,
}: {
   children: React.ReactNode
}) {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            <link rel="apple-touch-icon" href="/sinag.png" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="format-detection" content="telephone=no" />
         </head>
         <body className={inter.className}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
               {children}
            </ThemeProvider>
         </body>
      </html>
   )
}