'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

/**
 * KOMPONEN OPTIMASI SCRIPT PIHAK KETIGA
 * 
 * Mengoptimalkan loading script eksternal untuk mengurangi blocking time
 */

// ===== GOOGLE ANALYTICS =====

interface GoogleAnalyticsProps {
  measurementId: string;
  enabled?: boolean;
}

export function GoogleAnalytics({ measurementId, enabled = true }: GoogleAnalyticsProps) {
  if (!enabled || !measurementId) return null;

  return (
    <>
      {/* Load Google Analytics dengan strategy afterInteractive */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Google Analytics loaded');
        }}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />
    </>
  );
}

// ===== GOOGLE TAG MANAGER =====

interface GoogleTagManagerProps {
  containerId: string;
  enabled?: boolean;
}

export function GoogleTagManager({ containerId, enabled = true }: GoogleTagManagerProps) {
  if (!enabled || !containerId) return null;

  return (
    <>
      {/* GTM Script */}
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${containerId}');
          `,
        }}
      />
      
      {/* GTM NoScript fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}

// ===== FACEBOOK PIXEL =====

interface FacebookPixelProps {
  pixelId: string;
  enabled?: boolean;
}

export function FacebookPixel({ pixelId, enabled = true }: FacebookPixelProps) {
  if (!enabled || !pixelId) return null;

  return (
    <Script
      id="facebook-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}

// ===== CHAT WIDGET =====

interface ChatWidgetProps {
  widgetId: string;
  enabled?: boolean;
  lazyLoad?: boolean;
}

export function ChatWidget({ widgetId, enabled = true, lazyLoad = true }: ChatWidgetProps) {
  const [shouldLoad, setShouldLoad] = useState(!lazyLoad);

  useEffect(() => {
    if (lazyLoad) {
      // Load chat widget setelah user interaction atau scroll
      const handleUserInteraction = () => {
        setShouldLoad(true);
        // Remove listeners setelah triggered
        window.removeEventListener('scroll', handleUserInteraction);
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('keydown', handleUserInteraction);
      };

      // Delay loading sampai user berinteraksi
      window.addEventListener('scroll', handleUserInteraction, { passive: true });
      window.addEventListener('click', handleUserInteraction);
      window.addEventListener('keydown', handleUserInteraction);

      // Auto-load setelah 10 detik jika tidak ada interaksi
      const timeout = setTimeout(() => {
        setShouldLoad(true);
      }, 10000);

      return () => {
        clearTimeout(timeout);
        window.removeEventListener('scroll', handleUserInteraction);
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('keydown', handleUserInteraction);
      };
    }
  }, [lazyLoad]);

  if (!enabled || !widgetId || !shouldLoad) return null;

  return (
    <Script
      id="chat-widget"
      strategy="lazyOnload"
      src={`https://widget.chatprovider.com/widget.js?id=${widgetId}`}
      onLoad={() => {
        console.log('Chat widget loaded');
      }}
    />
  );
}

// ===== HOTJAR =====

interface HotjarProps {
  hjid: string;
  hjsv: string;
  enabled?: boolean;
}

export function Hotjar({ hjid, hjsv, enabled = true }: HotjarProps) {
  if (!enabled || !hjid) return null;

  return (
    <Script
      id="hotjar"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${hjid},hjsv:${hjsv}};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `,
      }}
    />
  );
}

// ===== PERFORMANCE MONITORING =====

interface PerformanceMonitoringProps {
  enabled?: boolean;
}

export function PerformanceMonitoring({ enabled = true }: PerformanceMonitoringProps) {
  if (!enabled) return null;

  return (
    <Script
      id="performance-monitoring"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          // Monitor Core Web Vitals
          function sendToAnalytics(metric) {
            if (typeof gtag !== 'undefined') {
              gtag('event', metric.name, {
                event_category: 'Web Vitals',
                event_label: metric.id,
                value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
                non_interaction: true,
              });
            }
          }

          // Load web-vitals library
          import('https://unpkg.com/web-vitals@3/dist/web-vitals.js').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
            onCLS(sendToAnalytics);
            onFID(sendToAnalytics);
            onFCP(sendToAnalytics);
            onLCP(sendToAnalytics);
            onTTFB(sendToAnalytics);
          });
        `,
      }}
    />
  );
}

// ===== SCRIPT MANAGER COMPONENT =====

interface ScriptManagerProps {
  config: {
    googleAnalytics?: { measurementId: string; enabled?: boolean };
    googleTagManager?: { containerId: string; enabled?: boolean };
    facebookPixel?: { pixelId: string; enabled?: boolean };
    chatWidget?: { widgetId: string; enabled?: boolean; lazyLoad?: boolean };
    hotjar?: { hjid: string; hjsv: string; enabled?: boolean };
    performanceMonitoring?: { enabled?: boolean };
  };
}

export function ScriptManager({ config }: ScriptManagerProps) {
  return (
    <>
      {/* Critical scripts first */}
      {config.googleAnalytics && (
        <GoogleAnalytics {...config.googleAnalytics} />
      )}
      
      {config.googleTagManager && (
        <GoogleTagManager {...config.googleTagManager} />
      )}
      
      {/* Non-critical scripts */}
      {config.facebookPixel && (
        <FacebookPixel {...config.facebookPixel} />
      )}
      
      {config.hotjar && (
        <Hotjar {...config.hotjar} />
      )}
      
      {/* Lazy loaded scripts */}
      {config.chatWidget && (
        <ChatWidget {...config.chatWidget} />
      )}
      
      {/* Performance monitoring */}
      {config.performanceMonitoring && (
        <PerformanceMonitoring {...config.performanceMonitoring} />
      )}
    </>
  );
}

// ===== SCRIPT OPTIMIZATION UTILITIES =====

/**
 * Preconnect ke domain pihak ketiga
 */
export function getThirdPartyPreconnects() {
  return [
    { rel: 'preconnect', href: 'https://www.googletagmanager.com' },
    { rel: 'preconnect', href: 'https://www.google-analytics.com' },
    { rel: 'preconnect', href: 'https://connect.facebook.net' },
    { rel: 'preconnect', href: 'https://static.hotjar.com' },
    { rel: 'dns-prefetch', href: 'https://widget.chatprovider.com' },
  ];
}

/**
 * Monitor script loading performance
 */
export function monitorScriptPerformance() {
  if (typeof window === 'undefined') return;

  // Monitor script loading times
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'resource' && entry.name.includes('.js')) {
        console.log(`Script ${entry.name} loaded in ${entry.duration}ms`);
        
        // Track slow scripts
        if (entry.duration > 1000) {
          console.warn(`Slow script detected: ${entry.name} (${entry.duration}ms)`);
        }
      }
    });
  });

  observer.observe({ entryTypes: ['resource'] });
}

// ===== USAGE EXAMPLE =====

/*
CONTOH PENGGUNAAN:

1. Di layout.tsx:
```tsx
import { ScriptManager, getThirdPartyPreconnects } from '@/components/optimization/OptimizedScripts';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {getThirdPartyPreconnects().map((link, index) => (
          <link key={index} {...link} />
        ))}
      </head>
      <body>
        {children}
        
        <ScriptManager
          config={{
            googleAnalytics: {
              measurementId: 'GA_MEASUREMENT_ID',
              enabled: process.env.NODE_ENV === 'production'
            },
            chatWidget: {
              widgetId: 'CHAT_WIDGET_ID',
              enabled: true,
              lazyLoad: true
            },
            performanceMonitoring: {
              enabled: true
            }
          }}
        />
      </body>
    </html>
  );
}
```

2. Individual usage:
```tsx
<GoogleAnalytics 
  measurementId="GA_MEASUREMENT_ID" 
  enabled={process.env.NODE_ENV === 'production'} 
/>

<ChatWidget 
  widgetId="CHAT_WIDGET_ID" 
  lazyLoad={true} 
/>
```
*/
