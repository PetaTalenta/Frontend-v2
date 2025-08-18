import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { TokenProvider } from '../contexts/TokenContext'
import AuthGuard from '../components/auth/AuthGuard'
import { Toaster } from '../components/ui/sonner'
import NavigationDebugPanel from '../components/debug/NavigationDebugPanel'
import DemoDataInitializer from '../components/debug/DemoDataInitializer'
import SWRProvider from '../components/providers/SWRProvider'
import PerformanceMonitor from '../components/performance/PerformanceMonitor'
import PerformanceInitializer from '../components/performance/PerformanceInitializer'
import RUMDashboard from '../components/monitoring/RUMDashboard'
import SimplePrefetchProvider from '../components/performance/SimplePrefetchProvider'
// OptimizationInitializer removed to prevent dynamic import issues

export const metadata: Metadata = {
  title: 'PetaTalenta - ATMA Platform',
  description: 'AI-Driven Talent Mapping Assessment Platform',
  generator: 'By PetaTalenta',
  manifest: '/manifest.json',
  themeColor: '#6475e9',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PetaTalenta',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <SimplePrefetchProvider
          enablePrefetch={true}
          enableCaching={true}
          debug={process.env.NODE_ENV === 'development'}
        >
          <SWRProvider>
            <AuthProvider>
              <TokenProvider>
                <AuthGuard>
                  {children}
                </AuthGuard>
              </TokenProvider>
            </AuthProvider>
            <DemoDataInitializer />
            <PerformanceInitializer />
            <Toaster />
            <NavigationDebugPanel />
            <PerformanceMonitor />
            <RUMDashboard />
          </SWRProvider>
        </SimplePrefetchProvider>
      </body>
    </html>
  )
}
