import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import '@livekit/components-styles'
import { Navbar } from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PrivateLive | Private Live Streaming Rooms',
  description: 'Create private live streaming rooms and invite guests via link, email, or QR code.',
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
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
