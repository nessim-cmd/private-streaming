import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import '@livekit/components-styles'
import { Navbar } from '@/components/Navbar'
import { ServiceWorkerRegister } from '@/components/PWA/ServiceWorkerRegister'
import { PWAInstallPrompt } from '@/components/PWA/PWAInstallPrompt'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'PrivateLive | Next-Gen Private Streaming',
  description: 'Experience secure, private live streaming simplified. Invite guests via unique links, QR codes, or direct email.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PrivateLive',
  },
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
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
    <ClerkProvider 
      afterSignOutUrl="/"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#7c3aed',
        },
        elements: {
          card: "glass border border-white/10 rounded-[2rem]",
          navbar: "hidden",
        }
      }}
    >
      <html lang="en" className="dark">
        <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen flex flex-col bg-background text-foreground`}>
          <ServiceWorkerRegister />
          <Navbar />
          <main className="flex-1 flex flex-col relative z-10">
            {children}
          </main>
          <PWAInstallPrompt />
          
          {/* Global Design Elements */}
          <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent -z-10 pointer-events-none" />
        </body>
      </html>
    </ClerkProvider>
  )
}

