# Dokumentasi Folder Utils

## Apa itu Folder Utils?

Folder `src/utils` adalah direktori yang berisi kumpulan utility functions (fungsi utilitas) yang digunakan secara berulang di seluruh aplikasi. Folder ini berisi kode-kode yang bersifat reusable, stateless, dan fokus pada satu tanggung jawab spesifik.

## Kenapa Folder Utils Diperlukan?

### 1. **DRY Principle (Don't Repeat Yourself)**
- Menghindari duplikasi kode di seluruh aplikasi
- Satu sumber kebenaran untuk fungsi-fungsi yang sering digunakan

### 2. **Separation of Concerns**
- Memisahkan logika bisnis dari logika presentasi
- Fungsi utilitas tidak bergantung pada state komponen

### 3. **Maintainability**
- Perubahan logika hanya perlu dilakukan di satu tempat
- Testing menjadi lebih mudah dan terisolasi

### 4. **Reusability**
- Fungsi dapat digunakan di berbagai komponen dan halaman
- Mengurangi kompleksitas kode di komponen

## Dimana Folder Utils Berada?

```
src/
├── utils/
│   ├── ai-analysis.ts
│   ├── api-health.ts
│   ├── assessment-calculations.ts
│   ├── cache-invalidation.ts
│   ├── env-logger.ts
│   ├── firebase-errors.js
│   ├── flagged-questions-storage.ts
│   ├── industry-scoring.ts
│   ├── pdf-export-utils.ts
│   ├── prefetch-helpers.ts
│   ├── safe-error-handling.ts
│   ├── screenshot-utils.ts
│   ├── storage-manager.ts
│   ├── token-balance.ts
│   ├── token-validation.ts
│   └── user-stats.ts
```

## Bagaimana Cara Menggunakan Folder Utils?

### 1. **Import Pattern**
```typescript
// Named import
import { calculateAllScores, validateAnswers } from '@/utils/assessment-calculations';

// Default import
import storageManager from '@/utils/storage-manager';

// Multiple imports
import { 
  getFirebaseErrorMessage, 
  isFirebaseAuthError,
  requiresReauth 
} from '@/utils/firebase-errors';
```

### 2. **Best Practices**
- Gunakan named export untuk multiple fungsi terkait
- Gunakan default export untuk class atau singleton
- Selalu handle error dengan baik
- Dokumentasikan fungsi dengan JSDoc

## Daftar Lengkap Utility Functions

### 1. **AI Analysis (`ai-analysis.ts`)**
**Fungsi:** Analisis kepribadian berbasis AI dari hasil assessment

**Key Functions:**
- `generateComprehensiveAnalysis()` - Menghasilkan analisis lengkap
- `generateLocalAnalysis()` - Analisis offline fallback
- `monitorWithWebSocket()` - Monitoring proses AI via WebSocket

**Usage:**
```typescript
import { generateComprehensiveAnalysis } from '@/utils/ai-analysis';

const analysis = await generateComprehensiveAnalysis(scores);
```

### 2. **API Health (`api-health.ts`)**
**Fungsi:** Monitoring kesehatan koneksi API

**Key Functions:**
- `checkApiHealth()` - Cek ketersediaan API
- `getApiBaseUrl()` - Dapatkan base URL API
- `shouldUseMockApi()` - Cek apakah perlu mock API

**Usage:**
```typescript
import { checkApiHealth } from '@/utils/api-health';

const health = await checkApiHealth();
if (!health.isAvailable) {
  // Handle API unavailable
}
```

### 3. **Assessment Calculations (`assessment-calculations.ts`)**
**Fungsi:** Kalkulasi skor assessment (Big Five, RIASEC, VIA)

**Key Functions:**
- `calculateAllScores()` - Hitung semua skor assessment
- `validateAnswers()` - Validasi jawaban user
- `canNavigateToSection()` - Cek izin navigasi
- `areAllPhasesComplete()` - Cek kelengkapan semua fase

**Usage:**
```typescript
import { calculateAllScores, validateAnswers } from '@/utils/assessment-calculations';

const scores = calculateAllScores(answers);
const validation = validateAnswers(answers);
```

### 4. **Cache Invalidation (`cache-invalidation.ts`)**
**Fungsi:** Manajemen cache invalidation

**Key Functions:**
- `invalidateCache()` - Invalidate cache dengan berbagai strategi
- `invalidateDashboardCache()` - Invalidate cache dashboard
- `invalidateTokenBalanceCache()` - Invalidate cache token

**Usage:**
```typescript
import { invalidateCache, InvalidationStrategy } from '@/utils/cache-invalidation';

await invalidateCache('user-data', {
  strategy: InvalidationStrategy.BY_TAG,
  tags: ['user', 'profile']
});
```

### 5. **Environment Logger (`env-logger.ts`)**
**Fungsi:** Logging dengan environment guard

**Key Functions:**
- `logger.debug()` - Debug log (development only)
- `logger.info()` - Info log
- `logger.warn()` - Warning log
- `logger.error()` - Error log

**Usage:**
```typescript
import { logger } from '@/utils/env-logger';

logger.debug('Debug message', data);
logger.error('Error occurred', error);
```

### 6. **Firebase Errors (`firebase-errors.js`)**
**Fungsi:** Handler error Firebase dalam Bahasa Indonesia

**Key Functions:**
- `getFirebaseErrorMessage()` - Konversi error ke user-friendly message
- `isFirebaseAuthError()` - Cek tipe error
- `requiresReauth()` - Cek apakah perlu re-authentication

**Usage:**
```typescript
import { getFirebaseErrorMessage, requiresReauth } from '@/utils/firebase-errors';

const message = getFirebaseErrorMessage(error);
if (requiresReauth(error)) {
  // Redirect to login
}
```

### 7. **Safe Error Handling (`safe-error-handling.ts`)**
**Fungsi:** Error handling yang aman dan terstruktur

**Key Functions:**
- `createSafeError()` - Buat error object yang aman
- `safeAsync()` - Wrapper async function dengan error handling
- `validateApiResponse()` - Validasi response API

**Usage:**
```typescript
import { safeAsync, createSafeError } from '@/utils/safe-error-handling';

const result = await safeAsync(
  () => apiCall(),
  (error) => handleSafeError(error),
  defaultValue
);
```

### 8. **Storage Manager (`storage-manager.ts`)**
**Fungsi:** Manajemen localStorage dengan atomic transactions

**Key Functions:**
- `storageManager.getItem()` - Ambil item dari storage
- `storageManager.setItem()` - Simpan item ke storage
- `storageManager.setMultiple()` - Update multiple items atomically
- `storageManager.createTransaction()` - Buat atomic transaction

**Usage:**
```typescript
import { storageManager } from '@/utils/storage-manager';

const user = await storageManager.getItem('user');
await storageManager.setItem('token', token);

// Atomic transaction
const transaction = storageManager.createTransaction();
transaction.add('user', userData);
transaction.add('token', newToken);
await transaction.commit();
```

### 9. **Token Validation (`token-validation.ts`)**
**Fungsi:** Validasi dan auto-refresh token

**Key Functions:**
- `ensureValidToken()` - Pastikan token valid
- `validateToken()` - Validasi token tanpa refresh
- `shouldRefreshToken()` - Cek apakah perlu refresh

**Usage:**
```typescript
import { ensureValidToken } from '@/utils/token-validation';

const token = await ensureValidToken();
// Token valid, lanjutkan operasi
```

### 10. **User Stats (`user-stats.ts`)**
**Fungsi:** Kalkulasi statistik user

**Key Functions:**
- `calculateUserStats()` - Hitung statistik user
- `formatStatsForDashboard()` - Format stats untuk dashboard
- `fetchAssessmentHistoryFromAPI()` - Ambil history assessment

**Usage:**
```typescript
import { calculateUserStats, formatStatsForDashboard } from '@/utils/user-stats';

const stats = await calculateUserStats(userId);
const formatted = formatStatsForDashboard(stats);
```

## Pattern yang Digunakan

### 1. **Pure Functions**
- Input yang sama selalu menghasilkan output yang sama
- Tidak memiliki side effects
- Mudah di-test

### 2. **Error First Pattern**
```typescript
export function someUtil(data: any): Result | Error {
  try {
    // Process data
    return result;
  } catch (error) {
    return createSafeError(error);
  }
}
```

### 3. **Factory Pattern**
```typescript
export function createValidator(rules: ValidationRules) {
  return (data: any) => {
    // Validate based on rules
  };
}
```

### 4. **Strategy Pattern**
```typescript
export enum CacheStrategy {
  MEMORY = 'memory',
  LOCAL_STORAGE = 'localStorage',
  INDEXED_DB = 'indexedDB'
}
```

## Testing Utils

### 1. **Unit Test Pattern**
```typescript
// utils/__tests__/assessment-calculations.test.ts
import { calculateAllScores } from '../assessment-calculations';

describe('calculateAllScores', () => {
  it('should calculate scores correctly', () => {
    const answers = { 1: 5, 2: 3 };
    const result = calculateAllScores(answers);
    expect(result).toBeDefined();
  });
});
```

### 2. **Mock Pattern**
```typescript
jest.mock('@/utils/storage-manager', () => ({
  storageManager: {
    getItem: jest.fn(),
    setItem: jest.fn()
  }
}));
```

## Best Practices

### 1. **Naming Conventions**
- Gunakan verb untuk fungsi: `calculate`, `validate`, `format`
- Gunakan noun untuk constants: `ERROR_MESSAGES`, `DEFAULT_CONFIG`
- Deskriptif dan jelas: `validateAssessmentAnswers` bukan `validateAnswers`

### 2. **Type Safety**
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateData(data: unknown): ValidationResult {
  // Implementation
}
```

### 3. **Error Handling**
```typescript
export function safeOperation<T>(data: T): T | null {
  try {
    return process(data);
  } catch (error) {
    logger.error('Operation failed', error);
    return null;
  }
}
```

### 4. **Documentation**
```typescript
/**
 * Calculate assessment scores from user answers
 * @param answers - Object with question ID as key and score as value
 * @returns AssessmentScores object with calculated scores
 * @throws Error when answers are invalid
 */
export function calculateAllScores(answers: Record<number, number>): AssessmentScores {
  // Implementation
}
```

## Performance Considerations

### 1. **Memoization**
```typescript
const memoizedFunction = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

### 2. **Debouncing**
```typescript
import { storageManager } from '@/utils/storage-manager';

// Debounced write untuk frequent updates
storageManager.setItemDebounced('user-input', value, 300);
```

### 3. **Lazy Loading**
```typescript
export const heavyUtil = () => {
  return import('./heavy-implementation').then(mod => mod.default);
};
```

## Future Enhancements

### 1. **Module Federation**
- Split utils menjadi micro-frontends
- Load on demand

### 2. **Web Workers**
- Heavy calculations di background thread
- Non-blocking UI operations

### 3. **Service Worker Integration**
- Cache utils untuk offline usage
- Background sync

## Kesimpulan

Folder `utils` adalah bagian krusial dari arsitektur aplikasi yang:

1. **Meningkatkan maintainability** dengan centralizing reusable logic
2. **Mengurangi bugs** dengan single source of truth
3. **Mempercepat development** dengan fungsi-fungsi siap pakai
4. **Memudahkan testing** dengan isolated functions

Penggunaan yang tepat akan menghasilkan kode yang lebih bersih, maintainable, dan scalable.