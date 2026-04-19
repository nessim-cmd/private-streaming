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
          colorText: '#ffffff',
          colorBackground: '#1a1a24',
          colorInputBackground: '#252533',
          colorInputText: '#ffffff',
          colorTextSecondary: '#e4e4e7',
          colorTextOnPrimaryBackground: '#ffffff',
          colorDanger: '#ef4444',
          colorSuccess: '#22c55e',
          colorWarning: '#f59e0b',
        },
        elements: {
          card: "bg-[#1c1c26] border border-white/20 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-2xl",
          navbar: "hidden",
          headerTitle: "text-2xl font-bold tracking-tight text-white !text-white",
          headerSubtitle: "text-zinc-300 !text-zinc-300",
          socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 text-white !text-white",
          socialButtonsBlockButtonText: "text-white !text-white font-medium",
          formFieldLabel: "text-zinc-200 !text-zinc-200 font-medium mb-1.5",
          formFieldInput: "bg-[#252533] border border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white !text-white py-3",
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-white !text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)] mt-2",
          footerActionLink: "text-primary hover:text-primary/80 font-semibold",
          dividerLine: "bg-white/10",
          dividerText: "text-zinc-400 !text-zinc-400 uppercase text-xs font-bold tracking-widest",
          identityPreviewText: "text-white !text-white",
          identityPreviewEditButton: "text-primary hover:text-primary/80",
          footerActionText: "text-zinc-400 !text-zinc-400",
          formFieldInputShowPasswordButton: "text-zinc-400 !text-zinc-400",
          footer: "hidden",
          socialButtonsIconButton: "bg-white/5 border border-white/10 hover:bg-white/10 transition-all",
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

