# Implementasi Fitur Job Analysis Dashboard

## Overview

Dokumentasi ini menjelaskan implementasi fitur untuk menampilkan data job analisis user di dashboard, termasuk tabel daftar job dan statistik job.

## API Endpoints

### 1. Mendapatkan Daftar Job Analysis

**Endpoint:** `GET /api/archive/jobs`

**Deskripsi:** Mengambil daftar job analisis user untuk ditampilkan dalam tabel dashboard.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| page | number | No | Halaman data (default: 1) |
| limit | number | No | Jumlah data per halaman (default: 10) |
| status | string | No | Filter berdasarkan status: 'queued', 'processing', 'completed', 'failed' |
| assessment_name | string | No | Filter berdasarkan nama assessment |
| sort | string | No | Field untuk sorting (default: 'created_at') |
| order | string | No | Urutan sorting (default: 'DESC') |

#### Response Schema

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

### 2. Mendapatkan Statistik Job User

**Endpoint:** `GET /api/archive/jobs/stats`

**Deskripsi:** Mengambil data statistik job user untuk ditampilkan di dashboard.

**Authentication Required:** Ya

#### Response Schema

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

## Strategi Implementasi

### 1. Komponen Dashboard

#### Dashboard Stats Component
- Menampilkan statistik job user
- Menggunakan data dari endpoint `/api/archive/jobs/stats`
- Menampilkan total jobs, status breakdown, success rate, dan average processing time

#### Job Table Component
- Menampilkan daftar job dalam format tabel
- Menggunakan data dari endpoint `/api/archive/jobs`
- Mendukung pagination, filtering, dan sorting
- Menampilkan kolom: job_id, assessment_name, status, created_at, completed_at, archetype

### 2. State Management

#### Custom Hooks
- `useJobStats()`: Mengelola data statistik job
- `useJobList()`: Mengelola data daftar job dengan pagination dan filter
- `useJobFilters()`: Mengelola state filter dan sorting

#### State Structure
```typescript
interface JobStatsState {
  total_jobs: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  success_rate: number;
  avg_processing_time_seconds: number;
  loading: boolean;
  error: string | null;
}

interface JobListState {
  jobs: Job[];
  pagination: PaginationInfo;
  filters: JobFilters;
  loading: boolean;
  error: string | null;
}
```

### 3. Data Fetching Strategy

#### API Service Layer
- Membuat service khusus untuk job analysis API
- Implementasi error handling dan retry mechanism
- Cache management untuk optimasi performa

#### Refresh Strategy
- Auto-refresh untuk data statistik (interval 30 detik)
- Manual refresh untuk data tabel
- Background refresh untuk job yang sedang processing

### 4. UI/UX Implementation

#### Loading States
- Skeleton loading untuk statistik cards
- Table skeleton untuk data loading
- Progress indicator untuk real-time updates

#### Error Handling
- Error boundary untuk komponen dashboard
- User-friendly error messages
- Retry mechanism untuk failed requests

#### Responsive Design
- Mobile-friendly table dengan horizontal scroll
- Adaptive layout untuk statistik cards
- Touch-friendly filter controls

### 5. Performance Optimization

#### Data Caching
- Client-side caching untuk statistik data
- Pagination caching untuk large datasets
- Optimistic updates untuk status changes

#### Bundle Optimization
- Lazy loading untuk job table component
- Dynamic imports untuk chart libraries
- Code splitting untuk dashboard features

### 6. Security Considerations

#### Authentication
- JWT token validation untuk API calls
- Automatic token refresh
- Logout handling untuk expired tokens

#### Data Protection
- Input sanitization untuk filter parameters
- XSS prevention untuk user-generated content
- Rate limiting untuk API calls

## Integration Points

### 1. Existing Dashboard Integration
- Mengintegrasikan dengan layout dashboard yang sudah ada
- Menggunakan theme dan design system yang konsisten
- Menghubungkan dengan navigation yang sudah ada

### 2. Assessment Flow Integration
- Link ke halaman hasil assessment dari job table
- Status sync dengan assessment completion
- Archetype data integration dengan persona profile

### 3. Profile Integration
- User job history di profile page
- Achievement badges berdasarkan job completion
- Performance metrics integration

## Testing Strategy

### 1. Unit Testing
- API service functions
- Custom hooks logic
- Component rendering

### 2. Integration Testing
- API endpoint integration
- Component interaction
- Data flow testing

### 3. E2E Testing
- Complete user flows
- Real-time updates
- Error scenarios

## Deployment Considerations

### 1. Environment Variables
- API base URL configuration
- Authentication endpoints
- Cache configuration

### 2. Monitoring
- API response time monitoring
- Error rate tracking
- User interaction analytics

### 3. Performance Metrics
- Page load time
- API call performance
- User engagement metrics

## Implementasi Fitur Results Detail

### 1. API Endpoint untuk Results Detail

**Endpoint:** `GET /api/archive/results/:id`

**Deskripsi:** Mendapatkan detail hasil analisis berdasarkan ID result yang didapat dari job table.

**Authentication Required:** Optional (Required for private results, not required for public results)

#### Response Schema

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "test_data": "{...}",
    "test_result": "{...}",
    "status": "completed",
    "error_message": null,
    "assessment_name": "AI-Driven Talent Mapping",
    "is_public": false,
    "chatbot_id": "uuid (optional) - ID conversation chatbot yang terkait dengan hasil analisis ini",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### 2. Integrasi dengan Job Table

#### Navigation Flow
- Job table menyediakan kolom `result_id` untuk job yang sudah completed
- Click pada result_id akan navigasi ke halaman `/results/:id`
- Gunakan Next.js dynamic routing untuk parameter `id`

#### Data Flow Integration
- Job table → Result ID → Results Page
- Fetch detail data menggunakan `result_id` dari API `/api/archive/results/:id`
- Transformasi data API response ke format yang kompatibel dengan komponen results yang sudah ada

### 3. Update Komponen Results

#### Data Transformation Layer
- Mapping dari API response format ke interface yang sudah ada
- Konversi `test_data` dan `test_result` ke format `AssessmentResult`
- Parsing JSON string ke object yang terstruktur

#### Hook Enhancement
- Update `useAssessmentData` hook untuk support API baru
- Tambahkan error handling untuk authentication scenarios
- Implementasi fallback ke dummy data untuk development

#### Component Adaptation
- Update `ResultsPageClient` untuk handle data dari API
- Tambahkan conditional rendering berdasarkan `is_public` status
- Integrasi dengan chatbot jika `chatbot_id` tersedia

### 4. Authentication & Authorization

#### Access Control Logic
- Check `is_public` status untuk menentukan apakah authentication required
- Implementasi middleware untuk protected results
- Redirect ke auth page jika akses ditolak

#### User Permission Check
- Validasi `user_id` dengan current user untuk private results
- Implementasi role-based access jika diperlukan
- Handle expired token scenarios

### 5. State Management Strategy

#### Result Data Structure
```typescript
interface ArchiveResult {
  id: string;
  user_id: string;
  test_data: string; // JSON string
  test_result: string; // JSON string
  status: 'completed' | 'failed' | 'processing';
  error_message: string | null;
  assessment_name: string;
  is_public: boolean;
  chatbot_id?: string;
  created_at: string;
  updated_at: string;
}
```

#### Data Transformation
- Parse `test_data` JSON ke `AssessmentData` interface
- Parse `test_result` JSON ke `PersonaProfile` interface
- Mapping field names sesuai dengan existing components

### 6. Error Handling & Edge Cases

#### Error Scenarios
- Result not found (404)
- Access denied (403) untuk private results
- Invalid result ID format
- Network timeout during fetch

#### Fallback Strategy
- Show meaningful error messages
- Provide retry mechanism
- Back navigation to job table
- Loading states during data fetch

### 7. Performance Optimization

#### Caching Strategy
- Cache result data untuk akses berulang
- Implementasi client-side caching dengan TTL
- Cache invalidation saat data updated

#### Lazy Loading
- Dynamic imports untuk chart components
- Progressive loading untuk large result data
- Skeleton states untuk smooth transitions

### 8. UI/UX Enhancements

#### Loading States
- Skeleton loading untuk result components
- Progress indicators untuk data fetching
- Smooth transitions antar states

#### Navigation Improvements
- Breadcrumb navigation untuk context
- Back button ke job table
- Related results suggestion

#### Responsive Design
- Mobile-optimized result display
- Touch-friendly chart interactions
- Adaptive layout untuk different screen sizes

### 9. Integration dengan Chatbot

#### Chat Integration
- Link ke chat interface jika `chatbot_id` tersedia
- Pass result context ke chatbot
- Persistent chat history untuk result

#### Chat Context
- Preload result data ke chat context
- Enable AI assistant untuk result explanation
- Interactive Q&A about assessment results

### 10. Testing Strategy

#### Unit Testing
- API service functions untuk result detail
- Data transformation utilities
- Component rendering dengan real API data

#### Integration Testing
- End-to-end flow dari job table ke result detail
- Authentication flow untuk private results
- Error handling scenarios

#### E2E Testing
- Complete user journey
- Cross-browser compatibility
- Mobile responsiveness testing

### 11. Migration Strategy

#### Phased Implementation
1. API integration layer
2. Data transformation utilities
3. Component updates
4. Authentication integration
5. Chatbot integration

#### Backward Compatibility
- Maintain existing dummy data support
- Gradual migration from static to dynamic data
- Feature flags for new functionality

### 12. Monitoring & Analytics

#### Performance Monitoring
- API response time tracking
- Page load performance
- User interaction analytics

#### User Behavior Tracking
- Result view patterns
- Feature usage statistics
- Error rate monitoring