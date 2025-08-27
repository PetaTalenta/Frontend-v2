'use client';

/**
 * CONTOH HALAMAN YANG SUDAH DIOPTIMASI PENUH
 * 
 * Mendemonstrasikan semua teknik optimasi yang telah diimplementasikan
 */

import { Suspense, useState, useCallback, useMemo } from 'react';
import { OptimizedImage, OptimizedLogo } from '@/components/optimization/OptimizedImage';
import { 
  LazyAssessmentRadarChart, 
  LazyCareerStatsCard,
  LazyPDFExporter,
  LazyOnVisible 
} from '@/components/optimization/LazyComponents';
import { useDebouncedState, useShallowState } from '@/hooks/useOptimizedState';
import { useCachedData, cacheKeys, cacheConfigs } from '@/lib/cache/advanced-cache';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ===== OPTIMIZED COMPONENTS =====

/**
 * Hero Section dengan optimasi gambar dan font
 */
function OptimizedHeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Background image dengan lazy loading */}
      <div className="absolute inset-0 z-0">
        <OptimizedImage
          src="/images/hero-background.jpg"
          alt="Hero Background"
          fill
          priority // Critical image
          sizes="100vw"
          className="object-cover"
          fallbackSrc="/images/hero-fallback.jpg"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        {/* Logo dengan optimasi */}
        <OptimizedLogo
          size="large"
          priority
          className="mx-auto mb-8"
        />
        
        {/* Heading dengan font yang dioptimasi */}
        <h1 className="font-plus-jakarta font-bold text-4xl md:text-6xl text-gray-900 mb-6">
          Temukan Potensi Terbaik Anda
        </h1>
        
        <p className="font-inter text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Platform assessment AI-driven untuk pemetaan talenta yang akurat dan komprehensif
        </p>
        
        {/* CTA Button */}
        <Button 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 font-semibold"
        >
          Mulai Assessment Gratis
        </Button>
      </div>
    </section>
  );
}

/**
 * Search Component dengan debouncing
 */
function OptimizedSearchComponent({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, debouncedQuery, setQuery] = useDebouncedState('', 300);
  
  // Memoized search handler
  const handleSearch = useCallback(() => {
    if (debouncedQuery.trim()) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);
  
  // Auto-search when debounced query changes
  useMemo(() => {
    handleSearch();
  }, [handleSearch]);
  
  return (
    <div className="relative max-w-md mx-auto">
      <Input
        type="text"
        placeholder="Cari assessment..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        🔍
      </div>
    </div>
  );
}

/**
 * Dashboard dengan caching dan lazy loading
 */
function OptimizedDashboard({ userId }: { userId: string }) {
  // Cached user data
  const { data: userData, loading: userLoading } = useCachedData(
    cacheKeys.user(userId),
    () => fetch(`/api/users/${userId}`).then(res => res.json()),
    cacheConfigs.user
  );
  
  // Cached dashboard data
  const { data: dashboardData, loading: dashboardLoading } = useCachedData(
    cacheKeys.dashboard(userId),
    () => fetch(`/api/dashboard/${userId}`).then(res => res.json()),
    cacheConfigs.dashboard
  );
  
  // State dengan shallow comparison
  const [filters, setFilters] = useShallowState({
    dateRange: '30d',
    assessmentType: 'all',
    sortBy: 'date',
  });
  
  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!dashboardData) return null;
    
    return dashboardData.assessments?.filter((assessment: any) => {
      if (filters.assessmentType !== 'all' && assessment.type !== filters.assessmentType) {
        return false;
      }
      // Add more filtering logic
      return true;
    });
  }, [dashboardData, filters]);
  
  if (userLoading || dashboardLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <OptimizedImage
            src={userData?.avatar || '/profile-placeholder.jpeg'}
            alt={userData?.name || 'User'}
            width={64}
            height={64}
            className="rounded-full"
          />
          <div>
            <h2 className="text-xl font-semibold">{userData?.name}</h2>
            <p className="text-gray-600">{userData?.email}</p>
          </div>
        </div>
      </Card>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.assessmentType}
            onChange={(e) => setFilters(prev => ({ ...prev, assessmentType: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">Semua Assessment</option>
            <option value="ocean">Big Five (OCEAN)</option>
            <option value="riasec">RIASEC</option>
            <option value="via">VIA Character Strengths</option>
          </select>
          
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
            <option value="90d">90 Hari Terakhir</option>
          </select>
        </div>
      </Card>
      
      {/* Charts - Lazy loaded */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LazyOnVisible>
          <LazyAssessmentRadarChart data={filteredData} />
        </LazyOnVisible>
        
        <LazyOnVisible>
          <LazyCareerStatsCard data={filteredData} />
        </LazyOnVisible>
      </div>
      
      {/* Assessment List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Assessment Terbaru</h3>
        <div className="space-y-3">
          {filteredData?.map((assessment: any) => (
            <AssessmentListItem key={assessment.id} assessment={assessment} />
          ))}
        </div>
      </Card>
    </div>
  );
}

/**
 * Assessment List Item dengan memoization
 */
const AssessmentListItem = React.memo(function AssessmentListItem({ 
  assessment 
}: { 
  assessment: any 
}) {
  const [showExportModal, setShowExportModal] = useState(false);
  
  const handleExport = useCallback(() => {
    setShowExportModal(true);
  }, []);
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center space-x-3">
        <OptimizedImage
          src={`/icons/${assessment.type}.svg`}
          alt={assessment.type}
          width={32}
          height={32}
        />
        <div>
          <h4 className="font-medium">{assessment.title}</h4>
          <p className="text-sm text-gray-600">{assessment.date}</p>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button variant="outline" size="sm">
          Lihat Hasil
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export PDF
        </Button>
      </div>
      
      {/* Lazy loaded PDF exporter */}
      {showExportModal && (
        <Suspense fallback={<div>Loading PDF exporter...</div>}>
          <LazyPDFExporter
            assessmentId={assessment.id}
            onClose={() => setShowExportModal(false)}
          />
        </Suspense>
      )}
    </div>
  );
});

/**
 * Loading skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="h-64 bg-gray-200 rounded"></div>
        </Card>
        <Card className="p-6">
          <div className="h-64 bg-gray-200 rounded"></div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Main Page Component
 */
export default function OptimizedPageExample() {
  const [searchQuery, setSearchQuery] = useState('');
  const userId = 'user-123'; // In real app, get from auth context
  
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Implement search logic
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <OptimizedHeroSection />
      
      {/* Search Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Cari Assessment yang Tepat
          </h2>
          <OptimizedSearchComponent onSearch={handleSearch} />
        </div>
      </section>
      
      {/* Dashboard Section */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Dashboard Anda</h2>
          <OptimizedDashboard userId={userId} />
        </div>
      </section>
    </div>
  );
}

// React import
import React from 'react';
