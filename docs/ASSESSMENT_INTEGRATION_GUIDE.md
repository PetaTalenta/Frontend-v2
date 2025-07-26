# Assessment Integration Guide

## Overview
Saya telah berhasil mengintegrasikan soal-soal dari tiga file assessment ke dalam struktur data yang terorganisir untuk aplikasi dashboard Figma Anda.

## File yang Telah Dibuat

### 1. `data/assessmentQuestions.ts`
File utama yang berisi semua data soal assessment dalam format TypeScript yang terstruktur.

**Struktur Data:**
- **bigFiveQuestions**: 44 soal Big Five Personality (BFI-44)
- **riasecQuestions**: 60 soal RIASEC Holland Codes  
- **viaQuestions**: 48 soal VIA Character Strengths (sampel dari 96 soal total)
- **assessmentTypes**: Konfigurasi untuk setiap jenis assessment
- **scaleConfigurations**: Pengaturan skala penilaian

### 2. `components/assessment/AssessmentDemo.tsx`
Komponen demo yang menunjukkan cara menggunakan data assessment.

### 3. `app/assessment-demo/page.tsx`
Halaman demo untuk melihat implementasi assessment.

## Sumber Data

### Big Five Personality (44 soal)
**Sumber:** `data/Big Five Inventory (BFI-44) Self-Assessment.txt`
- **Kategori:** 5 dimensi kepribadian
  - Keterbukaan terhadap Pengalaman (10 soal)
  - Kehati-hatian (9 soal)
  - Ekstraversi (8 soal)
  - Keramahan (9 soal)
  - Neurotisisme (8 soal)
- **Skala:** 1-5 (Sangat tidak setuju → Sangat setuju)

### RIASEC Holland Codes (60 soal)
**Sumber:** `data/RIASEC Holland Codes Self-Assessment.txt`
- **Kategori:** 6 tipe kepribadian Holland
  - Realistis (10 soal)
  - Investigatif (10 soal)
  - Artistik (10 soal)
  - Sosial (10 soal)
  - Enterprising/Kewirausahaan (10 soal)
  - Konvensional (10 soal)
- **Skala:** 1-5 (Sangat tidak sesuai → Sangat sesuai)

### VIA Character Strengths (96 soal)
**Sumber:** `data/VIA Character Strengths Self-Assessment.txt`
- **Kategori:** 6 kebajikan utama dengan 24 kekuatan karakter
  - Kebijaksanaan (20 soal)
  - Keberanian (16 soal)
  - Kemanusiaan (12 soal)
  - Keadilan (12 soal)
  - Pengendalian Diri (16 soal)
  - Transendensi (20 soal)
- **Skala:** 1-5 (Sangat tidak sesuai → Sangat sesuai)

## Cara Menggunakan

### 1. Import Data Assessment
```typescript
import { 
  assessmentTypes, 
  bigFiveQuestions, 
  riasecQuestions, 
  viaQuestions,
  getAssessmentById 
} from '../data/assessmentQuestions';
```

### 2. Mengakses Soal Berdasarkan Assessment
```typescript
// Mendapatkan assessment berdasarkan ID
const bigFiveAssessment = getAssessmentById('big-five');
const riasecAssessment = getAssessmentById('riasec');
const viaAssessment = getAssessmentById('via-character');

// Mengakses soal langsung
const currentQuestion = bigFiveQuestions[0];
console.log(currentQuestion.text); // "Saya melihat diri saya sebagai seseorang yang..."
```

### 3. Implementasi dalam Komponen
```typescript
const [currentAssessment, setCurrentAssessment] = useState(assessmentTypes[0]);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

const currentQuestion = currentAssessment.questions[currentQuestionIndex];
```

### 4. Menampilkan Skala Penilaian
```typescript
{currentAssessment.scaleLabels.map((label, index) => (
  <div key={index}>
    <span>{label}</span>
    <input 
      type="radio" 
      value={index + 1}
      name="assessment-answer"
    />
  </div>
))}
```

## Interface TypeScript

```typescript
interface Question {
  id: number;
  text: string;
  category: string;
  subcategory?: string;
  isReversed?: boolean;
}

interface AssessmentType {
  id: string;
  name: string;
  description: string;
  totalQuestions: number;
  scaleType: '5-point' | '7-point';
  scaleLabels: string[];
  questions: Question[];
}
```

## Demo
Kunjungi `/assessment-demo` untuk melihat implementasi lengkap dengan:
- Pemilihan jenis assessment
- Navigasi antar soal
- Tampilan skala penilaian
- Informasi assessment

## Integrasi dengan Komponen Existing
Untuk mengintegrasikan dengan komponen assessment yang sudah ada:

1. Update `AssessmentQuestionCard.tsx` untuk menggunakan data dinamis
2. Update `AssessmentHeader.tsx` untuk menampilkan informasi assessment yang tepat
3. Update `AssessmentSidebar.tsx` untuk menampilkan progress berdasarkan assessment aktif

## Catatan Penting
- Semua teks sudah dalam bahasa Indonesia yang mudah dipahami
- Data sudah terstruktur dengan kategori dan sub-kategori yang jelas
- Soal dengan penilaian terbalik sudah ditandai dengan `isReversed: true`
- Skala penilaian sudah disesuaikan dengan standar masing-masing assessment

## Next Steps
1. Implementasikan logika penyimpanan jawaban
2. Tambahkan validasi input
3. Buat sistem scoring untuk setiap assessment
4. Implementasikan hasil dan interpretasi assessment
