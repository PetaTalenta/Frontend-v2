# Rencana Implementasi Jobs API Integration

## Overview
Implementasi integrasi endpoint `/api/archive/jobs` untuk menampilkan 20 list jobs terbaru di assessment dashboard.

## Endpoint API Details

### GET /api/archive/jobs
**Authentication Required**: Yes (JWT Token)

**Parameters**:
- `page` (number, optional): Halaman data (default: 1)
- `limit` (number, optional): Jumlah data per halaman (default: 10)
- `status` (string, optional): Filter berdasarkan status: 'queued', 'processing', 'completed', 'failed'
- `assessment_name` (string, optional): Filter berdasarkan nama assessment
- `sort` (string, optional): Field untuk sorting (default: 'created_at')
- `order` (string, optional): Urutan sorting (default: 'DESC')

**Response Schema**:
```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "job_id": "job_12345abcdef",
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "status": "processing",
        "result_id": null,
        "assessment_name": "AI-Driven Talent Mapping",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:32:00.000Z",
        "completed_at": null,
        "error_message": null,
        "priority": 0,
        "retry_count": 0,
        "max_retries": 3,
        "processing_started_at": "2024-01-15T10:31:00.000Z",
        "archetype": null
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Strategi Implementasi

### 1. Type Definitions
Buat interface types untuk response data jobs di `src/types/dashboard.ts`:
- `JobData` interface untuk struktur data job
- `JobsResponse` interface untuk response API
- `JobsPagination` interface untuk pagination data

### 2. Service Layer
Tambahkan method baru di `src/services/authService.ts`:
- `getJobs(params)` method untuk mengambil data jobs
- Integrasi dengan existing axios instance dan auth headers
- Error handling sesuai pattern yang sudah ada

### 3. TanStack Query Integration
Update `src/lib/tanStackConfig.ts`:
- Tambahkan query keys untuk jobs: `queryKeys.jobs`
- Tambahkan query invalidation untuk jobs
- Tambahkan prefetch utilities untuk jobs

### 4. Custom Hook
Buat custom hook baru `src/hooks/useJobs.ts`:
- `useJobs()` hook untuk data fetching dengan TanStack Query
- Konfigurasi caching dan stale time
- Error handling dan retry logic
- Support untuk pagination dan filtering

### 5. Dashboard Integration
Update `src/components/dashboard/DashboardClient.tsx`:
- Import dan integrasi `useJobs` hook
- Replace dummy data dengan data dari API
- Maintain existing loading states dan error handling
- Optimistic updates untuk better UX

### 6. Table Component Updates
Update `src/components/dashboard/assessment-table.tsx`:
- Mapping data structure dari API response ke existing table structure
- Handle new fields seperti `job_id`, `assessment_name`, `archetype`
- Maintain existing functionality (view, delete, pagination)
- Update status handling untuk mencakup semua status dari API

## Implementation Details

### Data Flow
1. DashboardClient mounts → useJobs hook triggered
2. API call to `/api/archive/jobs` dengan `limit=20`
3. Data cached di TanStack Query dengan stale time 5 menit
4. AssessmentTable menerima data dan render sesuai existing pattern
5. User interactions (view, delete) tetap menggunakan existing logic

### Error Handling
- Network errors: Retry dengan exponential backoff
- 401/403 errors: Redirect ke auth page
- 500 errors: Show error state dengan retry button
- Loading states: Skeleton screens sesuai existing pattern

### Performance Optimizations
- Data caching dengan TanStack Query
- Background refetch untuk fresh data
- Pagination untuk handle large datasets
- Minimal re-renders dengan React.memo

### Security Considerations
- JWT token authentication via existing authService
- Rate limiting untuk prevent abuse
- Input validation untuk parameters
- Error logging untuk monitoring

## Integration Points

### Existing Components yang akan di-update:
1. `DashboardClient.tsx` - Integrasi data fetching
2. `AssessmentTable.tsx` - Mapping data structure
3. `dashboard.ts` types - Tambahkan JobData interface
4. `tanStackConfig.ts` - Tambahkan jobs query keys
5. `authService.ts` - Tambahkan getJobs method

### Existing Components yang tidak berubah:
- Header, StatsCard, VIAISCard, OceanCard, ProgressCard
- Authentication flow dan user management
- Routing dan navigation
- Error boundaries dan loading states


## Deployment Considerations
- Feature flag untuk gradual rollout
- Monitoring untuk API performance
- Error tracking untuk production issues
- Rollback plan jika terjadi issues

## Success Metrics
- API response time < 500ms
- Table rendering time < 100ms
- Zero JavaScript errors
- Smooth user experience dengan proper loading states
- Proper error recovery mechanisms

## Timeline Estimate
- **Day 1**: Type definitions dan service layer
- **Day 2**: Custom hook dan TanStack Query integration
- **Day 3**: Dashboard integration dan table updates
- **Day 4**: Testing dan optimization
- **Day 5**: Code review dan deployment preparation

## Risks and Mitigations
- **Risk**: API response structure changes
  - **Mitigation**: Flexible type definitions dengan optional fields
- **Risk**: Performance degradation dengan large datasets
  - **Mitigation**: Pagination dan virtual scrolling jika needed
- **Risk**: Authentication issues
  - **Mitigation**: Proper error handling dan token refresh
- **Risk**: Breaking existing functionality
  - **Mitigation**: Comprehensive testing dan gradual rollout

## Next Steps
1. Implement type definitions
2. Build service layer method
3. Create custom hook
4. Update dashboard component
5. Test and validate
6. Deploy and monitor

---
*Scope terbatas pada menampilkan 20 list jobs terbaru di assessment dashboard tanpa mengubah existing functionality.*