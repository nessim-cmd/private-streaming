import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import '@livekit/components-styles'
import { Navbar } from '@/components/Navbar'
import { ServiceWorkerRegister } from '@/components/PWA/ServiceWorkerRegister'
import { PWAInstallPrompt } from '@/components/PWA/PWAInstallPrompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PrivateLive | Private Live Streaming Rooms',
  description: 'Create private live streaming rooms and invite guests via link, email, or QR code.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PrivateLive',
  },
}

export const viewport: Viewport = {
  themeColor: '#5447ec',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" className="dark">
        <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground`}>
          <div className="gradient-bg fixed inset-0 -z-10 pointer-events-none" />
          <ServiceWorkerRegister />
          <Navbar />
          <main className="flex-1 flex flex-col safe-pb">
            {children}
          </main>
          <PWAInstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  )
}
