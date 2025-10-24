# Auth Data Optimization Strategy

## Problem Analysis

Berdasarkan analisis struktur data auth yang ada, terdapat perbedaan signifikan antara response dari login/register dengan profile API:

### Login/Register Response
```json
{
  "success": true,
  "data": {
    "uid": "string",
    "email": "string",
    "displayName": "string",
    "idToken": "string",
    "refreshToken": "string",
    "expiresIn": "string"
  }
}
```

### Profile Response
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "id": "string",
      "username": "string" | null,
      "email": "string",
      "user_type": "string",
      "is_active": boolean,
      "token_balance": number,
      "last_login": "string" | null,
      "created_at": "string",
      "profile": {
        "user_id": "string",
        "full_name": "string" | null,
        "date_of_birth": "string" | null,
        "gender": "string" | null,
        "school_id": null,
        "created_at": "string",
        "updated_at": "string",
        "school": null
      }
    }
  }
}
```

## Current Implementation Issues

1. **Redundant Data Storage**: Saat ini, data user disimpan di multiple places:
   - `TokenManager` di localStorage
   - Zustand store dengan persist
   - TanStack Query cache
   - React Context state

2. **Incomplete Data Structure**: Login/register response hanya menyediakan data dasar (uid, email, displayName), sedangkan profile API menyediakan data lengkap.

3. **Multiple API Calls**: Setelah login/register, aplikasi melakukan additional call ke `/api/auth/profile` untuk mendapatkan data lengkap.

## Optimization Strategy

### 1. Hybrid Data Storage Approach

Menggabungkan data dari login/register dengan profile API secara bertahap:

```typescript
interface PartialUserData {
  // Dari login/register response
  uid: string;
  email: string;
  displayName: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  
  // Flag untuk menandai data lengkap atau parsial
  isPartial: boolean;
  
  // Data profile yang akan diisi nanti (optional)
  profile?: {
    id?: string;
    username?: string | null;
    user_type?: string;
    is_active?: boolean;
    token_balance?: number;
    last_login?: string | null;
    created_at?: string;
    profile_details?: {
      user_id?: string;
      full_name?: string | null;
      date_of_birth?: string | null;
      gender?: string | null;
      school_id?: string | null;
      created_at?: string;
      updated_at?: string;
      school?: any;
    };
  };
}
```

### 2. Progressive Data Loading

1. **Phase 1**: Simpan data dari login/register sebagai data parsial
2. **Phase 2**: Background fetch profile data untuk melengkapi data
3. **Phase 3**: Update cache dengan data lengkap

### 3. Smart Cache Management

Menggunakan TanStack Query untuk mengelola state data:

```typescript
// Query key untuk partial data
queryKeys.auth.partialUser()

// Query key untuk complete data  
queryKeys.auth.completeUser()

// Query key untuk profile data
queryKeys.auth.profile()
```

### 4. Optimistic Updates

Implementasi optimistic updates untuk immediate UI feedback:

```typescript
// Set partial data immediately after login
queryClient.setQueryData(queryKeys.auth.partialUser(), partialData);

// Then fetch complete data in background
queryClient.prefetchQuery({
  queryKey: queryKeys.auth.completeUser(),
  queryFn: () => authService.getProfile()
});
```

## Implementation Plan

### Phase 1: Update TokenManager
- Modifikasi `TokenManager` untuk menyimpan data parsial
- Tambah flag `isPartial` untuk menandai status data
- Implementasi method untuk merge data

### Phase 2: Update Auth Service
- Modifikasi login/register methods untuk menyimpan data parsial
- Tambah method untuk fetch complete profile data
- Implementasi smart data merging

### Phase 3: Update TanStack Integration
- Modifikasi query keys untuk partial vs complete data
- Implementasi progressive data loading
- Update cache invalidation strategy

### Phase 4: Update Hooks and Components
- Modifikasi `useAuth` hook untuk handle partial data
- Update components untuk handle loading states
- Implementasi fallback UI untuk partial data

## Benefits

1. **Reduced Redundancy**: Single source of truth untuk user data
2. **Better UX**: Immediate response dengan data parsial
3. **Optimized API Calls**: Background fetching untuk complete data
4. **Improved Performance**: Lebih sedikit duplicate data storage
5. **Better Error Handling**: Graceful degradation jika profile fetch gagal

## Migration Strategy

1. **Backward Compatibility**: Maintain existing API interfaces
2. **Gradual Rollout**: Implementasi per phase dengan testing
3. **Fallback Mechanisms**: Handle edge cases dan error scenarios
4. **Data Migration**: Handle existing user data di localStorage

## Risk Mitigation

1. **Data Consistency**: Implementasi proper data merging logic
2. **Error Handling**: Robust error handling untuk API failures
3. **Performance**: Monitor performance impact dari additional logic
4. **Testing**: Comprehensive testing untuk semua scenarios

## Success Metrics

1. **Reduced API Calls**: Minimize redundant profile API calls
2. **Faster Login Time**: Improve perceived performance
3. **Better Cache Hit Rate**: Optimize cache utilization
4. **Reduced Memory Usage**: Eliminate duplicate data storage