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

export const metadata: Metadata = {
  title: 'PetaTalenta - ATMA Platform',
  description: 'AI-Driven Talent Mapping Assessment Platform',
  generator: 'By PetaTalenta',
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
        <AuthProvider>
          <TokenProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </TokenProvider>
        </AuthProvider>
        <DemoDataInitializer />
        <Toaster />
        <NavigationDebugPanel />
      </body>
    </html>
  )
}
