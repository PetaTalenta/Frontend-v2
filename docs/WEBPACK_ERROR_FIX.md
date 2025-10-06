# Webpack Error Fix - Cannot Read Properties of Undefined

## Problem
Error terjadi saat runtime: `Uncaught Error: Cannot read properties of undefined (reading 'call')` di webpack.js line 712, dipicu dari layout.tsx line 87.

## Root Cause
Error ini disebabkan oleh beberapa faktor:

1. **SSR/Client Mismatch**: Komponen client-side (SimplePrefetchProvider, PerformanceInitializer) mencoba mengakses browser APIs sebelum component di-mount di client
2. **Dynamic Import Issues**: Dynamic imports ke library seperti `web-vitals` tidak di-handle dengan proper error boundaries
3. **Webpack Module Factory Error**: Webpack gagal memanggil module factory karena module belum sepenuhnya ter-load atau ter-resolve

## Solutions Implemented

### 1. Layout Structure Reorganization (`src/app/layout.tsx`)
**Sebelum:**
```tsx
<SimplePrefetchProvider>
  <SWRProvider>
    <AuthProvider>
      <TokenProvider>
        {children}
      </TokenProvider>
    </AuthProvider>
  </SWRProvider>
</SimplePrefetchProvider>
```

**Sesudah:**
```tsx
<SWRProvider>
  <AuthProvider>
    <TokenProvider>
      <SimplePrefetchProvider>
        {children}
      </SimplePrefetchProvider>
    </TokenProvider>
  </AuthProvider>
</SWRProvider>
```

**Alasan:** 
- Menempatkan SimplePrefetchProvider di dalam context providers untuk memastikan semua dependencies tersedia
- SWRProvider harus di luar karena menyediakan caching untuk semua komponen

### 2. Client-Side Mounting Guard (`SimplePrefetchProvider.tsx`)
**Penambahan:**
```tsx
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

if (!isMounted) {
  return <>{children}</>;
}
```

**Alasan:**
- Mencegah hydration mismatch antara server dan client
- Memastikan browser APIs hanya dipanggil setelah component ter-mount di client
- Menghindari webpack module loading error selama SSR

### 3. TypeScript Type Safety
**Perbaikan:**
```tsx
// Dari:
if (window.next && window.next.router) { ... }

// Menjadi:
const windowWithNext = window as any;
if (windowWithNext.next && windowWithNext.next.router) { ... }
```

**Alasan:**
- Menghindari TypeScript error untuk properties yang tidak ada di Window interface
- Tetap menjaga type safety dengan explicit casting

### 4. Web Vitals API Update (`PerformanceInitializer.tsx`)
**Sebelum:**
```tsx
import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => { ... })
```

**Sesudah:**
```tsx
import('web-vitals').then((webVitals) => {
  const { onCLS, onINP, onFCP, onLCP, onTTFB } = webVitals;
  // ...
})
```

**Alasan:**
- Web Vitals v3 menggunakan `onXXX` pattern, bukan `getXXX`
- FID diganti dengan INP (Interaction to Next Paint) di v3
- Menambahkan mounting guard dan error handling

### 5. Webpack Configuration Enhancement (`next.config.mjs`)
**Penambahan:**
```javascript
else {
  // In dev mode, ensure proper error handling for webpack
  config.optimization = {
    ...config.optimization,
    runtimeChunk: false,
    emitOnErrors: false,
  };
}
```

**Alasan:**
- `runtimeChunk: false` mencegah split runtime yang bisa menyebabkan module loading issues
- `emitOnErrors: false` mencegah build dengan errors yang bisa menghasilkan invalid bundles
- Memberikan error messages yang lebih jelas di development

## Testing Checklist

- [ ] Development server berjalan tanpa webpack errors
- [ ] Pages dapat di-navigate tanpa console errors
- [ ] Performance metrics (Web Vitals) ter-track dengan benar
- [ ] Prefetching berfungsi normal
- [ ] Production build berhasil tanpa errors
- [ ] SSR/Hydration tidak ada mismatch warnings

## Prevention Guidelines

### DO's:
1. ✅ Selalu gunakan mounting guards untuk client-side code:
   ```tsx
   const [isMounted, setIsMounted] = useState(false);
   useEffect(() => { setIsMounted(true); }, []);
   if (!isMounted) return <>{children}</>;
   ```

2. ✅ Wrap dynamic imports dengan proper error handling:
   ```tsx
   import('module').then(...).catch((error) => {
     console.error('Failed to load module:', error);
   });
   ```

3. ✅ Check `typeof window !== 'undefined'` sebelum akses browser APIs

4. ✅ Gunakan `'use client'` directive untuk components yang butuh browser APIs

### DON'Ts:
1. ❌ Jangan akses window/document di top-level module scope
2. ❌ Jangan gunakan browser-only libraries tanpa dynamic import
3. ❌ Jangan nest providers terlalu dalam tanpa alasan jelas
4. ❌ Jangan ignore webpack/TypeScript warnings

## Related Files
- `src/app/layout.tsx` - Main layout structure
- `src/components/performance/SimplePrefetchProvider.tsx` - Prefetch provider
- `src/components/performance/PerformanceInitializer.tsx` - Performance metrics
- `next.config.mjs` - Webpack configuration
- `.github/copilot-instructions.md` - Development guidelines

## References
- [Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [Web Vitals v3 Migration](https://github.com/GoogleChrome/web-vitals/blob/main/CHANGELOG.md)
- [React Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Webpack Module Loading](https://webpack.js.org/concepts/module-resolution/)
