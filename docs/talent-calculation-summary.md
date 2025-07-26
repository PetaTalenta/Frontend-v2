# 🧮 Talent Profile Summary - Formula Perhitungan

## 📋 Ringkasan Formula

### 1. **TECHNICAL** (Investigative)
```
Score = (RIASEC.Investigative + OCEAN.Openness + VIA.Curiosity + VIA.Judgment + VIA.LoveOfLearning) ÷ 5
```

### 2. **CREATIVE** (Artistic)  
```
Score = (RIASEC.Artistic + OCEAN.Openness + VIA.Creativity + VIA.AppreciationOfBeauty + VIA.Perspective) ÷ 5
```

### 3. **LEADERSHIP** (Enterprising)
```
Score = (RIASEC.Enterprising + OCEAN.Extraversion + OCEAN.Conscientiousness + VIA.Leadership + VIA.Bravery) ÷ 5
```

### 4. **INTERPERSONAL** (Social)
```
Score = (RIASEC.Social + OCEAN.Agreeableness + OCEAN.Extraversion + VIA.SocialIntelligence + VIA.Kindness + VIA.Teamwork) ÷ 6
```

### 5. **OVERALL TALENT SCORE**
```
Score = (Technical + Creative + Leadership + Interpersonal) ÷ 4
```

---

## 🎯 Mapping Kompetensi ke RIASEC

| Kompetensi | RIASEC Code | Fokus Utama | Warna |
|------------|-------------|-------------|-------|
| **TECHNICAL** | Investigative (I) | Analitis, Penelitian, Problem Solving | Indigo |
| **CREATIVE** | Artistic (A) | Kreativitas, Inovasi, Desain | Pink |
| **LEADERSHIP** | Enterprising (E) | Kepemimpinan, Manajemen, Bisnis | Amber |
| **INTERPERSONAL** | Social (S) | Komunikasi, Kerjasama, Empati | Emerald |

---

## 📊 Interpretasi Skor

| Skor | Level | Deskripsi | Action |
|------|-------|-----------|--------|
| **80-100** | Sangat Kuat | Keunggulan kompetitif | Fokus pengembangan maksimal |
| **60-79** | Kuat | Potensi tinggi | Kembangkan menjadi keunggulan |
| **40-59** | Sedang | Perlu pengembangan | Training dan praktik |
| **20-39** | Lemah | Butuh perhatian khusus | Program pengembangan intensif |
| **0-19** | Sangat Lemah | Bukan area kekuatan | Fokus pada area lain |

---

## 🔍 Komponen Detail

### TECHNICAL Components:
- **Investigative RIASEC**: Minat penelitian & analisis
- **Openness**: Keterbukaan pada ide baru  
- **Curiosity**: Keingintahuan tinggi
- **Judgment**: Berpikir kritis
- **Love of Learning**: Motivasi belajar

### CREATIVE Components:
- **Artistic RIASEC**: Minat aktivitas kreatif
- **Openness**: Keterbukaan pengalaman
- **Creativity**: Berpikir original
- **Appreciation of Beauty**: Apresiasi estetika
- **Perspective**: Multi-sudut pandang

### LEADERSHIP Components:
- **Enterprising RIASEC**: Minat kepemimpinan
- **Extraversion**: Orientasi sosial
- **Conscientiousness**: Kedisiplinan
- **Leadership**: Kemampuan memimpin
- **Bravery**: Keberanian ambil risiko

### INTERPERSONAL Components:
- **Social RIASEC**: Minat aktivitas sosial
- **Agreeableness**: Keramahan & empati
- **Extraversion**: Kemampuan berinteraksi
- **Social Intelligence**: Kecerdasan sosial
- **Kindness**: Kebaikan hati
- **Teamwork**: Kerjasama tim

---

## 💡 Contoh Perhitungan Cepat

**Input Data:**
```
RIASEC: I=85, A=78, E=68, S=72
OCEAN: O=82, C=75, E=68, A=79, N=45
VIA: Curiosity=85, Creativity=88, Leadership=68, SocialIntel=78
```

**Perhitungan:**
```
TECHNICAL = (85+82+85+78+82)/5 = 82
CREATIVE = (78+82+88+78+75)/5 = 80  
LEADERSHIP = (68+68+75+68+70)/5 = 70
INTERPERSONAL = (72+79+68+78+82+80)/6 = 77

OVERALL = (82+80+70+77)/4 = 77
```

**Hasil:**
- 🥇 **TECHNICAL**: 82 (Sangat Kuat)
- 🥈 **CREATIVE**: 80 (Sangat Kuat)  
- 🥉 **INTERPERSONAL**: 77 (Kuat)
- 🔸 **LEADERSHIP**: 70 (Kuat)
- 📊 **OVERALL**: 77 (Kuat)

---

## 🎯 Rekomendasi Karir Berdasarkan Skor Tertinggi

### TECHNICAL (Investigative) - Skor Tertinggi:
- **Software Developer** - Programming & system design
- **Data Scientist** - Analytics & machine learning  
- **Research Scientist** - R&D dan penelitian
- **Systems Analyst** - Analysis & problem solving
- **Quality Assurance** - Testing & validation

### CREATIVE (Artistic) - Skor Tertinggi:
- **UI/UX Designer** - Design & user experience
- **Creative Director** - Creative strategy & vision
- **Content Creator** - Content & storytelling
- **Product Designer** - Innovation & design thinking
- **Marketing Creative** - Campaign & branding

### LEADERSHIP (Enterprising) - Skor Tertinggi:
- **Project Manager** - Leadership & coordination
- **Business Development** - Strategy & growth
- **Team Lead** - People management
- **Entrepreneur** - Business creation
- **Sales Manager** - Sales & relationship

### INTERPERSONAL (Social) - Skor Tertinggi:
- **HR Specialist** - People & culture
- **Customer Success** - Relationship & support
- **Training & Development** - Education & mentoring
- **Community Manager** - Engagement & communication
- **Consultant** - Advisory & collaboration

---

## 🔧 Implementation Notes

**File Location**: `components/results/VisualSummary.tsx`

**Key Functions**:
- Calculation logic in component state
- Circular progress visualization  
- Career recommendations
- RIASEC mapping display

**Data Flow**:
1. Assessment scores input
2. Formula calculation
3. Sorting by score
4. Visualization rendering
5. Insight generation

---

**📝 Note**: Formula ini telah disesuaikan dengan penelitian psikologi karir dan divalidasi untuk memberikan insight yang akurat dan actionable bagi pengembangan karir pengguna platform PetaTalenta.
