# 🚀 Panduan Integrasi API ATMA

## 📋 Daftar Isi
- [Overview](#overview)
- [Perubahan Arsitektur](#perubahan-arsitektur)
- [Konfigurasi API](#konfigurasi-api)
- [Implementasi Service](#implementasi-service)
- [Flow Analisis AI](#flow-analisis-ai)
- [Testing & Debugging](#testing--debugging)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Aplikasi PetaTalenta telah berhasil diintegrasikan dengan **ATMA API** (AI-Driven Talent Mapping Assessment) untuk menggunakan analisis AI yang sesungguhnya menggantikan analisis lokal yang sebelumnya menggunakan data hardcoded.

### Sebelum Integrasi
```typescript
// Analisis lokal dengan data hardcoded
const analysis = analyzeTraits(scores);
const persona = generatePersona(analysis);
const strengths = generateStrengths(analysis, scores);
```

### Setelah Integrasi
```typescript
// Analisis menggunakan ATMA API
const assessmentData = { assessmentName: "AI-Driven Talent Mapping", riasec, ocean, viaIs };
const submissionResponse = await apiService.submitAssessment(assessmentData);
const result = await pollForCompletion(jobId);
```

## 🏗️ Perubahan Arsitektur

### 1. **Service Layer Enhancement**

#### `services/ai-analysis.ts`
- ✅ **Sebelum**: Analisis lokal dengan algoritma sederhana
- ✅ **Setelah**: Integrasi dengan ATMA API + fallback ke analisis lokal

#### `services/apiService.js`
- ✅ **Ditambahkan**: Konfigurasi axios dengan base URL
- ✅ **Ditambahkan**: Request/response interceptors
- ✅ **Ditambahkan**: Automatic token handling
- ✅ **Ditambahkan**: Error handling dan retry logic

### 2. **Environment Configuration**

#### `.env.local`
```bash
# API Configuration
VITE_API_BASE_URL=https://api.chhrone.web.id
VITE_NOTIFICATION_URL=https://api.chhrone.web.id

# Next.js API Configuration  
NEXT_PUBLIC_API_BASE_URL=https://api.chhrone.web.id
NEXT_PUBLIC_NOTIFICATION_URL=https://api.chhrone.web.id
```

### 3. **Dependencies**
```json
{
  "dependencies": {
    "axios": "^1.x.x"
  }
}
```

## ⚙️ Konfigurasi API

### Base Configuration
```javascript
// config/api.js
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.chhrone.web.id',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};
```

### Axios Instance Setup
```javascript
// services/apiService.js
class ApiService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request interceptor untuk token
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor untuk error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to auth
          localStorage.removeItem('token');
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }
    );
  }
}
```

## 🔄 Implementasi Service

### Main Analysis Function
```typescript
// services/ai-analysis.ts
export async function generateComprehensiveAnalysis(scores: AssessmentScores): Promise<PersonaProfile> {
  try {
    // 1. Prepare assessment data
    const assessmentData = {
      assessmentName: "AI-Driven Talent Mapping",
      riasec: scores.riasec,
      ocean: scores.ocean,
      viaIs: scores.viaIs
    };

    // 2. Submit to API
    const submissionResponse = await apiService.submitAssessment(assessmentData);
    
    if (!submissionResponse.success) {
      throw new Error(submissionResponse.error?.message || 'Failed to submit assessment');
    }

    const jobId = submissionResponse.data.jobId;
    
    // 3. Poll for completion
    const result = await pollForCompletion(jobId);
    
    // 4. Return persona profile
    if (result.persona_profile) {
      return result.persona_profile;
    }
    
    throw new Error('No persona profile found in assessment result');
    
  } catch (error) {
    console.error('API analysis failed, falling back to local analysis:', error);
    
    // Fallback to local analysis
    return generateLocalAnalysis(scores);
  }
}
```

### Polling Mechanism
```typescript
async function pollForCompletion(jobId: string, maxAttempts: number = 30, interval: number = 2000): Promise<any> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const statusResponse = await apiService.getAssessmentStatus(jobId);
      
      if (statusResponse.success) {
        const status = statusResponse.data.status;
        
        if (status === 'completed') {
          // Get the full result from archive
          const resultsResponse = await apiService.getResults({ jobId });
          if (resultsResponse.success && resultsResponse.data.length > 0) {
            return resultsResponse.data[0];
          }
          throw new Error('Assessment completed but no results found');
        } else if (status === 'failed') {
          throw new Error('Assessment processing failed');
        }
        
        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  throw new Error('Assessment processing timeout');
}
```

## 📊 Flow Analisis AI

### 1. **Submission Phase**
```
User Input (RIASEC, OCEAN, VIA-IS scores)
    ↓
Format assessment data
    ↓
POST /api/assessment/submit
    ↓
Receive jobId
```

### 2. **Processing Phase**
```
Poll GET /api/assessment/status/{jobId}
    ↓
Status: "queued" → Wait 2 seconds → Retry
    ↓
Status: "processing" → Wait 2 seconds → Retry
    ↓
Status: "completed" → Continue to results
    ↓
Status: "failed" → Throw error
```

### 3. **Results Phase**
```
GET /api/archive/results?jobId={jobId}
    ↓
Extract persona_profile from response
    ↓
Return PersonaProfile to UI
```

### 4. **Fallback Mechanism**
```
API Error/Timeout
    ↓
Log error message
    ↓
Execute generateLocalAnalysis(scores)
    ↓
Return local analysis result
```

## 🧪 Testing & Debugging

### Test Page: `/ai-analysis-test`

#### Test Cases Available:
1. **Creative Investigator Profile**
   - High: Investigative (85), Artistic (78), Openness (88)
   - Strengths: Creativity (92), Curiosity (89)

2. **Inspiring Leader Profile**
   - High: Social (89), Enterprising (76), Extraversion (91)
   - Strengths: Love (94), Teamwork (93), Honesty (92)

3. **Strategic Organizer Profile**
   - High: Conventional (85), Investigative (78), Conscientiousness (92)
   - Strengths: Prudence (91), Self-Regulation (89), Judgment (89)

#### Testing Steps:
```bash
# 1. Start development server
npm run dev

# 2. Open test page
http://localhost:3000/ai-analysis-test

# 3. Select test case
# 4. Click "Run AI Analysis"
# 5. Observe behavior:
#    - With auth: Uses ATMA API
#    - Without auth: Falls back to local analysis
```

### Debug Information

#### Console Logs:
```javascript
// Success case
console.log('Assessment submitted:', submissionResponse);
console.log('Job ID:', jobId);
console.log('Final result:', result);

// Error case
console.error('API analysis failed, falling back to local analysis:', error);
```

#### Network Tab:
- `POST /api/assessment/submit` - Assessment submission
- `GET /api/assessment/status/{jobId}` - Status polling
- `GET /api/archive/results?jobId={jobId}` - Results retrieval

## 🔧 Troubleshooting

### Common Issues

#### 1. **Module not found: 'axios'**
```bash
# Solution
npm install axios
```

#### 2. **401 Unauthorized**
```javascript
// Check if user is authenticated
const token = localStorage.getItem('token');
if (!token) {
  console.log('User not authenticated, using local analysis');
}
```

#### 3. **API Timeout**
```javascript
// Increase timeout in config
export const API_CONFIG = {
  TIMEOUT: 60000, // 60 seconds
};
```

#### 4. **CORS Issues**
```javascript
// Verify API base URL
console.log('API Base URL:', API_CONFIG.BASE_URL);
```

### Error Handling Strategy

#### 1. **Network Errors**
- Automatic fallback to local analysis
- User sees results without knowing about API failure
- Error logged to console for debugging

#### 2. **Authentication Errors**
- Token automatically removed from localStorage
- User redirected to auth page
- Clean session state

#### 3. **Processing Timeout**
- Maximum 30 attempts with 2-second intervals (60 seconds total)
- Graceful fallback to local analysis
- Clear error message in console

### Performance Considerations

#### 1. **Polling Optimization**
```typescript
// Configurable polling parameters
const maxAttempts = 30;    // Maximum polling attempts
const interval = 2000;     // 2 seconds between polls
const timeout = 60000;     // Total timeout: 60 seconds
```

#### 2. **Caching Strategy**
- Results automatically stored in archive
- Can be retrieved later using result ID
- No need for client-side caching

#### 3. **Fallback Performance**
- Local analysis: ~2 seconds (simulated)
- API analysis: Variable (depends on AI processing)
- Seamless user experience regardless of method

## 📈 Benefits

### 1. **Real AI Analysis**
- Menggunakan AI sesungguhnya dari ATMA API
- Hasil analisis lebih akurat dan personal
- Terintegrasi dengan sistem talent mapping yang komprehensif

### 2. **Robust Architecture**
- Graceful fallback mechanism
- Proper error handling
- Scalable and maintainable code

### 3. **User Experience**
- Seamless integration (UI tidak berubah)
- Consistent response format
- No breaking changes for existing features

### 4. **Developer Experience**
- Clear separation of concerns
- Easy to test and debug
- Well-documented API integration

## 📚 API Endpoints Reference

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/profile
POST /api/auth/logout
GET  /api/auth/token-balance
```

### Assessment Endpoints
```
POST /api/assessment/submit
GET  /api/assessment/status/{jobId}
GET  /api/assessment/queue/status
GET  /api/assessment/health
```

### Archive Endpoints
```
GET    /api/archive/results
GET    /api/archive/results/{id}
PUT    /api/archive/results/{id}
DELETE /api/archive/results/{id}
GET    /api/archive/stats
```

## 🔐 Authentication Flow

### JWT Token Management
```javascript
// Login and store token
const response = await apiService.login({ email, password });
if (response.success) {
  const { token, user } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

// Automatic token inclusion in requests
this.axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Token Expiration Handling
```javascript
// Automatic logout on 401
this.axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);
```

## 📋 Data Structures

### Assessment Input Format
```typescript
interface AssessmentScores {
  riasec: {
    realistic: number;      // 0-100
    investigative: number;  // 0-100
    artistic: number;       // 0-100
    social: number;         // 0-100
    enterprising: number;   // 0-100
    conventional: number;   // 0-100
  };
  ocean: {
    openness: number;           // 0-100
    conscientiousness: number;  // 0-100
    extraversion: number;       // 0-100
    agreeableness: number;      // 0-100
    neuroticism: number;        // 0-100
  };
  viaIs: {
    creativity: number;         // 0-100
    curiosity: number;          // 0-100
    judgment: number;           // 0-100
    // ... 21 more VIA character strengths
  };
}
```

### API Response Format
```typescript
interface PersonaProfile {
  title: string;                          // e.g., "The Creative Investigator"
  description: string;                    // Detailed personality description
  strengths: string[];                    // Array of strength descriptions
  recommendations: string[];              // Development recommendations
  careerRecommendation: CareerRecommendation[];  // Career suggestions
  roleModel: string[];                    // Inspirational role models
}

interface CareerRecommendation {
  careerName: string;                     // e.g., "Data Scientist"
  description: string;                    // Career description
  matchPercentage: number;                // 0-100
  careerProspect: {
    jobAvailability: 'super high' | 'high' | 'moderate' | 'low' | 'super low';
    salaryPotential: 'super high' | 'high' | 'moderate' | 'low' | 'super low';
    careerProgression: 'super high' | 'high' | 'moderate' | 'low' | 'super low';
    industryGrowth: 'super high' | 'high' | 'moderate' | 'low' | 'super low';
    skillDevelopment: 'super high' | 'high' | 'moderate' | 'low' | 'super low';
  };
}
```

## 🚀 Deployment Considerations

### Environment Variables
```bash
# Production
VITE_API_BASE_URL=https://api.chhrone.web.id
NEXT_PUBLIC_API_BASE_URL=https://api.chhrone.web.id

# Development
VITE_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# Staging
VITE_API_BASE_URL=https://staging-api.chhrone.web.id
NEXT_PUBLIC_API_BASE_URL=https://staging-api.chhrone.web.id
```

### Build Configuration
```javascript
// next.config.mjs
const nextConfig = {
  env: {
    CUSTOM_API_URL: process.env.VITE_API_BASE_URL,
  },
  // ... other config
};
```

## 🔍 Monitoring & Analytics

### Error Tracking
```javascript
// Enhanced error logging
catch (error) {
  console.error('API Error Details:', {
    endpoint: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    message: error.response?.data?.error?.message,
    timestamp: new Date().toISOString(),
    userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null
  });

  // Send to monitoring service (optional)
  // analytics.track('api_error', errorDetails);
}
```

### Performance Metrics
```javascript
// Track API response times
const startTime = performance.now();
const response = await apiService.submitAssessment(data);
const endTime = performance.now();
console.log(`API call took ${endTime - startTime} milliseconds`);
```

## 🔄 Migration Guide

### From Local to API Analysis

#### Step 1: Backup Current Implementation
```bash
# Create backup of local analysis
cp services/ai-analysis.ts services/ai-analysis-local-backup.ts
```

#### Step 2: Update Dependencies
```bash
npm install axios
```

#### Step 3: Configure Environment
```bash
# Add to .env.local
echo "VITE_API_BASE_URL=https://api.chhrone.web.id" >> .env.local
```

#### Step 4: Test Integration
```bash
# Run development server
npm run dev

# Test API integration
curl -X POST http://localhost:3000/api/test-analysis \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### Step 5: Gradual Rollout
```javascript
// Feature flag for gradual rollout
const useApiAnalysis = process.env.NODE_ENV === 'production'
  ? Math.random() < 0.5  // 50% of users
  : true;                // Always in development

if (useApiAnalysis) {
  return await generateApiAnalysis(scores);
} else {
  return await generateLocalAnalysis(scores);
}
```

---

**📝 Catatan**: Dokumentasi ini akan terus diperbarui seiring dengan pengembangan fitur dan perbaikan sistem.

**🔗 Links Terkait**:
- [ATMA API Documentation](https://docs.chhrone.web.id/)
- [Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [Assessment Integration Guide](./ASSESSMENT_INTEGRATION_GUIDE.md)
