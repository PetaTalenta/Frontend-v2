// Performance utilities for optimizing app performance

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  // Preload critical fonts
  const fontPreloads = [
    '/fonts/geist-sans.woff2',
    '/fonts/geist-mono.woff2'
  ];

  fontPreloads.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = font;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Preload critical images
  const imagePreloads = [
    '/logo.png',
    '/og-image.jpg'
  ];

  imagePreloads.forEach(image => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = image;
    link.as = 'image';
    document.head.appendChild(link);
  });
}

// Lazy load images with intersection observer
export function setupLazyLoading() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      }
    });
  });

  // Observe all lazy images
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// Prefetch next page resources
export function prefetchRoute(route: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = route;
  document.head.appendChild(link);
}

// Preload route for faster navigation
export function preloadRoute(route: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = route;
  link.as = 'document';
  document.head.appendChild(link);
}

// Measure and report Core Web Vitals
export function measureWebVitals() {
  if (typeof window === 'undefined') return;

  // Measure FCP (First Contentful Paint)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        console.log('FCP:', entry.startTime);
        // Report to analytics
        reportMetric('FCP', entry.startTime);
      }
    }
  });
  observer.observe({ entryTypes: ['paint'] });

  // Measure LCP (Largest Contentful Paint)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('LCP:', lastEntry.startTime);
    reportMetric('LCP', lastEntry.startTime);
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // Measure CLS (Cumulative Layout Shift)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
    console.log('CLS:', clsValue);
    reportMetric('CLS', clsValue);
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });

  // Measure FID (First Input Delay)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('FID:', (entry as any).processingStart - entry.startTime);
      reportMetric('FID', (entry as any).processingStart - entry.startTime);
    }
  });
  fidObserver.observe({ entryTypes: ['first-input'] });
}

// Report metrics to analytics
function reportMetric(name: string, value: number) {
  // In production, you would send this to your analytics service
  if (process.env.NODE_ENV === 'development') {
    console.log(`Performance Metric - ${name}:`, value);
  }
  
  // Example: Send to Google Analytics
  // gtag('event', 'web_vitals', {
  //   event_category: 'Performance',
  //   event_label: name,
  //   value: Math.round(value),
  //   non_interaction: true,
  // });
}

// Optimize bundle loading
export function optimizeBundleLoading() {
  if (typeof window === 'undefined') return;

  // Preload critical chunks
  const criticalChunks = [
    '/_next/static/chunks/main.js',
    '/_next/static/chunks/pages/_app.js'
  ];

  criticalChunks.forEach(chunk => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = chunk;
    link.as = 'script';
    document.head.appendChild(link);
  });
}

// Service Worker registration for caching
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (typeof window === 'undefined' || !(performance as any).memory) return;

  const memory = (performance as any).memory;
  const memoryInfo = {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit
  };

  console.log('Memory Usage:', memoryInfo);
  
  // Alert if memory usage is high
  const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
  if (usagePercentage > 80) {
    console.warn('High memory usage detected:', usagePercentage.toFixed(2) + '%');
  }

  return memoryInfo;
}

// Initialize all performance optimizations
export function initializePerformanceOptimizations() {
  preloadCriticalResources();
  setupLazyLoading();
  measureWebVitals();
  optimizeBundleLoading();
  registerServiceWorker();
  
  // Monitor memory usage every 30 seconds
  setInterval(monitorMemoryUsage, 30000);
}

// Route-based preloading
export function setupRoutePreloading() {
  if (typeof window === 'undefined') return;

  // Preload routes on hover
  document.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;
    
    if (link && link.href.startsWith(window.location.origin)) {
      prefetchRoute(link.href);
    }
  });

  // Preload routes on focus (for keyboard navigation)
  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;
    
    if (link && link.href.startsWith(window.location.origin)) {
      prefetchRoute(link.href);
    }
  });
}
