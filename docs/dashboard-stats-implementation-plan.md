# Rencana Implementasi Dashboard Stats Feature

## Overview
Implementasi fitur statistik dashboard yang menampilkan data real-time dari dua endpoint API:
1. `/api/archive/jobs/stats` - Statistik jobs (Processing, Completed, Failed)
2. `/api/auth/profile` - Token Balance (sudah ada implementasinya)

## Scope
- Menampilkan 4 statistik utama di dashboard: Processing, Completed, Failed, dan Token Balance
- Integrasi dengan existing dashboard layout
- Menggunakan TanStack Query untuk state management
- Implementasi loading states dan error handling

## Endpoint Details

### 1. Jobs Stats Endpoint
**Endpoint**: `GET /api/archive/jobs/stats`  
**Authentication**: Required (JWT Token)  
**Response Schema**:
```json
{
  "success": true,
  "message": "Job statistics retrieved successfully",
  "timestamp": "2025-09-27T15:30:11.421Z",
  "data": {
    "total_jobs": 302,
    "queued": 2,
    "processing": 2,
    "completed": 205,
    "failed": 0,
    "success_rate": 1,
    "avg_processing_time_seconds": 332.6
  }
}
```

### 2. Profile Endpoint (Sudah Ada)
**Endpoint**: `GET /api/auth/profile`  
**Authentication**: Required (JWT Token)  
**Response Schema**:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "id": "f843ce6b-0f41-4e3a-9c53-055ba85e4c61",
      "username": "rayinail updated",
      "email": "kasykoi@gmail.com",
      "user_type": "user",
      "is_active": true,
      "token_balance": 99999931,
      "last_login": "2025-10-24T11:40:14.717Z",
      "created_at": "2025-07-27T12:09:26.962Z",
      "profile": {
        "user_id": "f843ce6b-0f41-4e3a-9c53-055ba85e4c61",
        "full_name": "Rayina Ilham",
        "date_of_birth": "2025-07-01",
        "gender": "male",
        "school_id": null,
        "created_at": "2025-07-30T01:29:21.374Z",
        "updated_at": "2025-07-30T01:29:21.374Z",
        "school": null
      }
    }
  }
}
```

## Implementation Plan

### ✅ Phase 1: Type Definitions & Service Layer (COMPLETED)

#### 1.1 Type Definitions
**File**: `src/types/dashboard.ts`
- Tambahkan interface untuk JobsStatsResponse
- Tambahkan interface untuk DashboardStats (kombinasi jobs stats dan token balance)

#### 1.2 Service Layer Enhancement
**File**: `src/services/authService.ts`
- Tambahkan method `getJobsStats()` untuk fetch data dari `/api/archive/jobs/stats`
- Implementasi error handling dan retry logic
- Integrasi dengan existing authentication headers

#### 1.3 TanStack Query Configuration
**File**: `src/lib/tanStackConfig.ts`
- Tambahkan query keys untuk jobs stats
- Tambahkan query invalidation utilities untuk jobs stats
- Tambahkan prefetch utilities untuk better UX

### ✅ Phase 2: Custom Hook Implementation (COMPLETED)

#### 2.1 Jobs Stats Hook
**File**: `src/hooks/useJobsStats.ts` (baru)
- Implementasi custom hook dengan TanStack Query
- Konfigurasi caching (staleTime: 3 menit, gcTime: 5 menit)
- Error handling dengan exponential backoff retry
- Background refetch untuk fresh data

#### 2.2 Dashboard Stats Hook
**File**: `src/hooks/useDashboardStats.ts` (baru)
- Kombinasi data dari jobs stats dan profile (token balance)
- Menggunakan `useQueries` untuk parallel fetching
- Transformasi data ke format yang sesuai untuk UI
- Loading state management untuk kedua API calls

### ✅ Phase 3: UI Components Update (COMPLETED)

#### 3.1 Stats Card Component Enhancement
**File**: `src/components/dashboard/stats-card.tsx`
- ✅ Update untuk menerima dynamic data
- ✅ Tambahkan loading state dengan skeleton
- ✅ Tambahkan error state dengan retry button
- ✅ Optimasi untuk re-render dengan React.memo

#### 3.2 Dashboard Client Integration
**File**: `src/components/dashboard/DashboardClient.tsx`
- ✅ Integrasi `useDashboardStats` hook
- ✅ Replace dummy stats data dengan real data
- ✅ Implementasi proper loading states
- ✅ Tambahkan refresh functionality
- ✅ Error boundary implementation

### ✅ Phase 4: Performance & UX Optimizations (COMPLETED)

#### 4.1 Progressive Loading
- ✅ Implementasi skeleton screens untuk stats cards
- ✅ Staggered loading animation untuk better perceived performance
- ✅ Priority fetching untuk critical data

#### 4.2 Caching Strategy
- ✅ Implementasi intelligent cache invalidation
- ✅ Background refetch untuk stale data
- ✅ Offline support dengan cache fallback

#### 4.3 Error Handling
- ✅ Comprehensive error states
- ✅ Retry mechanisms dengan exponential backoff
- ✅ Graceful degradation untuk network failures

## Technical Implementation Details

### Data Flow Architecture
```
Dashboard Component
    ↓
useDashboardStats Hook
    ↓
┌─────────────────┬─────────────────┐
│   useJobsStats  │   useProfile    │
│   (New Hook)    │  (Existing)     │
└─────────────────┴─────────────────┘
    ↓                    ↓
┌─────────────────┬─────────────────┐
│  authService    │  authService    │
│ .getJobsStats() │ .getProfile()   │
└─────────────────┴─────────────────┘
    ↓                    ↓
┌─────────────────┬─────────────────┐
│ /api/archive/   │ /api/auth/      │
│   jobs/stats    │   profile       │
└─────────────────┴─────────────────┘
```

### State Management Strategy
- **Server State**: TanStack Query untuk API data
- **UI State**: React state untuk loading/error states
- **Cache Strategy**: Stale-while-revalidate pattern
- **Background Updates**: Automatic refetch untuk fresh data

### Performance Considerations
- **Request Deduplication**: TanStack Query otomatis mencegah duplicate requests
- **Parallel Fetching**: `useQueries` untuk concurrent API calls
- **Optimistic Updates**: Tidak diperlukan untuk stats (read-only)
- **Memoization**: React.memo untuk prevent unnecessary re-renders

## File Structure Changes

### New Files
```
src/
├── hooks/
│   ├── useJobsStats.ts          (New)
│   └── useDashboardStats.ts     (New)
├── types/
│   └── dashboard.ts             (Update)
├── services/
│   └── authService.ts           (Update)
└── lib/
    └── tanStackConfig.ts        (Update)
```

### Modified Files
```
src/
├── components/
│   └── dashboard/
│       ├── stats-card.tsx        (Update)
│       └── DashboardClient.tsx  (Update)
└── .agent/
    └── program_state.md        (Update)
```

## Integration with Existing Architecture

### Authentication Integration
- Menggunakan existing JWT token management
- Automatic token refresh mechanism
- Rate limiting dan security monitoring

### Caching Integration
- Menggunakan existing TanStack Query configuration
- Consistent cache invalidation strategy
- Background refetch alignment dengan existing patterns

### Error Handling Integration
- Menggunakan existing error recovery mechanisms
- Consistent error boundary implementation
- Security event logging untuk failed requests

## Testing Strategy

### Unit Testing
- Custom hooks testing dengan React Testing Library
- Service layer testing dengan mocked API responses
- Component testing dengan various data states

### Integration Testing
- End-to-end API integration testing
- Error scenario testing
- Performance testing dengan large datasets

### User Experience Testing
- Loading state transitions
- Error recovery flows
- Offline behavior testing

## Success Metrics

### Performance Metrics
- API response time < 500ms
- Dashboard load time < 2 seconds
- Cache hit rate > 80%

### User Experience Metrics
- Zero layout shift during data loading
- Smooth loading transitions
- Intuitive error states with recovery options

### Technical Metrics
- 100% TypeScript coverage
- 90%+ test coverage
- Zero console errors in production

## Rollout Plan

### Phase 1: Backend Integration (Week 1)
- Implement service layer methods
- Add type definitions
- Configure TanStack Query

### Phase 2: Hook Implementation (Week 1)
- Create custom hooks
- Implement data transformation
- Add error handling

### Phase 3: UI Integration (Week 2)
- Update dashboard components
- Implement loading states
- Add error boundaries

### Phase 4: Testing & Optimization (Week 2)
- Comprehensive testing
- Performance optimization
- Documentation updates

## Risks & Mitigations

### Technical Risks
- **API Rate Limiting**: Implementasi retry dengan exponential backoff
- **Network Failures**: Offline support dengan cache fallback
- **Data Inconsistency**: Implementasi cache invalidation strategy

### UX Risks
- **Loading Delays**: Progressive loading dengan skeleton screens
- **Error States**: Clear error messaging dengan recovery options
- **Data Freshness**: Background refetch untuk updated data

## Future Enhancements

### Advanced Features
- Real-time updates dengan WebSocket
- Advanced filtering dan sorting
- Data export functionality
- Historical trend analysis

### Performance Enhancements
- Service Worker caching
- Edge computing integration
- Predictive data prefetching
- Bundle optimization

## Conclusion

Implementasi dashboard stats feature ini akan memberikan real-time visibility kepada users mengenai assessment progress dan token balance. Dengan mengikuti existing architecture patterns dan best practices, implementasi akan maintainable, scalable, dan performant.

Key benefits:
- Real-time data synchronization
- Better user experience dengan proper loading states
- Improved performance dengan intelligent caching
- Enhanced error handling dan recovery mechanisms
- Consistent dengan existing codebase architecture