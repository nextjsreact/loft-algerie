import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { getSession } from "@/lib/auth"
import { getUnreadNotificationsCount } from "@/app/actions/notifications"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ToastProvider } from '@/components/providers/toast-provider'
import { EnhancedRealtimeProvider } from '@/components/providers/enhanced-realtime-provider'
import { NotificationProvider } from '@/components/providers/notification-context'
import { CriticalAlertsNotification } from '@/components/executive/critical-alerts-notification'
import { InstallPrompt } from '@/components/pwa/install-prompt'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Loft Algérie - Gestion des Lofts",
  description: "Application complète de gestion des lofts, propriétaires, transactions et conversations en Algérie",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Loft Algérie",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4F46E5",
}

import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/lib/i18n/context"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession(); // Fetch session in the root layout
  const { count: unreadCount } = session ? await getUnreadNotificationsCount(session.user.id) : { count: null };

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Loft Algérie" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
          <ToastProvider />
          {session ? ( // Render full layout with sidebar/header if session exists
            <EnhancedRealtimeProvider userId={session.user.id}>
              <NotificationProvider userId={session.user.id}>
                <div className="flex h-screen bg-background md:gap-x-4">
                  <div className="hidden md:flex">
                    <Sidebar user={session.user} unreadCount={unreadCount} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Header user={session.user} />
                    <main className="flex-1 overflow-y-auto">
                      {children}
                    </main>
                  </div>
                  {/* Notifications d'alertes critiques pour les executives */}
                  <CriticalAlertsNotification 
                    userId={session.user.id} 
                    userRole={session.user.role} 
                  />
                  {/* Prompt d'installation PWA */}
                  <InstallPrompt />
                </div>
              </NotificationProvider>
            </EnhancedRealtimeProvider>
          ) : ( // Render children directly (e.g., login page) if no session
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          )}
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
