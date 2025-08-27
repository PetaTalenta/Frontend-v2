/**
 * PANDUAN STRATEGI RENDERING UNTUK PETATALENTA
 * 
 * Pilih strategi yang tepat berdasarkan karakteristik halaman:
 * - SSG: Konten statis yang jarang berubah
 * - ISR: Konten yang berubah berkala
 * - SSR: Konten yang sangat personal/dinamis
 * - CSR: Interaksi real-time
 */

// ===== STATIC SITE GENERATION (SSG) =====
// Gunakan untuk: Landing page, About, FAQ, Blog posts

export const SSG_CONFIG = {
  // Halaman yang cocok untuk SSG
  STATIC_PAGES: [
    '/',           // Landing page
    '/about',      // About page
    '/faq',        // FAQ page
    '/privacy',    // Privacy policy
    '/terms',      // Terms of service
  ],
  
  // Build time data fetching
  BUILD_TIME_FETCH: true,
  
  // Fallback strategy
  FALLBACK: 'blocking' as const, // atau false untuk pre-render semua
};

// Contoh implementasi SSG
export async function getStaticProps() {
  // Fetch data at build time
  const staticData = await fetchStaticContent();
  
  return {
    props: {
      data: staticData,
    },
    // Revalidate setiap 24 jam (ISR)
    revalidate: 86400,
  };
}

// ===== INCREMENTAL STATIC REGENERATION (ISR) =====
// Gunakan untuk: Assessment results, User profiles (public), Blog dengan update berkala

export const ISR_CONFIG = {
  // Revalidation intervals
  REVALIDATE_INTERVALS: {
    ASSESSMENT_RESULTS: 3600,    // 1 hour - hasil assessment
    USER_PROFILES: 1800,         // 30 minutes - profil publik
    BLOG_POSTS: 86400,          // 24 hours - blog posts
    STATISTICS: 300,            // 5 minutes - statistik umum
  },
  
  // Fallback pages
  FALLBACK_PAGES: [
    '/results/[id]',     // Assessment results
    '/profile/[id]',     // Public profiles
    '/blog/[slug]',      // Blog posts
  ],
};

// Contoh implementasi ISR untuk hasil assessment
export async function getStaticPropsForResults(context: { params: { id: string } }) {
  const { id } = context.params;
  
  try {
    const result = await fetchAssessmentResult(id);
    
    if (!result) {
      return {
        notFound: true,
        revalidate: 60, // Coba lagi dalam 1 menit
      };
    }
    
    return {
      props: {
        result,
        generatedAt: new Date().toISOString(),
      },
      revalidate: ISR_CONFIG.REVALIDATE_INTERVALS.ASSESSMENT_RESULTS,
    };
  } catch (error) {
    return {
      notFound: true,
      revalidate: 60,
    };
  }
}

// ===== SERVER-SIDE RENDERING (SSR) =====
// Gunakan untuk: Dashboard, Private profiles, Real-time data

export const SSR_CONFIG = {
  // Halaman yang memerlukan SSR
  DYNAMIC_PAGES: [
    '/dashboard',        // User dashboard
    '/assessment/[id]',  // Assessment in progress
    '/admin/*',          // Admin pages
    '/api-test/*',       // Testing pages
  ],
  
  // Cache headers untuk SSR
  CACHE_HEADERS: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
};

// Contoh implementasi SSR untuk dashboard
export async function getServerSidePropsForDashboard(context: any) {
  const { req, res } = context;
  
  // Set cache headers
  res.setHeader('Cache-Control', SSR_CONFIG.CACHE_HEADERS['Cache-Control']);
  
  // Get user from session/token
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return {
      redirect: {
        destination: '/auth',
        permanent: false,
      },
    };
  }
  
  // Fetch user-specific data
  const [dashboardData, notifications] = await Promise.all([
    fetchUserDashboard(user.id),
    fetchUserNotifications(user.id),
  ]);
  
  return {
    props: {
      user,
      dashboardData,
      notifications,
      timestamp: Date.now(),
    },
  };
}

// ===== CLIENT-SIDE RENDERING (CSR) =====
// Gunakan untuk: Chat, Real-time updates, Interactive components

export const CSR_CONFIG = {
  // Komponen yang dimuat di client
  CLIENT_ONLY_COMPONENTS: [
    'ChatInterface',
    'RealtimeNotifications', 
    'AssessmentProgress',
    'WebSocketComponents',
  ],
  
  // SWR configuration untuk CSR
  SWR_CONFIG: {
    refreshInterval: 30000,      // 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  },
};

// ===== HYBRID RENDERING STRATEGY =====
// Kombinasi strategi untuk performa optimal

export const HYBRID_STRATEGY = {
  // Landing dan marketing pages
  STATIC: [
    '/',
    '/about', 
    '/features',
    '/pricing',
  ],
  
  // Content yang update berkala
  ISR: [
    '/results/[id]',
    '/blog/[slug]',
    '/stats',
  ],
  
  // User-specific content
  SSR: [
    '/dashboard',
    '/profile/edit',
    '/admin/*',
  ],
  
  // Interactive features
  CSR: [
    '/assessment/[id]', // Assessment form
    '/chat',           // Chat interface
    '/live-stats',     // Real-time statistics
  ],
};

// ===== PERFORMANCE MONITORING =====

export interface RenderingMetrics {
  strategy: 'SSG' | 'ISR' | 'SSR' | 'CSR';
  ttfb: number;        // Time to First Byte
  fcp: number;         // First Contentful Paint
  lcp: number;         // Largest Contentful Paint
  cls: number;         // Cumulative Layout Shift
  fid: number;         // First Input Delay
}

export function trackRenderingPerformance(strategy: string) {
  if (typeof window === 'undefined') return;
  
  // Measure Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
}

// ===== UTILITY FUNCTIONS =====

async function fetchStaticContent() {
  // Implement static content fetching
  return {};
}

async function fetchAssessmentResult(id: string) {
  // Implement assessment result fetching
  return null;
}

async function getUserFromRequest(req: any) {
  // Implement user authentication
  return null;
}

async function fetchUserDashboard(userId: string) {
  // Implement dashboard data fetching
  return {};
}

async function fetchUserNotifications(userId: string) {
  // Implement notifications fetching
  return [];
}

// ===== IMPLEMENTATION GUIDE =====

/*
PANDUAN IMPLEMENTASI:

1. UNTUK HALAMAN LANDING (/):
   - Gunakan SSG dengan getStaticProps
   - Pre-render di build time
   - Cache di CDN untuk performa maksimal

2. UNTUK HASIL ASSESSMENT (/results/[id]):
   - Gunakan ISR dengan revalidate 1 jam
   - Fallback: 'blocking' untuk hasil baru
   - Cache di edge untuk akses cepat

3. UNTUK DASHBOARD (/dashboard):
   - Gunakan SSR dengan getServerSideProps
   - Fetch data user-specific di server
   - No-cache headers untuk data fresh

4. UNTUK ASSESSMENT FORM (/assessment/[id]):
   - Gunakan CSR dengan SWR
   - Real-time progress tracking
   - WebSocket untuk live updates

CONTOH IMPLEMENTASI:

// pages/index.tsx (SSG)
export async function getStaticProps() {
  return {
    props: { data: await fetchStaticContent() },
    revalidate: 86400
  };
}

// pages/results/[id].tsx (ISR)
export async function getStaticProps({ params }) {
  return {
    props: { result: await fetchResult(params.id) },
    revalidate: 3600
  };
}

// pages/dashboard.tsx (SSR)
export async function getServerSideProps({ req }) {
  const user = await getUserFromRequest(req);
  return {
    props: { user, data: await fetchUserData(user.id) }
  };
}
*/
