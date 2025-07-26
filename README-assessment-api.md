# Assessment API Integration

Implementasi lengkap untuk integrasi dengan Assessment Service API yang menyediakan analisis AI untuk pemetaan talenta menggunakan framework RIASEC, OCEAN, dan VIA-IS.

## 🚀 Fitur Utama

- ✅ **Real API Integration** - Integrasi dengan API Assessment Service yang sesungguhnya
- ✅ **Automatic Fallback** - Fallback otomatis ke Mock API jika real API tidak tersedia
- ✅ **Polling Mechanism** - Polling otomatis untuk status assessment dengan exponential backoff
- ✅ **Queue Monitoring** - Monitoring real-time untuk antrian assessment
- ✅ **Token Management** - Integrasi dengan sistem token balance
- ✅ **Error Handling** - Penanganan error yang komprehensif
- ✅ **React Hooks** - Custom hooks untuk state management
- ✅ **UI Components** - Komponen React siap pakai
- ✅ **TypeScript Support** - Full TypeScript support dengan type definitions

## 📁 Struktur File

```
services/
├── enhanced-assessment-api.ts     # Core API service
└── apiService.js                  # Updated legacy service

utils/
└── assessment-workflow.ts         # Workflow management

hooks/
└── useAssessmentWorkflow.ts       # React hooks

components/assessment/
├── AssessmentStatusMonitor.tsx    # Status monitoring component
└── EnhancedAssessmentSubmission.tsx # Complete submission component

types/
└── assessment-results.ts          # Updated type definitions

docs/
└── assessment-api-integration.md  # Detailed documentation
```

## 🔧 API Endpoints

Base URL: `https://api.chhrone.web.id/api/assessment`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/submit` | Submit assessment for AI analysis |
| GET | `/status/:jobId` | Get job processing status |
| GET | `/queue/status` | Get queue information |
| GET | `/health` | Service health check |
| GET | `/idempotency/health` | Idempotency service health |
| POST | `/idempotency/cleanup` | Cleanup idempotency cache |

## 🎯 Quick Start

### 1. Basic Assessment Submission

```typescript
import { submitAssessment } from './services/enhanced-assessment-api';

const scores = {
  riasec: { realistic: 75, investigative: 80, /* ... */ },
  ocean: { openness: 80, conscientiousness: 75, /* ... */ },
  viaIs: { creativity: 80, curiosity: 85, /* ... */ }
};

try {
  const response = await submitAssessment(scores, 'AI-Driven Talent Mapping');
  console.log('Job ID:', response.data.jobId);
} catch (error) {
  console.error('Submission failed:', error);
}
```

### 2. Using React Hook

```typescript
import { useAssessmentWorkflow } from './hooks/useAssessmentWorkflow';

function AssessmentComponent() {
  const { state, submitFromAnswers, isProcessing } = useAssessmentWorkflow({
    onComplete: (result) => console.log('Done!', result),
    onError: (error) => console.error('Failed:', error)
  });

  const handleSubmit = () => {
    const answers = { /* user answers */ };
    submitFromAnswers(answers);
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={isProcessing}>
        Submit Assessment
      </button>
      {isProcessing && <p>Status: {state.message}</p>}
    </div>
  );
}
```

### 3. Complete UI Component

```typescript
import EnhancedAssessmentSubmission from './components/assessment/EnhancedAssessmentSubmission';

function AssessmentPage() {
  const answers = { /* user answers */ };

  return (
    <EnhancedAssessmentSubmission
      answers={answers}
      onComplete={(result) => {
        console.log('Assessment completed:', result);
        // Navigate to results page
      }}
    />
  );
}
```

## 🔄 Workflow States

Assessment workflow melalui state-state berikut:

1. **idle** - Siap untuk submit assessment
2. **validating** - Memvalidasi jawaban user
3. **submitting** - Mengirim ke API
4. **queued** - Menunggu dalam antrian processing
5. **processing** - Sedang dianalisis oleh AI
6. **completed** - Analisis selesai
7. **failed** - Processing gagal
8. **cancelled** - User membatalkan

## ⚙️ Konfigurasi

### Polling Configuration

```typescript
const POLLING_CONFIG = {
  INITIAL_DELAY: 2000,     // 2 detik
  MAX_DELAY: 30000,        // 30 detik
  MAX_ATTEMPTS: 60,        // Maksimal 30 menit
  BACKOFF_MULTIPLIER: 1.5, // Exponential backoff
};
```

### Assessment Types

- `AI-Driven Talent Mapping` (Recommended)
- `AI-Based IQ Test`
- `Custom Assessment`

## 🛡️ Error Handling

Sistem menangani berbagai skenario error:

- **401 Unauthorized** - Token authentication invalid
- **402 Payment Required** - Token tidak mencukupi
- **429 Too Many Requests** - Rate limit terlampaui
- **500 Internal Server Error** - Service tidak tersedia
- **Network Errors** - Fallback otomatis ke mock API

## 💰 Token Management

- Otomatis mengurangi token saat submission berhasil
- Menampilkan update token balance
- Menangani skenario token tidak mencukupi
- Memberikan informasi biaya token

## 📊 Queue Monitoring

- Tracking posisi antrian real-time
- Kalkulasi estimasi waktu tunggu
- Display rata-rata waktu processing
- Monitoring ketersediaan service

## 🧪 Testing

### Mock API Fallback

Ketika real API tidak tersedia, sistem otomatis menggunakan mock API endpoints yang mensimulasikan behavior yang sama dengan processing lokal.

### Health Checks

```typescript
import { isAssessmentServiceAvailable, checkAssessmentHealth } from './services/enhanced-assessment-api';

// Check availability
const isAvailable = await isAssessmentServiceAvailable();

// Detailed health info
const health = await checkAssessmentHealth();
```

## 📝 Migration Guide

Untuk migrasi dari mock API ke real API:

1. Ganti import dari `assessment-api.ts` ke `enhanced-assessment-api.ts`
2. Update komponen untuk menggunakan `useAssessmentWorkflow` hook
3. Tambahkan komponen status monitoring
4. Handle skenario error baru
5. Test dengan real dan mock API

## 🔍 Debugging

Enable detailed logging dengan melihat browser console untuk pesan dengan prefix:
- `Enhanced Assessment API:`
- `Assessment Workflow:`
- `AssessmentAPI:`

## 📚 Dokumentasi Lengkap

Lihat [docs/assessment-api-integration.md](docs/assessment-api-integration.md) untuk dokumentasi detail dan contoh penggunaan lengkap.

## 🤝 Kontribusi

1. Pastikan semua tests pass
2. Update dokumentasi jika diperlukan
3. Follow existing code style
4. Test dengan real dan mock API

## 📄 License

Sesuai dengan license proyek utama.

---

**Catatan**: Implementasi ini mempertahankan backward compatibility dengan sistem yang ada sambil menambahkan fitur-fitur baru untuk integrasi API yang lebih robust.
