# Assessment Loading Page

Halaman loading yang interaktif dan informatif untuk menampilkan progress assessment kepada user saat menunggu hasil analisis AI.

## Fitur Utama

### 🎨 Visual yang Menarik
- **Animasi CSS**: Menggunakan animasi CSS dengan ikon buku, otak, dan bintang yang bergerak
- **Gradient Background**: Background yang menarik dengan gradasi warna
- **Progress Bar**: Menampilkan progress real-time dari proses assessment
- **Status Cards**: Kartu status yang informatif dengan ikon dan warna yang sesuai

### 📊 Informasi Real-time
- **Status Workflow**: Menampilkan tahapan proses (validating, submitting, queued, processing, completed)
- **Progress Percentage**: Persentase progress yang akurat
- **Queue Position**: Posisi dalam antrian jika menggunakan real API
- **Estimated Time**: Estimasi waktu yang tersisa
- **Elapsed Time**: Waktu yang telah berlalu

### 🔄 Tahapan Proses
1. **Validating** - Memvalidasi jawaban assessment
2. **Submitting** - Mengirim data ke sistem AI
3. **Queued** - Menunggu giliran dalam antrian
4. **Processing** - AI menganalisis data
5. **Generating** - Membuat profil talenta

### ⚡ Interaktivitas
- **Cancel Button**: Tombol untuk membatalkan proses
- **Retry Button**: Tombol untuk mencoba lagi jika gagal
- **Auto Redirect**: Otomatis redirect ke hasil setelah selesai

## Cara Penggunaan

### 1. Integrasi Otomatis dengan Button Existing

Loading page sudah terintegrasi secara otomatis dengan:

- **Button "Simpan & Keluar"** di header assessment
- **Button "Akhiri Test"** di akhir assessment

Ketika user mengklik button tersebut:
- Jika assessment 100% selesai → langsung ke loading page
- Jika assessment 80%+ selesai → user diberi pilihan loading page atau submit langsung
- Jika assessment <80% selesai → menggunakan flow original

### 2. Menggunakan Hook `useAssessmentSubmission` (Manual)

```typescript
import { useAssessmentSubmission } from '../hooks/useAssessmentSubmission';

function MyComponent() {
  const { submitAssessment } = useAssessmentSubmission({
    assessmentName: 'AI-Driven Talent Mapping',
    onSubmissionStart: () => console.log('Starting submission...'),
    onSubmissionError: (error) => console.error('Submission failed:', error)
  });

  const handleSubmit = async () => {
    const success = await submitAssessment(answers);
    if (success) {
      // User akan diarahkan ke halaman loading
    }
  };

  return (
    <button onClick={handleSubmit}>
      Submit Assessment
    </button>
  );
}
```

### 2. Menggunakan Komponen Langsung

```typescript
import AssessmentLoadingPage from '../components/assessment/AssessmentLoadingPage';

function MyLoadingPage() {
  const workflowState = {
    status: 'processing',
    progress: 75,
    message: 'AI sedang menganalisis data...',
    queuePosition: 2,
    estimatedTimeRemaining: '1 menit'
  };

  return (
    <AssessmentLoadingPage
      workflowState={workflowState}
      onCancel={() => console.log('Cancelled')}
      onRetry={() => console.log('Retrying')}
    />
  );
}
```

### 3. Integrasi dengan Enhanced Assessment Submission

```typescript
<EnhancedAssessmentSubmission
  answers={answers}
  onComplete={handleComplete}
  onCancel={handleCancel}
/>
```

**Note**: Loading page option telah dihapus dari EnhancedAssessmentSubmission karena sudah terintegrasi dengan button utama assessment.

## Routing

### URL Endpoints
- `/assessment-loading` - Halaman loading utama
- `/assessment-loading-demo` - Demo halaman loading

### Parameter URL (Opsional)
- `answers` - Data jawaban assessment (JSON encoded)
- `name` - Nama assessment

### Local Storage
Halaman loading menggunakan localStorage untuk menyimpan:
- `assessment-answers` - Jawaban assessment
- `assessment-name` - Nama assessment
- `assessment-submission-time` - Waktu submission

## Konfigurasi

### Props AssessmentLoadingPage

```typescript
interface AssessmentLoadingPageProps {
  workflowState: WorkflowState;     // Status dan progress workflow
  onCancel?: () => void;            // Callback saat cancel
  onRetry?: () => void;             // Callback saat retry
  className?: string;               // CSS class tambahan
}
```

### WorkflowState

```typescript
interface WorkflowState {
  status: WorkflowStatus;           // Status saat ini
  progress?: number;                // Progress 0-100
  message?: string;                 // Pesan status
  queuePosition?: number;           // Posisi dalam antrian
  estimatedTimeRemaining?: string;  // Estimasi waktu tersisa
  jobId?: string;                   // ID job untuk tracking
  result?: AssessmentResult;        // Hasil assessment
}
```

## Demo

Untuk melihat demo halaman loading:

1. Buka `/assessment-loading-demo`
2. Gunakan kontrol demo untuk mengubah status
3. Klik "Auto Play" untuk melihat transisi otomatis
4. Klik "Reset" untuk kembali ke awal

## Customization

### Mengubah Animasi CSS
1. Edit komponen `AssessmentLoadingPage.tsx` bagian animasi
2. Gunakan ikon dari Lucide React atau buat animasi CSS custom

### Mengubah Tahapan Proses
Edit array `LOADING_STEPS` di `AssessmentLoadingPage.tsx`:

```typescript
const LOADING_STEPS: LoadingStep[] = [
  {
    id: 'custom-step',
    title: 'Custom Step',
    description: 'Deskripsi step custom',
    icon: CustomIcon,
    estimatedTime: 10
  }
];
```

### Mengubah Styling
Komponen menggunakan Tailwind CSS. Ubah class CSS sesuai kebutuhan:

```typescript
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
  {/* Konten */}
</div>
```

## Troubleshooting

### Animasi Tidak Muncul
1. Pastikan CSS animations didukung oleh browser
2. Check console untuk error JavaScript
3. Pastikan Lucide React icons terinstall

### Data Assessment Hilang
1. Check localStorage untuk `assessment-answers`
2. Pastikan data disimpan sebelum redirect
3. Gunakan URL parameters sebagai fallback

### Progress Tidak Update
1. Pastikan `workflowState` di-update dengan benar
2. Check callback `onProgress` di workflow
3. Verify API response format

## Dependencies

- `lucide-react` - Untuk ikon dan animasi
- `@radix-ui/react-*` - Untuk komponen UI
- `tailwindcss` - Untuk styling dan animasi CSS

## File Structure

```
components/assessment/
├── AssessmentLoadingPage.tsx     # Komponen utama loading page
├── EnhancedAssessmentSubmission.tsx  # Integrasi dengan submission
└── AssessmentSidebar.tsx         # Submit button di sidebar

hooks/
└── useAssessmentSubmission.ts    # Hook untuk submission

app/
├── assessment-loading/
│   └── page.tsx                  # Route halaman loading
└── assessment-loading-demo/
    └── page.tsx                  # Route demo


```

## Best Practices

1. **Selalu validasi data** sebelum redirect ke loading page
2. **Gunakan localStorage** untuk persistence data
3. **Berikan feedback visual** yang jelas untuk setiap status
4. **Handle error cases** dengan baik
5. **Provide cancel option** untuk user experience yang baik
6. **Auto redirect** setelah completion untuk smooth flow
