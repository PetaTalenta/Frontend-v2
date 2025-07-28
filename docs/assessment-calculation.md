# 📊 Assessment Calculation Guide
## Panduan Perhitungan Assessment ATMA

Dokumen ini menjelaskan bagaimana sistem ATMA (AI-Driven Talent Mapping Assessment) menghitung dan memproses hasil assessment untuk menghasilkan profil talenta yang komprehensif.

---

## 🎯 Overview Sistem Assessment

ATMA menggunakan **3 instrumen psikometri** yang telah tervalidasi secara ilmiah:

| Assessment | Jumlah Pertanyaan | Dimensi | Skala |
|------------|-------------------|---------|-------|
| **VIA Character Strengths** | 96 | 24 kekuatan karakter | 1-5 |
| **RIASEC Holland Codes** | 60 | 6 tipe kepribadian karir | 1-5 |
| **Big Five (OCEAN)** | 50 | 5 trait kepribadian | 1-5 |

---

## 🔢 Proses Perhitungan Skor

### 1. Pengumpulan Jawaban Raw

Setiap pertanyaan dijawab dengan skala Likert 1-5:
- **1** = Very much unlike me / Sangat tidak seperti saya
- **2** = Unlike me / Tidak seperti saya  
- **3** = Neutral / Netral
- **4** = Like me / Seperti saya
- **5** = Very much like me / Sangat seperti saya

### 2. Algoritma Perhitungan Skor

```javascript
// Pseudocode untuk perhitungan skor per kategori
function calculateCategoryScore(answers, category) {
    let totalScore = 0;
    let questionCount = 0;
    
    // Proses pertanyaan regular
    for (question in category.questions) {
        if (answers[question] exists) {
            totalScore += answers[question];  // 1-5
            questionCount++;
        }
    }
    
    // Proses pertanyaan reverse (khusus Big Five)
    for (reverseQuestion in category.reverseQuestions) {
        if (answers[reverseQuestion] exists) {
            totalScore += (6 - answers[reverseQuestion]); // Reverse scoring
            questionCount++;
        }
    }

    // Hitung rata-rata dan konversi ke skala 0-100
    if (questionCount > 0) {
        averageScore = totalScore / questionCount;        // 1.0 - 5.0
        finalScore = Math.round(((averageScore - 1) / 4) * 100);  // 0 - 100
        return finalScore;
    }
    
    return 0;
}
```

### 3. Reverse Scoring (Big Five)

Beberapa pertanyaan Big Five menggunakan **reverse scoring** untuk menghindari response bias:

```javascript
// Contoh pertanyaan reverse
Regular: "Is original, comes up with new ideas" → Score langsung
Reverse: "Prefers work that is routine" → Score = 6 - jawaban_asli

// Jika user menjawab 4 pada pertanyaan reverse:
// Score yang dihitung = 6 - 4 = 2
```

---

## 📋 Detail Perhitungan per Assessment

### VIA Character Strengths (24 Dimensi)

**Kategori Kekuatan Karakter:**
- **Wisdom & Knowledge**: Creativity, Curiosity, Judgment, Love of Learning, Perspective
- **Courage**: Bravery, Perseverance, Honesty, Zest
- **Humanity**: Love, Kindness, Social Intelligence
- **Justice**: Teamwork, Fairness, Leadership
- **Temperance**: Forgiveness, Humility, Prudence, Self-Regulation
- **Transcendence**: Appreciation of Beauty, Gratitude, Hope, Humor, Spirituality

**Perhitungan:**
- 4 pertanyaan per dimensi
- Rata-rata jawaban × 20 = skor 0-100
- Tidak ada reverse scoring

### RIASEC Holland Codes (6 Dimensi)

**Tipe Kepribadian Karir:**
- **Realistic (R)**: Praktis, hands-on, teknis
- **Investigative (I)**: Analitis, penelitian, sains
- **Artistic (A)**: Kreatif, ekspresif, inovatif
- **Social (S)**: Membantu orang, interpersonal
- **Enterprising (E)**: Kepemimpinan, persuasif, bisnis
- **Conventional (C)**: Terorganisir, detail, administratif

**Perhitungan:**
- 10 pertanyaan per dimensi
- Rata-rata jawaban × 20 = skor 0-100
- Tidak ada reverse scoring

### Big Five OCEAN (5 Dimensi)

**Trait Kepribadian:**
- **Openness**: Keterbukaan terhadap pengalaman baru
- **Conscientiousness**: Kehati-hatian dan kedisiplinan
- **Extraversion**: Orientasi sosial dan energi
- **Agreeableness**: Keramahan dan kerjasama
- **Neuroticism**: Stabilitas emosional (skor tinggi = kurang stabil)

**Perhitungan:**
- 8-12 pertanyaan per dimensi (regular + reverse)
- Reverse scoring diterapkan pada pertanyaan tertentu
- Rata-rata jawaban × 20 = skor 0-100

---

## 🔄 Transformasi Data untuk AI Analysis

### Format Data yang Dikirim ke Backend

```json
{
  "riasec": {
    "realistic": 75,
    "investigative": 85,
    "artistic": 60,
    "social": 50,
    "enterprising": 70,
    "conventional": 55
  },
  "ocean": {
    "openness": 80,
    "conscientiousness": 65,
    "extraversion": 55,
    "agreeableness": 45,
    "neuroticism": 30
  },
  "viaIs": {
    "creativity": 85,
    "curiosity": 78,
    "judgment": 70,
    // ... 21 dimensi lainnya
  }
}
```

### Validasi Data

**Persyaratan Sebelum Submit:**
- ✅ Semua pertanyaan telah dijawab
- ✅ Skor dalam rentang 0-100 (integer)
- ✅ Token balance ≥ 1
- ✅ Format JSON sesuai spesifikasi API

---

## 🤖 Proses AI Analysis

### Tahapan Analisis

1. **Data Transformation** (Frontend)
   - Konversi skala 1-5 ke 0-100
   - Reverse scoring untuk Big Five
   - Validasi kelengkapan data

2. **AI Processing** (Backend)
   - Analisis pola kepribadian
   - Matching dengan database karir
   - Generasi rekomendasi personal

3. **Result Generation**
   - Persona profile creation
   - Career recommendations
   - Role model suggestions

### Status Monitoring

```javascript
// Real-time status tracking
Status: "queued" → "processing" → "completed"

// WebSocket notifications untuk update real-time
onAnalysisComplete: (data) => {
    navigate(`/results/${data.resultId}`);
}
```

---

## 📈 Interpretasi Hasil

### Skala Skor (0-100)

| Range | Interpretasi | Warna Indikator |
|-------|--------------|-----------------|
| 81-100 | **Very High** | 🟢 Hijau |
| 61-80 | **High** | 🔵 Biru |
| 41-60 | **Moderate** | 🟡 Kuning |
| 21-40 | **Low** | 🟠 Orange |
| 0-20 | **Very Low** | 🔴 Merah |

### Contoh Interpretasi

**RIASEC Profile: I(85) - R(75) - E(70)**
- **Dominan Investigative**: Cocok untuk karir research, analisis
- **Tinggi Realistic**: Suka hands-on, praktis
- **Moderate Enterprising**: Potensi leadership

**Big Five Profile: O(80) - C(65) - E(55) - A(45) - N(30)**
- **High Openness**: Kreatif, terbuka ide baru
- **Moderate Conscientiousness**: Cukup terorganisir
- **Low Neuroticism**: Stabil emosional

---

## 🎯 Output Akhir

### Struktur Hasil Assessment

```json
{
  "assessment_data": {
    "riasec": { /* skor 0-100 */ },
    "ocean": { /* skor 0-100 */ },
    "viaIs": { /* skor 0-100 */ }
  },
  "persona_profile": {
    "title": "The Innovative Analyst",
    "description": "Deskripsi kepribadian lengkap...",
    "strengths": ["Analytical thinking", "Creativity", "..."],
    "recommendations": ["Consider R&D roles", "..."],
    "careerRecommendation": [
      {
        "careerName": "Data Scientist",
        "careerProspect": {
          "jobAvailability": "high",
          "salaryPotential": "super high",
          "careerProgression": "high",
          "industryGrowth": "super high",
          "skillDevelopment": "high"
        }
      }
    ],
    "roleModel": ["Steve Jobs", "Marie Curie"]
  }
}
```

### Career Prospect Levels

- **Super High**: Sangat tinggi (>90%)
- **High**: Tinggi (70-90%)
- **Moderate**: Sedang (40-70%)
- **Low**: Rendah (20-40%)
- **Super Low**: Sangat rendah (<20%)

---

## 🔧 Technical Implementation

### Frontend Calculation

```javascript
// File: src/components/Assessment/AssessmentForm.jsx
const calculateScores = () => {
  const scores = {};
  
  Object.entries(assessmentData.categories).forEach(([categoryKey, category]) => {
    let totalScore = 0;
    let questionCount = 0;
    
    // Regular questions
    category.questions.forEach((_, index) => {
      const questionKey = `${categoryKey}_${index}`;
      if (answers[questionKey]) {
        totalScore += answers[questionKey];
        questionCount++;
      }
    });
    
    // Reverse questions (Big Five only)
    if (category.reverseQuestions) {
      category.reverseQuestions.forEach((_, index) => {
        const questionKey = `${categoryKey}_reverse_${index}`;
        if (answers[questionKey]) {
          totalScore += (6 - answers[questionKey]); // Reverse scoring
          questionCount++;
        }
      });
    }
    
    // Calculate final score (0-100 scale)
    if (questionCount > 0) {
      const averageScore = totalScore / questionCount;
      scores[categoryKey] = Math.round(((averageScore - 1) / 4) * 100);
    }
  });
  
  return scores;
};
```

### API Integration

```javascript
// File: src/services/apiService.js
async submitAssessment(assessmentData) {
  const response = await axios.post('/api/assessment/submit', {
    riasec: assessmentData.riasec,
    ocean: assessmentData.ocean,
    viaIs: assessmentData.viaIs
  });
  return response.data;
}
```

---

## 📚 Referensi Ilmiah

1. **VIA Character Strengths Survey**: Peterson & Seligman (2004)
2. **RIASEC Holland Codes**: Holland (1997) 
3. **Big Five Personality**: Costa & McCrae (1992)
4. **Psychometric Validation**: Cronbach's α > 0.80 untuk semua dimensi

---

## 🤖 AI Analysis & Backend Processing

### Arsitektur Microservices

ATMA menggunakan **backend API processing**, bukan analisis lokal. Sistem terdiri dari 4 microservices utama:

```
Client Application (Frontend)
       ↓
API Gateway (Port 3000)
       ↓
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Auth Service   │ Archive Service │Assessment Service│Notification Svc │
│   (Port 3001)   │   (Port 3002)   │   (Port 3003)   │   (Port 3005)   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Fungsi Setiap Service:**
- **API Gateway**: Single entry point, routing, authentication, rate limiting
- **Assessment Service**: **AI-powered assessment processing** 🤖
- **Archive Service**: Results storage & retrieval
- **Notification Service**: Real-time WebSocket updates

### Alur Proses AI Analysis

#### 1. Frontend: Perhitungan Skor Lokal

```javascript
// Frontend hanya menghitung skor dasar
const calculateScores = () => {
  const scores = {};

  Object.entries(assessmentData.categories).forEach(([categoryKey, category]) => {
    let totalScore = 0;
    let questionCount = 0;

    // Calculate average score (0-100 scale)
    if (questionCount > 0) {
      const averageScore = totalScore / questionCount;
      scores[categoryKey] = Math.round(((averageScore - 1) / 4) * 100);
    }
  });

  return scores;
};
```

**Frontend HANYA melakukan:**
- ✅ Skor rata-rata per dimensi (VIA, RIASEC, Big Five)
- ✅ Konversi skala 1-5 ke 0-100
- ✅ Reverse scoring untuk Big Five
- ❌ **TIDAK ada AI analysis di frontend**

#### 2. Data Transformation & API Submission

```javascript
// Transformasi data untuk backend
const transformScoresForAPI = () => {
  const transformedData = {
    riasec: {
      realistic: (riasec?.realistic || 0),
      investigative: (riasec?.investigative || 0),
      artistic: (riasec?.artistic || 0),
      social: (riasec?.social || 0),
      enterprising: (riasec?.enterprising || 0),
      conventional: (riasec?.conventional || 0)
    },
    ocean: {
      openness: (bigFive?.openness || 0),
      conscientiousness: (bigFive?.conscientiousness || 0),
      extraversion: (bigFive?.extraversion || 0),
      agreeableness: (bigFive?.agreeableness || 0),
      neuroticism: (bigFive?.neuroticism || 0)
    },
    viaIs: {
      creativity: (via?.creativity || 0),
      curiosity: (via?.curiosity || 0),
      // ... 22 dimensi lainnya
    }
  };
  return transformedData;
};

// Submit ke backend
const response = await apiService.submitAssessment(transformedData);
```

**Data yang dikirim ke backend:**
- **RIASEC**: 6 skor (0-100)
- **OCEAN**: 5 skor (0-100)
- **VIA-IS**: 24 skor (0-100)
- **Total**: 35 dimensi kepribadian

#### 3. Backend AI Processing (Assessment Service)

```javascript
/**
 * Submit assessment data for AI analysis
 * @param {Object} assessmentData - Assessment data
 * @param {Object} assessmentData.riasec - RIASEC scores
 * @param {Object} assessmentData.ocean - Big Five (OCEAN) scores
 * @param {Object} assessmentData.viaIs - VIA Character Strengths scores
 */
async submitAssessment(assessmentData) {
  const response = await axios.post('/api/assessment/submit', assessmentData);
  return response.data;
}
```

**Assessment Service melakukan AI Processing:**

1. **Pattern Analysis**
   - Menganalisis kombinasi 35 dimensi kepribadian
   - Mengidentifikasi pola unik setiap individu
   - Machine learning untuk personality clustering

2. **Career Matching Algorithm**
   - Database karir dengan 1000+ profesi
   - Matching algorithm berdasarkan RIASEC codes
   - Industry trend analysis
   - Job market data integration

3. **Persona Generation**
   - Natural Language Processing untuk deskripsi naratif
   - Template-based content generation
   - Personalized insights creation

4. **Career Prospect Analysis**
   - Job availability prediction
   - Salary potential calculation
   - Career progression mapping
   - Industry growth forecasting
   - Skill development recommendations

#### 4. Real-time Status Monitoring

```javascript
// WebSocket notifications untuk update real-time
.onAnalysisComplete((data) => {
  setNotifications(prev => [...prev, {
    id: Date.now(),
    type: 'success',
    title: 'Analysis Complete',
    message: data.message || 'Your analysis is ready!',
    data: data,
    timestamp: new Date()
  }]);

  if (options.onAnalysisComplete) {
    options.onAnalysisComplete(data);
  }
})
```

**Status Tracking:**
- **WebSocket connection** melalui API Gateway
- **Real-time updates**: `queued` → `processing` → `completed`
- **Observer pattern** untuk notifikasi otomatis
- **Timeout handling** jika proses terlalu lama

### AI Analysis Components Detail

#### Input Data Structure
```json
{
  "assessmentName": "AI-Driven Talent Mapping",
  "riasec": {
    "realistic": 75,
    "investigative": 85,
    "artistic": 60,
    "social": 50,
    "enterprising": 70,
    "conventional": 55
  },
  "ocean": {
    "openness": 80,
    "conscientiousness": 65,
    "extraversion": 55,
    "agreeableness": 45,
    "neuroticism": 30
  },
  "viaIs": {
    "creativity": 85,
    "curiosity": 78,
    "judgment": 70,
    "loveOfLearning": 82,
    // ... 20 dimensi lainnya
  }
}
```

#### AI Processing Pipeline

1. **Data Validation & Preprocessing**
   - Validasi rentang skor (0-100)
   - Normalisasi data
   - Missing value handling

2. **Personality Pattern Recognition**
   - Clustering analysis untuk tipe kepribadian
   - Dimensionality reduction (PCA/t-SNE)
   - Pattern matching dengan database profil

3. **Career Recommendation Engine**
   ```python
   # Pseudocode untuk career matching
   def generate_career_recommendations(personality_scores):
       # RIASEC-based initial filtering
       riasec_matches = filter_careers_by_riasec(personality_scores.riasec)

       # Big Five compatibility scoring
       for career in riasec_matches:
           compatibility_score = calculate_ocean_compatibility(
               personality_scores.ocean,
               career.required_traits
           )
           career.compatibility = compatibility_score

       # VIA strengths alignment
       for career in riasec_matches:
           strengths_alignment = calculate_via_alignment(
               personality_scores.viaIs,
               career.key_strengths
           )
           career.strengths_match = strengths_alignment

       # Final ranking algorithm
       ranked_careers = rank_careers(
           riasec_matches,
           weights={'compatibility': 0.4, 'strengths_match': 0.3, 'market_demand': 0.3}
       )

       return ranked_careers[:10]  # Top 10 recommendations
   ```

4. **Prospect Analysis Algorithm**
   ```python
   # Career prospect calculation
   def calculate_career_prospects(career, market_data):
       prospects = {
           'jobAvailability': analyze_job_market(career.industry),
           'salaryPotential': calculate_salary_percentile(career.salary_range),
           'careerProgression': assess_growth_opportunities(career.career_path),
           'industryGrowth': predict_industry_trends(career.industry),
           'skillDevelopment': evaluate_learning_opportunities(career.skills)
       }
       return prospects
   ```

#### Output Generation

```json
{
  "id": "result-123",
  "status": "completed",
  "assessment_data": {
    "riasec": { /* skor input */ },
    "ocean": { /* skor input */ },
    "viaIs": { /* skor input */ }
  },
  "persona_profile": {
    "title": "The Innovative Analyst",
    "description": "You are a creative problem-solver who combines analytical thinking with innovative approaches. Your high investigative and creative scores suggest you excel at understanding complex systems while finding novel solutions.",
    "strengths": [
      "Strong analytical and critical thinking skills",
      "High creativity and innovation capacity",
      "Love for learning and continuous improvement",
      "Ability to see patterns and connections others miss"
    ],
    "recommendations": [
      "Consider roles in research and development",
      "Pursue opportunities that combine analysis with creativity",
      "Engage in continuous learning and skill development",
      "Seek projects that allow for innovative problem-solving"
    ],
    "careerRecommendation": [
      {
        "careerName": "Data Scientist",
        "careerProspect": {
          "jobAvailability": "high",
          "salaryPotential": "super high",
          "careerProgression": "high",
          "industryGrowth": "super high",
          "skillDevelopment": "high"
        }
      },
      {
        "careerName": "Research Scientist",
        "careerProspect": {
          "jobAvailability": "moderate",
          "salaryPotential": "high",
          "careerProgression": "moderate",
          "industryGrowth": "high",
          "skillDevelopment": "super high"
        }
      }
    ],
    "roleModel": ["Steve Jobs", "Marie Curie", "Albert Einstein"]
  }
}
```

### Mengapa Backend API Processing?

#### Keuntungan Arsitektur Backend:

1. **🔒 Security & IP Protection**
   - AI models dan algoritma terlindungi dari reverse engineering
   - Proprietary career database tidak exposed
   - Secure data processing di server environment

2. **⚡ Performance & Scalability**
   - Computational heavy lifting di server dengan resources memadai
   - Frontend tetap responsif dan lightweight
   - Horizontal scaling untuk multiple concurrent users
   - Load balancing antar microservices

3. **🧠 AI Model Complexity**
   - Machine learning models yang sophisticated (TensorFlow/PyTorch)
   - Large language models untuk narrative generation
   - Database karir 10,000+ profesi dengan real-time market data
   - Complex algorithms yang membutuhkan high computational power

4. **📈 Continuous Improvement**
   - Model dapat diupdate tanpa mengubah frontend
   - A/B testing untuk algoritma berbeda
   - Real-time learning dari user feedback
   - Version control untuk model improvements

5. **💰 Resource Management**
   ```javascript
   // Token-based system untuk cost control
   const currentBalance = await checkTokenBalance();

   if (currentBalance <= 0) {
     setError('Insufficient token balance. You need at least 1 token to submit an assessment.');
     return;
   }
   ```

#### Perbandingan: Backend vs Local Analysis

| Aspek | Backend API | Local Analysis |
|-------|-------------|----------------|
| **AI Model Size** | Unlimited (GB-TB) | Limited (MB) |
| **Processing Power** | Server-grade CPU/GPU | Client device |
| **Data Privacy** | Secure server | Client-side exposure |
| **Update Frequency** | Real-time | App update required |
| **Career Database** | 10,000+ profesi | Limited subset |
| **Market Data** | Live integration | Static data |
| **Personalization** | Cross-user learning | Individual only |
| **Cost** | Token-based | One-time |

### Technical Implementation Details

#### API Endpoints Structure

```javascript
// Assessment endpoints
ASSESSMENT: {
  SUBMIT: '/api/assessment/submit',           // Submit untuk AI analysis
  STATUS: (jobId) => `/api/assessment/status/${jobId}`,  // Check progress
  QUEUE_STATUS: '/api/assessment/queue/status',          // Queue info
  HEALTH: '/api/assessment/health',                      // Service health
}

// Archive endpoints untuk results
ARCHIVE: {
  RESULTS: '/api/archive/results',                       // List results
  RESULT_BY_ID: (id) => `/api/archive/results/${id}`,   // Get specific result
}
```

#### WebSocket Integration

```javascript
// Real-time notifications melalui API Gateway
const socket = io('http://localhost:3000', {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Authentication setelah connect
socket.on('connect', () => {
  socket.emit('authenticate', { token: yourJWTToken });
});

// Listen untuk analysis events
socket.on('analysis-complete', (data) => {
  navigate(`/results/${data.resultId}`);
});
```

#### Rate Limiting & Security

| Endpoint Type | Limit | Window | Purpose |
|---------------|-------|--------|---------|
| General Gateway | 5000 requests | 15 minutes | Overall protection |
| Assessment Endpoints | 100 requests | 15 minutes | AI processing limit |
| Auth Endpoints | 100 requests | 15 minutes | Login protection |
| Admin Endpoints | 50 requests | 15 minutes | Admin security |

---

*Dokumen ini dibuat untuk membantu developer dan stakeholder memahami mekanisme perhitungan assessment dan AI analysis dalam sistem ATMA.*
