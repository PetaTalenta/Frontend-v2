/**
 * KONFIGURASI OPTIMASI FONT UNTUK FutureGuide
 * 
 * Optimasi font untuk mengurangi CLS dan meningkatkan performa loading
 */

import { Plus_Jakarta_Sans, Inter, Roboto } from 'next/font/google';

// ===== PRIMARY FONTS =====

/**
 * Plus Jakarta Sans - Font utama untuk UI
 * Digunakan untuk: Heading, body text, buttons
 */
export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-plus-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
  fallback: ['system-ui', 'arial'],
});

/**
 * Inter - Font alternatif untuk readability
 * Digunakan untuk: Long-form content, descriptions
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: false, // Lazy load karena tidak critical
  variable: '--font-inter',
  weight: ['400', '500', '600'],
  fallback: ['system-ui', 'arial'],
});

/**
 * Roboto - Font untuk data dan numbers
 * Digunakan untuk: Statistics, numbers, data tables
 */
export const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
  fallback: ['monospace'],
});

// ===== FONT LOADING STRATEGY =====

export const FONT_STRATEGY = {
  // Critical fonts yang dimuat immediately
  CRITICAL: [
    plusJakartaSans,
  ],
  
  // Non-critical fonts yang dimuat setelah critical content
  NON_CRITICAL: [
    inter,
    roboto,
  ],
  
  // Font display strategies
  DISPLAY_STRATEGIES: {
    CRITICAL: 'swap' as const,      // Swap immediately untuk critical fonts
    NON_CRITICAL: 'optional' as const, // Optional untuk non-critical fonts
  },
  
  // Preload configuration
  PRELOAD: {
    ENABLED: true,
    CRITICAL_ONLY: true,
  },
};

// ===== FONT OPTIMIZATION UTILITIES =====

/**
 * Generate font CSS variables untuk Tailwind
 */
export function getFontVariables() {
  return {
    '--font-plus-jakarta': plusJakartaSans.style.fontFamily,
    '--font-inter': inter.style.fontFamily,
    '--font-roboto': roboto.style.fontFamily,
  };
}

/**
 * Generate font class names untuk body
 */
export function getFontClassNames() {
  return [
    plusJakartaSans.variable,
    inter.variable,
    roboto.variable,
  ].join(' ');
}

/**
 * Font preload links untuk head
 */
export function getFontPreloadLinks() {
  return [
    // Google Fonts preconnect
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    
    // Critical font preload
    {
      rel: 'preload',
      href: '/fonts/plus-jakarta-sans-latin-400.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload', 
      href: '/fonts/plus-jakarta-sans-latin-600.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
  ];
}

// ===== FONT FALLBACK SYSTEM =====

export const FONT_FALLBACKS = {
  // System font stack untuk fallback
  SYSTEM_STACK: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Open Sans',
    'Helvetica Neue',
    'sans-serif',
  ].join(', '),
  
  // Monospace stack untuk code/data
  MONOSPACE_STACK: [
    'ui-monospace',
    'SFMono-Regular',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ].join(', '),
};

// ===== FONT PERFORMANCE MONITORING =====

/**
 * Monitor font loading performance
 */
export function monitorFontLoading() {
  if (typeof window === 'undefined') return;
  
  // Check if fonts are loaded
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      console.log('All fonts loaded');
      
      // Measure font loading time
      const fontLoadTime = performance.now();
      console.log(`Font load time: ${fontLoadTime}ms`);
      
      // Track font loading in analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'font_loaded', {
          event_category: 'performance',
          event_label: 'all_fonts',
          value: Math.round(fontLoadTime),
        });
      }
    });
    
    // Monitor individual font loading
    const criticalFonts = [
      'Plus Jakarta Sans',
    ];
    
    criticalFonts.forEach(fontFamily => {
      document.fonts.load(`400 16px "${fontFamily}"`).then(() => {
        console.log(`${fontFamily} loaded`);
      }).catch(error => {
        console.warn(`Failed to load ${fontFamily}:`, error);
      });
    });
  }
}

// ===== CSS-IN-JS FONT STYLES =====

/**
 * Generate CSS untuk font optimization
 */
export function generateFontCSS() {
  return `
    /* Font face declarations dengan optimal loading */
    @font-face {
      font-family: 'Plus Jakarta Sans';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/fonts/plus-jakarta-sans-latin-400.woff2') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    
    @font-face {
      font-family: 'Plus Jakarta Sans';
      font-style: normal;
      font-weight: 600;
      font-display: swap;
      src: url('/fonts/plus-jakarta-sans-latin-600.woff2') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    
    /* Font loading optimization */
    .font-loading {
      font-family: ${FONT_FALLBACKS.SYSTEM_STACK};
    }
    
    .fonts-loaded {
      font-family: var(--font-plus-jakarta), ${FONT_FALLBACKS.SYSTEM_STACK};
    }
    
    /* Prevent layout shift during font loading */
    .font-display-swap {
      font-display: swap;
    }
    
    /* Size adjust untuk mengurangi layout shift */
    .font-size-adjust {
      font-size-adjust: 0.5;
    }
  `;
}

// ===== TAILWIND FONT CONFIGURATION =====

/**
 * Konfigurasi font untuk Tailwind CSS
 */
export const TAILWIND_FONT_CONFIG = {
  fontFamily: {
    sans: ['var(--font-plus-jakarta)', ...FONT_FALLBACKS.SYSTEM_STACK.split(', ')],
    inter: ['var(--font-inter)', ...FONT_FALLBACKS.SYSTEM_STACK.split(', ')],
    roboto: ['var(--font-roboto)', ...FONT_FALLBACKS.SYSTEM_STACK.split(', ')],
    mono: FONT_FALLBACKS.MONOSPACE_STACK.split(', '),
  },
  
  fontSize: {
    // Optimized font sizes dengan line-height
    'xs': ['0.75rem', { lineHeight: '1rem' }],
    'sm': ['0.875rem', { lineHeight: '1.25rem' }],
    'base': ['1rem', { lineHeight: '1.5rem' }],
    'lg': ['1.125rem', { lineHeight: '1.75rem' }],
    'xl': ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
};

// ===== USAGE EXAMPLES =====

/*
CONTOH PENGGUNAAN:

1. Di layout.tsx:
```tsx
import { getFontClassNames, getFontPreloadLinks } from '@/config/font-optimization';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {getFontPreloadLinks().map((link, index) => (
          <link key={index} {...link} />
        ))}
      </head>
      <body className={getFontClassNames()}>
        {children}
      </body>
    </html>
  );
}
```

2. Di tailwind.config.ts:
```ts
import { TAILWIND_FONT_CONFIG } from '@/config/font-optimization';

module.exports = {
  theme: {
    extend: {
      fontFamily: TAILWIND_FONT_CONFIG.fontFamily,
      fontSize: TAILWIND_FONT_CONFIG.fontSize,
    },
  },
};
```

3. Di komponen:
```tsx
<h1 className="font-sans font-bold text-2xl">
  Heading dengan Plus Jakarta Sans
</h1>

<p className="font-inter text-base">
  Body text dengan Inter
</p>

<div className="font-roboto font-medium">
  123,456 - Numbers dengan Roboto
</div>
```
*/
