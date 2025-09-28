// Contoh implementasi komponen yang sudah dioptimasi dengan prefetch dan caching

import React from 'react';
import { Button } from '../components/ui/button';
import { NavigationLink, ContentLink, PrefetchLink } from '../components/prefetch/PrefetchLink';
import { useCachedSWR } from '../hooks/useCachedSWR';
import { useBackgroundSync } from '../hooks/useBackgroundSync';
import { ArrowRight, User, LogOut, TrendingUp } from 'lucide-react';

// ===== OPTIMIZED LANDING PAGE HEADER =====
export function OptimizedLandingPageHeader() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-[#6475e9]">FutureGuide</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Menggunakan NavigationLink untuk navigasi utama */}
            <NavigationLink href="/auth">
              <Button variant="ghost" className="text-gray-600 hover:text-[#6475e9]">
                Masuk
              </Button>
            </NavigationLink>
            <NavigationLink href="/auth">
              <Button className="bg-[#6475e9] hover:bg-[#5a6bd8]">
                Mulai Sekarang
              </Button>
            </NavigationLink>
          </div>
        </div>
      </div>
    </header>
  );
}

// ===== OPTIMIZED HERO SECTION =====
export function OptimizedHeroSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-[#1f2937] mb-6">
          Temukan Potensi Terbaik Anda dengan
          <span className="text-[#6475e9] block">AI-Driven Assessment</span>
        </h1>
        <p className="text-xl text-[#6b7280] mb-8 max-w-3xl mx-auto">
          Platform assessment kepribadian dan bakat yang menggunakan AI untuk memberikan 
          analisis mendalam tentang potensi karir dan pengembangan diri Anda.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* High priority prefetch untuk CTA utama */}
          <NavigationLink href="/auth">
            <Button size="lg" className="bg-[#6475e9] hover:bg-[#5a6bd8] text-lg px-8 py-3">
              Mulai Assessment Gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </NavigationLink>
          
          {/* Content link untuk secondary action */}
          <ContentLink href="/about" prefetchOnVisible={true}>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Pelajari Lebih Lanjut
            </Button>
          </ContentLink>
        </div>
      </div>
    </section>
  );
}

// ===== OPTIMIZED DASHBOARD NAVIGATION =====
export function OptimizedDashboardNavigation() {
  // Background sync untuk data user
  const { syncStats } = useBackgroundSync({
    enabled: true,
    setupCommonTasks: true
  });

  return (
    <nav className="dashboard-navigation">
      <div className="nav-items">
        {/* Navigation links dengan prefetch priority tinggi */}
        <NavigationLink 
          href="/dashboard" 
          className="nav-item"
          prefetchPriority="high"
        >
          <TrendingUp className="w-5 h-5" />
          Dashboard
        </NavigationLink>

        <NavigationLink 
          href="/assessment" 
          className="nav-item"
          prefetchPriority="high"
        >
          <User className="w-5 h-5" />
          Assessment
        </NavigationLink>

        <NavigationLink 
          href="/results" 
          className="nav-item"
          prefetchPriority="medium"
        >
          <TrendingUp className="w-5 h-5" />
          Results
        </NavigationLink>

        {/* Conditional prefetch berdasarkan sync status */}
        <PrefetchLink 
          href="/profile" 
          className="nav-item"
          prefetchCondition={() => syncStats?.isOnline ?? true}
          prefetchOnHover={true}
        >
          <User className="w-5 h-5" />
          Profile
        </PrefetchLink>
      </div>
    </nav>
  );
}

// ===== OPTIMIZED ASSESSMENT CARD =====
export function OptimizedAssessmentCard({ assessment }: { assessment: any }) {
  // Cached data untuk assessment details
  const { data: assessmentDetails, cacheStats } = useCachedSWR(
    `/api/assessment/${assessment.id}`,
    null,
    {
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      cacheFirst: true,
      backgroundSync: true
    }
  );

  return (
    <div className="assessment-card">
      <div className="card-header">
        <h3>{assessment.title}</h3>
        <p>{assessment.description}</p>
        
        {/* Cache status indicator untuk development */}
        {process.env.NODE_ENV === 'development' && cacheStats.isFromCache && (
          <span className="cache-indicator">📦 Cached</span>
        )}
      </div>
      
      <div className="card-actions">
        {/* High priority prefetch untuk start assessment */}
        <NavigationLink 
          href={`/assessment/${assessment.id}`}
          prefetchPriority="high"
          prefetchImmediately={true}
        >
          <Button>Start Assessment</Button>
        </NavigationLink>
        
        {/* Medium priority untuk view results */}
        <ContentLink 
          href={`/results/${assessment.id}`}
          prefetchOnVisible={true}
          prefetchPriority="medium"
        >
          <Button variant="outline">View Results</Button>
        </ContentLink>
      </div>
    </div>
  );
}

// ===== OPTIMIZED BREADCRUMB =====
export function OptimizedBreadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <ContentLink 
              href={item.href}
              className="breadcrumb-link"
              prefetchOnHover={true}
              prefetchPriority="low"
            >
              {item.label}
            </ContentLink>
          ) : (
            <span className="breadcrumb-current">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="breadcrumb-separator">/</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ===== OPTIMIZED PAGINATION =====
export function OptimizedPagination({ 
  currentPage, 
  totalPages, 
  baseUrl 
}: { 
  currentPage: number; 
  totalPages: number; 
  baseUrl: string; 
}) {
  return (
    <div className="pagination">
      {/* Previous page */}
      {currentPage > 1 && (
        <PrefetchLink 
          href={`${baseUrl}?page=${currentPage - 1}`}
          className="pagination-link"
          prefetchOnHover={true}
          prefetchPriority="medium"
        >
          Previous
        </PrefetchLink>
      )}

      {/* Page numbers */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <PrefetchLink
          key={page}
          href={`${baseUrl}?page=${page}`}
          className={`pagination-number ${page === currentPage ? 'active' : ''}`}
          prefetchOnVisible={Math.abs(page - currentPage) <= 2} // Prefetch nearby pages
          prefetchPriority="low"
        >
          {page}
        </PrefetchLink>
      ))}

      {/* Next page */}
      {currentPage < totalPages && (
        <PrefetchLink 
          href={`${baseUrl}?page=${currentPage + 1}`}
          className="pagination-link"
          prefetchOnHover={true}
          prefetchPriority="medium"
        >
          Next
        </PrefetchLink>
      )}
    </div>
  );
}

// ===== OPTIMIZED SIDEBAR MENU =====
export function OptimizedSidebarMenu({ menuItems }: { menuItems: Array<{ label: string; href: string; icon: React.ReactNode }> }) {
  return (
    <div className="sidebar-menu">
      {menuItems.map((item, index) => (
        <NavigationLink
          key={index}
          href={item.href}
          className="sidebar-menu-item"
          prefetchPriority={index < 3 ? "high" : "medium"} // First 3 items high priority
          prefetchOnHover={true}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavigationLink>
      ))}
    </div>
  );
}

// ===== OPTIMIZED CARD GRID =====
export function OptimizedCardGrid({ cards }: { cards: Array<{ id: string; title: string; href: string }> }) {
  return (
    <div className="card-grid">
      {cards.map((card, index) => (
        <ContentLink
          key={card.id}
          href={card.href}
          className="card-item"
          prefetchOnVisible={true}
          prefetchPriority={index < 6 ? "medium" : "low"} // First 6 cards medium priority
          prefetchDelay={index * 100} // Stagger prefetch to avoid overwhelming
        >
          <div className="card-content">
            <h3>{card.title}</h3>
          </div>
        </ContentLink>
      ))}
    </div>
  );
}

// ===== USAGE EXAMPLES =====

// Example: Replace regular Link with optimized versions
/*
// BEFORE:
<Link href="/dashboard">
  <Button>Go to Dashboard</Button>
</Link>

// AFTER:
<NavigationLink href="/dashboard">
  <Button>Go to Dashboard</Button>
</NavigationLink>
*/

// Example: Use cached SWR for data fetching
/*
// BEFORE:
const { data } = useSWR('/api/user', fetcher);

// AFTER:
const { data, cacheStats } = useCachedSWR('/api/user', fetcher, {
  cacheTTL: 10 * 60 * 1000, // 10 minutes
  cacheFirst: true,
  backgroundSync: true
});
*/

// Example: Conditional prefetching
/*
<PrefetchLink 
  href="/premium-feature"
  prefetchCondition={() => user?.isPremium}
  prefetchOnHover={true}
>
  Premium Feature
</PrefetchLink>
*/
