import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { AppProvider } from '../providers/AppProvider'
import AuthLayoutWrapper from '../components/auth/AuthLayoutWrapper'

// Optimized font loading dengan preload dan display swap
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-plus-jakarta',
  weight: ['300', '400', '500', '600', '700'],
  // Font optimization: reduce font weight variations for better performance
  fallback: ['system-ui', 'arial', 'sans-serif'],
  adjustFontFallback: true,
})
import './globals.css'

export const metadata: Metadata = {
  title: 'FutureGuide - Future Guide Platform',
  description: 'AI-Driven Talent Mapping Assessment Platform',
  generator: 'By FutureGuide',
  manifest: '/manifest.json',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FutureGuide',
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


export const viewport: Viewport = {
  themeColor: '#6475e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to font origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily}, ${plusJakartaSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
  --font-plus-jakarta: ${plusJakartaSans.variable};
}
        `}</style>
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} ${plusJakartaSans.variable}`}>
        <AppProvider>
          <AuthLayoutWrapper>
            {children}
          </AuthLayoutWrapper>
        </AppProvider>
      </body>
    </html>
  )
}
