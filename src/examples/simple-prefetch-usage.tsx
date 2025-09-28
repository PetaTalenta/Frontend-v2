// Contoh penggunaan SimplePrefetchProvider dan SimplePrefetchLink

import React from 'react';
import { SimplePrefetchLink } from '../components/performance/SimplePrefetchProvider';
import { Button } from '../components/ui/button';

// ===== CONTOH 1: Landing Page dengan Prefetch =====
export function OptimizedLandingPageExample() {
  return (
    <div className="landing-page">
      <header className="header">
        <h1>FutureGuide</h1>
        <nav>
          {/* Link navigasi dengan prefetch otomatis saat hover */}
          <SimplePrefetchLink 
            href="/auth" 
            className="nav-link"
            prefetchOnHover={true}
          >
            <Button variant="ghost">Masuk</Button>
          </SimplePrefetchLink>
          
          <SimplePrefetchLink 
            href="/auth" 
            className="nav-link"
            prefetchOnHover={true}
          >
            <Button>Mulai Sekarang</Button>
          </SimplePrefetchLink>
        </nav>
      </header>

      <main className="hero">
        <h1>Temukan Potensi Terbaik Anda</h1>
        <p>Platform assessment kepribadian dengan AI</p>
        
        {/* CTA button dengan prefetch */}
        <SimplePrefetchLink 
          href="/auth"
          prefetchOnHover={true}
        >
          <Button size="lg" className="cta-button">
            Mulai Assessment Gratis
          </Button>
        </SimplePrefetchLink>
      </main>
    </div>
  );
}

// ===== CONTOH 2: Dashboard Navigation =====
export function OptimizedDashboardNavigation() {
  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/assessment', label: 'Assessment', icon: '📝' },
    { href: '/results', label: 'Results', icon: '📈' },
    { href: '/profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <nav className="dashboard-nav">
      {navigationItems.map((item) => (
        <SimplePrefetchLink
          key={item.href}
          href={item.href}
          className="nav-item"
          prefetchOnHover={true}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </SimplePrefetchLink>
      ))}
    </nav>
  );
}

// ===== CONTOH 3: Assessment Card dengan Prefetch =====
export function OptimizedAssessmentCard({ assessment }: { assessment: any }) {
  return (
    <div className="assessment-card">
      <div className="card-header">
        <h3>{assessment.title}</h3>
        <p>{assessment.description}</p>
      </div>
      
      <div className="card-actions">
        {/* Prefetch halaman assessment saat hover */}
        <SimplePrefetchLink 
          href={`/assessment/${assessment.id}`}
          prefetchOnHover={true}
        >
          <Button>Start Assessment</Button>
        </SimplePrefetchLink>
        
        {/* Prefetch halaman results */}
        <SimplePrefetchLink 
          href={`/results/${assessment.id}`}
          prefetchOnHover={true}
        >
          <Button variant="outline">View Results</Button>
        </SimplePrefetchLink>
      </div>
    </div>
  );
}

// ===== CONTOH 4: Breadcrumb dengan Prefetch =====
export function OptimizedBreadcrumb({ 
  items 
}: { 
  items: Array<{ label: string; href?: string }> 
}) {
  return (
    <nav className="breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <SimplePrefetchLink 
              href={item.href}
              className="breadcrumb-link"
              prefetchOnHover={true}
            >
              {item.label}
            </SimplePrefetchLink>
          ) : (
            <span className="breadcrumb-current">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <span className="breadcrumb-separator">/</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ===== CONTOH 5: Card Grid dengan Prefetch =====
export function OptimizedCardGrid({ 
  cards 
}: { 
  cards: Array<{ id: string; title: string; href: string; description: string }> 
}) {
  return (
    <div className="card-grid">
      {cards.map((card) => (
        <SimplePrefetchLink
          key={card.id}
          href={card.href}
          className="card-item"
          prefetchOnHover={true}
        >
          <div className="card-content">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
        </SimplePrefetchLink>
      ))}
    </div>
  );
}

// ===== CONTOH 6: Sidebar Menu =====
export function OptimizedSidebarMenu({ 
  menuItems 
}: { 
  menuItems: Array<{ label: string; href: string; icon: string }> 
}) {
  return (
    <div className="sidebar-menu">
      {menuItems.map((item, index) => (
        <SimplePrefetchLink
          key={index}
          href={item.href}
          className="sidebar-menu-item"
          prefetchOnHover={true}
        >
          <span className="menu-icon">{item.icon}</span>
          <span className="menu-label">{item.label}</span>
        </SimplePrefetchLink>
      ))}
    </div>
  );
}

// ===== CONTOH 7: Pagination dengan Prefetch =====
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
        <SimplePrefetchLink 
          href={`${baseUrl}?page=${currentPage - 1}`}
          className="pagination-link"
          prefetchOnHover={true}
        >
          Previous
        </SimplePrefetchLink>
      )}

      {/* Page numbers - prefetch nearby pages */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <SimplePrefetchLink
          key={page}
          href={`${baseUrl}?page=${page}`}
          className={`pagination-number ${page === currentPage ? 'active' : ''}`}
          prefetchOnHover={Math.abs(page - currentPage) <= 2} // Only prefetch nearby pages
        >
          {page}
        </SimplePrefetchLink>
      ))}

      {/* Next page */}
      {currentPage < totalPages && (
        <SimplePrefetchLink 
          href={`${baseUrl}?page=${currentPage + 1}`}
          className="pagination-link"
          prefetchOnHover={true}
        >
          Next
        </SimplePrefetchLink>
      )}
    </div>
  );
}

// ===== USAGE EXAMPLES =====

/*
// CARA MENGGUNAKAN:

1. Ganti import Link biasa:
   // BEFORE:
   import Link from 'next/link';
   
   // AFTER:
   import { SimplePrefetchLink } from '@/components/performance/SimplePrefetchProvider';

2. Ganti komponen Link:
   // BEFORE:
   <Link href="/dashboard">Dashboard</Link>
   
   // AFTER:
   <SimplePrefetchLink href="/dashboard" prefetchOnHover={true}>
     Dashboard
   </SimplePrefetchLink>

3. Untuk navigasi penting, aktifkan prefetch:
   <SimplePrefetchLink 
     href="/assessment" 
     prefetchOnHover={true}
     className="important-nav"
   >
     Start Assessment
   </SimplePrefetchLink>

4. Untuk link dalam content, bisa disable prefetch jika tidak perlu:
   <SimplePrefetchLink 
     href="/terms" 
     prefetchOnHover={false}
     className="footer-link"
   >
     Terms of Service
   </SimplePrefetchLink>
*/

// ===== PERFORMANCE TIPS =====

/*
TIPS UNTUK PERFORMANCE OPTIMAL:

1. Aktifkan prefetch untuk navigasi utama:
   - Dashboard navigation
   - CTA buttons
   - Frequently accessed pages

2. Gunakan prefetch dengan bijak:
   - Jangan prefetch semua link
   - Fokus pada user journey yang umum
   - Pertimbangkan bandwidth user

3. Monitor performance:
   - Gunakan debug mode di development
   - Check network tab untuk melihat prefetch requests
   - Monitor Core Web Vitals

4. Test di berbagai kondisi:
   - Slow 3G connection
   - Mobile devices
   - Different browsers
*/
