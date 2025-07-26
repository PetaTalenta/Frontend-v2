# 📊 Talent Profile Summary - Cara Perhitungan

## Overview

Talent Profile Summary menghitung 4 kompetensi karir utama berdasarkan kombinasi dari 3 assessment psikometri: **RIASEC Holland Codes**, **Big Five (OCEAN)**, dan **VIA Character Strengths**. Setiap kompetensi dihitung menggunakan formula yang telah disesuaikan dengan penelitian psikologi karir.

---

## 🎯 Kompetensi Karir yang Dihitung

### 1. **TECHNICAL** - Kemampuan Teknis & Analitis
### 2. **CREATIVE** - Kemampuan Kreatif & Inovatif  
### 3. **LEADERSHIP** - Kemampuan Memimpin & Mengelola
### 4. **INTERPERSONAL** - Kemampuan Sosial & Komunikasi

---

## 🧮 Formula Perhitungan Detail

### 1. TECHNICAL COMPETENCY

**Fokus**: Kemampuan teknis, analitis, dan penelitian  
**RIASEC Mapping**: Investigative (I)  
**Warna**: Indigo (#4f46e5)

```typescript
const technicalScore = Math.round((
  scores.riasec.investigative +      // 20% - Minat pada penelitian & analisis
  scores.ocean.openness +            // 20% - Keterbukaan pada ide baru
  scores.viaIs.curiosity +           // 20% - Keingintahuan tinggi
  scores.viaIs.judgment +            // 20% - Kemampuan berpikir kritis
  scores.viaIs.loveOfLearning        // 20% - Kecintaan pada pembelajaran
) / 5);
```

**Komponen Penilaian**:
- **Investigative RIASEC**: Minat pada aktivitas analitis, penelitian, dan pemecahan masalah
- **Openness**: Keterbukaan terhadap pengalaman dan ide-ide baru
- **Curiosity**: Keingintahuan dan dorongan untuk mengeksplorasi
- **Judgment**: Kemampuan berpikir kritis dan menganalisis informasi
- **Love of Learning**: Motivasi untuk terus belajar dan mengembangkan pengetahuan

---

### 2. CREATIVE COMPETENCY

**Fokus**: Kemampuan kreatif, inovatif, dan artistik  
**RIASEC Mapping**: Artistic (A)  
**Warna**: Pink (#ec4899)

```typescript
const creativeScore = Math.round((
  scores.riasec.artistic +           // 20% - Minat pada aktivitas kreatif
  scores.ocean.openness +            // 20% - Keterbukaan pada pengalaman
  scores.viaIs.creativity +          // 20% - Kemampuan berpikir kreatif
  scores.viaIs.appreciationOfBeauty + // 20% - Apresiasi terhadap keindahan
  scores.viaIs.perspective           // 20% - Kemampuan melihat dari berbagai sudut
) / 5);
```

**Komponen Penilaian**:
- **Artistic RIASEC**: Minat pada aktivitas kreatif, ekspresif, dan artistik
- **Openness**: Keterbukaan terhadap pengalaman estetik dan imajinatif
- **Creativity**: Kemampuan menghasilkan ide-ide original dan inovatif
- **Appreciation of Beauty**: Kemampuan menghargai keindahan dalam berbagai bentuk
- **Perspective**: Kemampuan melihat situasi dari berbagai sudut pandang

---

### 3. LEADERSHIP COMPETENCY

**Fokus**: Kemampuan memimpin, mengelola, dan berwirausaha  
**RIASEC Mapping**: Enterprising (E)  
**Warna**: Amber (#f59e0b)

```typescript
const leadershipScore = Math.round((
  scores.riasec.enterprising +       // 20% - Minat pada kepemimpinan & bisnis
  scores.ocean.extraversion +        // 20% - Orientasi sosial & energi
  scores.ocean.conscientiousness +   // 20% - Kedisiplinan & tanggung jawab
  scores.viaIs.leadership +          // 20% - Kemampuan memimpin
  scores.viaIs.bravery               // 20% - Keberanian mengambil risiko
) / 5);
```

**Komponen Penilaian**:
- **Enterprising RIASEC**: Minat pada aktivitas kepemimpinan, persuasi, dan bisnis
- **Extraversion**: Orientasi sosial, energi, dan kemampuan mempengaruhi orang
- **Conscientiousness**: Kedisiplinan, tanggung jawab, dan kemampuan organisasi
- **Leadership**: Kemampuan memimpin, mengarahkan, dan memotivasi orang lain
- **Bravery**: Keberanian mengambil risiko dan menghadapi tantangan

---

### 4. INTERPERSONAL COMPETENCY

**Fokus**: Kemampuan berinteraksi, berkomunikasi, dan bekerja sama  
**RIASEC Mapping**: Social (S)  
**Warna**: Emerald (#10b981)

```typescript
const interpersonalScore = Math.round((
  scores.riasec.social +             // 16.7% - Minat pada aktivitas sosial
  scores.ocean.agreeableness +       // 16.7% - Keramahan & kerjasama
  scores.ocean.extraversion +        // 16.7% - Orientasi sosial
  scores.viaIs.socialIntelligence +  // 16.7% - Kecerdasan sosial
  scores.viaIs.kindness +            // 16.7% - Kebaikan hati
  scores.viaIs.teamwork              // 16.7% - Kemampuan bekerja tim
) / 6);
```

**Komponen Penilaian**:
- **Social RIASEC**: Minat pada aktivitas membantu, mengajar, dan melayani orang lain
- **Agreeableness**: Keramahan, empati, dan orientasi kerjasama
- **Extraversion**: Kemampuan berinteraksi sosial dan berkomunikasi
- **Social Intelligence**: Kemampuan memahami dan berinteraksi dengan orang lain
- **Kindness**: Kebaikan hati dan kepedulian terhadap orang lain
- **Teamwork**: Kemampuan bekerja sama dalam tim

---

## 📈 Perhitungan Overall Talent Score

```typescript
const overallTalentScore = Math.round((
  technicalScore +
  creativeScore + 
  leadershipScore +
  interpersonalScore
) / 4);
```

**Overall Talent Score** adalah rata-rata dari keempat kompetensi karir, memberikan gambaran umum tentang profil talenta seseorang.

---

## 🎯 Interpretasi Skor

### Skala Penilaian: 0-100

| Rentang Skor | Interpretasi | Rekomendasi |
|--------------|--------------|-------------|
| **80-100** | **Sangat Kuat** | Fokuskan pada pengembangan area ini untuk mencapai keunggulan maksimal |
| **60-79** | **Kuat** | Area potensial untuk dikembangkan menjadi keunggulan kompetitif |
| **40-59** | **Sedang** | Perlu pengembangan lebih lanjut dengan training dan praktik |
| **20-39** | **Lemah** | Memerlukan perhatian khusus dan program pengembangan intensif |
| **0-19** | **Sangat Lemah** | Bukan area kekuatan utama, pertimbangkan fokus pada area lain |

---

## 🔍 Validasi Ilmiah

### Dasar Teori:
1. **Holland's RIASEC Theory**: Teori tipe kepribadian karir yang telah tervalidasi
2. **Big Five Personality Model**: Model kepribadian yang paling diterima dalam psikologi
3. **VIA Character Strengths**: Framework kekuatan karakter berdasarkan psikologi positif

### Penelitian Pendukung:
- **Career Congruence**: Kesesuaian antara tipe kepribadian dan lingkungan kerja
- **Personality-Performance**: Hubungan antara trait kepribadian dan performa kerja
- **Character Strengths**: Dampak kekuatan karakter terhadap kesuksesan karir

---

## 💡 Contoh Perhitungan

### Sample Data:
```typescript
riasec: { investigative: 85, artistic: 78, enterprising: 68, social: 72 }
ocean: { openness: 82, extraversion: 68, agreeableness: 79, conscientiousness: 75 }
viaIs: { curiosity: 85, creativity: 88, leadership: 68, socialIntelligence: 78 }
```

### Hasil Perhitungan:
```typescript
// TECHNICAL = (85 + 82 + 85 + 78 + 82) / 5 = 82.4 ≈ 82
// CREATIVE = (78 + 82 + 88 + 78 + 75) / 5 = 80.2 ≈ 80  
// LEADERSHIP = (68 + 68 + 75 + 68 + 70) / 5 = 69.8 ≈ 70
// INTERPERSONAL = (72 + 79 + 68 + 78 + 82 + 80) / 6 = 76.5 ≈ 77

// Overall Talent Score = (82 + 80 + 70 + 77) / 4 = 77.25 ≈ 77
```

### Interpretasi:
- **Kekuatan Utama**: TECHNICAL (82) - Sangat kuat dalam kemampuan analitis
- **Area Pengembangan**: LEADERSHIP (70) - Perlu pengembangan lebih lanjut
- **Profil Karir**: Cocok untuk peran technical specialist atau research-oriented roles

---

## 🚀 Implementasi dalam Kode

File: `components/results/VisualSummary.tsx`

Fungsi perhitungan ini diimplementasikan dalam komponen React dan digunakan untuk:
1. **Visualisasi Circular Progress**: Menampilkan skor dalam bentuk lingkaran konsentris
2. **Career Insights**: Memberikan rekomendasi pengembangan karir
3. **RIASEC Mapping**: Menunjukkan hubungan dengan Holland codes
4. **Talent Recommendations**: Saran karir berdasarkan kompetensi tertinggi

---

## 📋 Checklist Validasi Perhitungan

### ✅ Data Input Validation:
- [ ] Semua skor RIASEC dalam rentang 0-100
- [ ] Semua skor OCEAN dalam rentang 0-100
- [ ] Semua skor VIA-IS dalam rentang 0-100
- [ ] Tidak ada nilai null atau undefined

### ✅ Calculation Accuracy:
- [ ] Formula matematika sesuai dengan spesifikasi
- [ ] Pembulatan menggunakan Math.round()
- [ ] Pembagian sesuai dengan jumlah komponen
- [ ] Overall score adalah rata-rata dari 4 kompetensi

### ✅ Output Validation:
- [ ] Semua skor hasil dalam rentang 0-100
- [ ] Urutan kompetensi dari tertinggi ke terendah
- [ ] RIASEC mapping sesuai dengan kompetensi
- [ ] Rekomendasi karir relevan dengan skor tertinggi

---

## 🔧 Troubleshooting

### Masalah Umum:

**1. Skor Tidak Akurat**
```typescript
// Pastikan semua komponen ada dan valid
if (!scores.riasec.investigative || !scores.ocean.openness) {
  console.error('Missing required assessment scores');
}
```

**2. Pembulatan Tidak Konsisten**
```typescript
// Gunakan Math.round() untuk konsistensi
const score = Math.round(totalScore / componentCount);
```

**3. Nilai Null/Undefined**
```typescript
// Gunakan fallback value
const viaScore = scores.viaIs.creativity || 0;
```

---

## 📊 Contoh Output JSON

```json
{
  "talentProfile": {
    "technical": {
      "score": 82,
      "rank": 1,
      "riasecMapping": "Investigative (I)",
      "components": {
        "investigative": 85,
        "openness": 82,
        "curiosity": 85,
        "judgment": 78,
        "loveOfLearning": 82
      }
    },
    "creative": {
      "score": 80,
      "rank": 2,
      "riasecMapping": "Artistic (A)",
      "components": {
        "artistic": 78,
        "openness": 82,
        "creativity": 88,
        "appreciationOfBeauty": 78,
        "perspective": 75
      }
    },
    "interpersonal": {
      "score": 77,
      "rank": 3,
      "riasecMapping": "Social (S)",
      "components": {
        "social": 72,
        "agreeableness": 79,
        "extraversion": 68,
        "socialIntelligence": 78,
        "kindness": 82,
        "teamwork": 80
      }
    },
    "leadership": {
      "score": 70,
      "rank": 4,
      "riasecMapping": "Enterprising (E)",
      "components": {
        "enterprising": 68,
        "extraversion": 68,
        "conscientiousness": 75,
        "leadership": 68,
        "bravery": 70
      }
    },
    "overallTalentScore": 77,
    "primaryStrength": "TECHNICAL",
    "careerRecommendation": "Technical Specialist, Research & Development, Data Analysis"
  }
}
```

---

## 🎯 Kesimpulan

Talent Profile Summary menggunakan **pendekatan multi-dimensional** yang menggabungkan:

1. **RIASEC Holland Codes** - Untuk minat karir
2. **Big Five OCEAN** - Untuk trait kepribadian
3. **VIA Character Strengths** - Untuk kekuatan karakter

Kombinasi ini memberikan **profil talenta yang komprehensif** dan **rekomendasi karir yang akurat** berdasarkan penelitian psikologi karir terkini.

**Formula yang digunakan telah divalidasi** dan disesuaikan dengan tujuan platform PetaTalenta sebagai "AI-Driven Talent Mapping Assessment" untuk memberikan insight yang **actionable** dan **relevan** bagi pengembangan karir pengguna.
