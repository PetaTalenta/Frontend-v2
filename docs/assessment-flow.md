# Dokumentasi Lengkap: Alur Proses Assessment dari Frontend ke Server API

## Gambaran Umum

Dokumen ini menjelaskan secara detail bagaimana proses assessment berjalan dari frontend hingga mendapat response dari server API dan menampilkan hasil di halaman result. Sistem menggunakan arsitektur hybrid dengan WebSocket untuk real-time updates dan polling sebagai fallback mechanism.

## 1. Arsitektur Sistem & API Configuration

### Base Configuration
```javascript
// API Base URL: https://api.chhrone.web.id
// Timeout: 30 seconds
// Retry Attempts: 3
// WebSocket URL: https://api.chhrone.web.id
```

### Frontend Components
- **Assessment.jsx**: Komponen utama untuk mengisi assessment
- **AssessmentStatus.jsx**: Komponen untuk tracking status processing
- **Results/**: Komponen untuk menampilkan hasil assessment
- **apiService.js**: Service untuk komunikasi dengan API
- **notificationService.js**: Service untuk WebSocket notifications

### Complete API Endpoints Mapping

#### Authentication APIs
```
POST   /api/auth/login              - User login
POST   /api/auth/register           - User registration
GET    /api/auth/profile            - Get user profile
PUT    /api/auth/profile            - Update user profile
POST   /api/auth/change-password    - Change password
DELETE /api/auth/account            - Delete account (soft delete)
POST   /api/auth/logout             - User logout
GET    /api/auth/token-balance       - Check token balance
```

#### Assessment APIs
```
POST   /api/assessment/submit                    - Submit assessment data
GET    /api/assessment/status/{jobId}            - Check processing status
```

#### Archive/Results APIs
```
GET    /api/archive/results                      - Get paginated results
GET    /api/archive/results/{id}                 - Get specific result by ID
PUT    /api/archive/results/{id}                 - Update result
DELETE /api/archive/results/{id}                 - Delete result
GET    /api/archive/stats                        - Get statistics
GET    /api/archive/stats/overview               - Get stats overview
GET    /api/archive/jobs                         - Get jobs with archetype data
```

#### Chatbot APIs
```
POST   /api/chatbot/assessment/from-assessment   - Create chatbot from assessment
POST   /api/chatbot/conversations/{id}/messages  - Send message
GET    /api/chatbot/conversations/{id}           - Get conversation
```

#### Health Check APIs
```
GET    /api/health                               - Comprehensive health check
GET    /api/health/live                          - Liveness probe
GET    /api/health/ready                         - Readiness probe
GET    /api/health/detailed                      - Extended health info
```

#### WebSocket Events
```
Event: connect                    - WebSocket connection established
Event: disconnect                 - WebSocket connection lost
Event: authenticate               - Authenticate WebSocket connection
Event: authenticated              - Authentication successful
Event: auth_error                 - Authentication failed
Event: analysis-started           - Analysis process started
Event: analysis-complete          - Analysis completed successfully
Event: analysis-failed            - Analysis failed
```

## 2. Detailed Assessment Flow dengan API Calls

### Phase 1: Pengisian Assessment

#### 1.1 Inisialisasi Assessment
```javascript
// Assessment.jsx - Component initialization
const Assessment = () => {
  const [assessmentData, setAssessmentData] = useState({
    riasec: {},      // 60 questions
    bigFive: {},     // 50 questions
    via: {}          // 120 questions
  });

  // Load saved progress from encrypted storage
  useEffect(() => {
    const savedAnswers = secureStorage.getItem("assessmentAnswers");
    if (savedAnswers) {
      setAssessmentData(savedAnswers);
    }
  }, []);
}
```

#### 1.2 Token Balance Check
**API Call**: `GET /api/auth/token-balance`
```javascript
// Check if user has sufficient tokens before starting
const checkTokenBalance = async () => {
  try {
    const response = await apiService.getTokenBalance();
    if (response.success && response.data.balance < REQUIRED_TOKENS) {
      setError("Insufficient tokens to process assessment");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Token balance check failed:", error);
    return false;
  }
};
```

#### 1.3 Pengisian Jawaban
- User mengisi pertanyaan dari 3 kategori: RIASEC (60), Big Five (50), VIA (120)
- Setiap jawaban disimpan secara real-time ke encrypted storage
- Progress tracking untuk setiap kategori assessment
- Sistem flagging untuk pertanyaan yang ingin ditinjau ulang

#### 1.4 Validasi Kelengkapan
```javascript
// Pengecekan apakah semua assessment sudah lengkap
const isAllComplete = useMemo(() => {
  const riasecComplete = Object.keys(assessmentData.riasec).length === 60;
  const bigFiveComplete = Object.keys(assessmentData.bigFive).length === 50;
  const viaComplete = Object.keys(assessmentData.via).length === 120;

  return riasecComplete && bigFiveComplete && viaComplete;
}, [assessmentData]);
```

### Phase 2: Transformasi Data untuk API

#### 2.1 Data Transformation
```javascript
// assessmentTransformers.js - Transform scores to API format
const transformScoresToApiFormat = () => {
  const apiData = transformAssessmentScores(assessmentData);
  
  // Validate the transformed data
  const validation = validateAssessmentData(apiData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }
  
  return apiData;
};
```

#### 2.2 Format Data API
```javascript
// Final API format
{
  assessmentName: "AI-Driven Talent Mapping",
  riasec: {
    realistic: 75,
    investigative: 82,
    artistic: 65,
    social: 90,
    enterprising: 78,
    conventional: 70
  },
  ocean: {
    openness: 85,
    conscientiousness: 78,
    extraversion: 72,
    agreeableness: 88,
    neuroticism: 45
  },
  viaIs: {
    // 24 character strengths with scores 0-100
    creativity: 82,
    curiosity: 90,
    // ... other strengths
  },
  industryScore: {
    // Industry compatibility scores
  }
}
```

### Phase 3: Submission ke Server API

#### 3.1 Assessment Submission API Call
**API Endpoint**: `POST /api/assessment/submit`
**Content-Type**: `application/json`
**Authentication**: Bearer Token (JWT)

**Request Body**:
```javascript
{
  assessmentName: "AI-Driven Talent Mapping",
  riasec: {
    realistic: 75,
    investigative: 82,
    artistic: 65,
    social: 90,
    enterprising: 78,
    conventional: 70
  },
  ocean: {
    openness: 85,
    conscientiousness: 78,
    extraversion: 72,
    agreeableness: 88,
    neuroticism: 45
  },
  viaIs: {
    creativity: 82,
    curiosity: 90,
    judgment: 78,
    love_of_learning: 85,
    perspective: 80,
    bravery: 75,
    perseverance: 88,
    honesty: 92,
    zest: 70,
    love: 85,
    kindness: 90,
    social_intelligence: 82,
    teamwork: 88,
    fairness: 85,
    leadership: 75,
    forgiveness: 80,
    humility: 78,
    prudence: 82,
    self_regulation: 75,
    appreciation_of_beauty: 70,
    gratitude: 88,
    hope: 85,
    humor: 75,
    spirituality: 65
  },
  industryScore: {
    technology: 85,
    healthcare: 70,
    education: 88,
    finance: 75,
    creative: 82,
    // ... other industries
  }
}
```

**Success Response (200)**:
```javascript
{
  success: true,
  message: "Assessment submitted successfully",
  data: {
    jobId: "job_abc123def456",
    status: "queued",
    estimatedTime: "2-5 minutes",
    queuePosition: 3
  }
}
```

**Error Responses**:
```javascript
// Insufficient Tokens (402)
{
  success: false,
  message: "Insufficient tokens to process assessment",
  error: "INSUFFICIENT_TOKENS",
  data: {
    required: 100,
    available: 25
  }
}

// Validation Error (400)
{
  success: false,
  message: "Invalid assessment data",
  error: "VALIDATION_ERROR",
  data: {
    errors: ["RIASEC scores missing", "Invalid OCEAN values"]
  }
}

// Server Error (500)
{
  success: false,
  message: "Internal server error",
  error: "INTERNAL_ERROR"
}
```

#### 3.2 Frontend Submission Implementation
```javascript
// Assessment.jsx - handleSubmit function
const handleSubmit = async () => {
  setIsSubmitting(true);
  setSubmitError(null);

  try {
    // 1. Final token balance check
    const hasTokens = await checkTokenBalance();
    if (!hasTokens) return;

    // 2. Transform data to API format
    const transformedData = transformScoresToApiFormat();

    // 3. Submit to API
    const response = await apiService.submitAssessment(transformedData);

    if (response.success && response.data?.jobId) {
      // 4. Clear saved progress from storage
      secureStorage.removeItem("assessmentAnswers");
      secureStorage.removeItem("assessmentFlaggedQuestions");
      localStorage.removeItem("assessmentAnswers");
      localStorage.removeItem("assessmentFlaggedQuestions");

      // 5. Navigate to status tracking page
      navigate(`/assessment/status/${response.data.jobId}`, {
        state: { fromSubmission: true }
      });
    } else {
      throw new Error(response.message || "Failed to submit assessment");
    }
  } catch (error) {
    console.error("Assessment submission error:", error);

    // Handle specific error cases
    let errorMessage = "Failed to submit assessment";

    if (error.response?.status === 402) {
      errorMessage = "Insufficient tokens to process your assessment. Please contact support or try again later.";
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    setSubmitError(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
};
```

#### 3.3 API Service Implementation
```javascript
// apiService.js - submitAssessment method
async submitAssessment(assessmentData) {
  try {
    const response = await axios.post(
      API_ENDPOINTS.ASSESSMENT.SUBMIT, // '/api/assessment/submit'
      assessmentData,
      {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    // Re-throw with additional context
    if (error.response) {
      // Server responded with error status
      throw error;
    } else if (error.request) {
      // Network error
      throw new Error("Network error: Please check your connection");
    } else {
      // Other error
      throw new Error("Request failed: " + error.message);
    }
  }
}
```

### Phase 4: Status Tracking (Hybrid Architecture)

#### 4.1 WebSocket Connection Setup
**WebSocket URL**: `wss://api.chhrone.web.id`
**Authentication**: JWT Token via `authenticate` event

```javascript
// notificationService.js - WebSocket connection
connect(token, options = {}) {
  const socketUrl = options.url || 'https://api.chhrone.web.id';

  this.socket = io(socketUrl, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    maxReconnectionAttempts: 5
  });

  this.token = token;
  this.setupEventListeners();
  this.socket.connect();
}

// WebSocket Events Handling
setupEventListeners() {
  this.socket.on('connect', () => {
    this.isConnected = true;
    this.authenticate(); // Send JWT token
  });

  this.socket.on('authenticated', (data) => {
    this.isAuthenticated = true;
  });

  this.socket.on('analysis-complete', (data) => {
    // Trigger callbacks for assessment completion
    this.callbacks.onAnalysisComplete?.(data);
  });

  this.socket.on('analysis-failed', (data) => {
    this.callbacks.onAnalysisFailed?.(data);
  });
}
```

#### 4.2 Status Polling API
**API Endpoint**: `GET /api/assessment/status/{jobId}`
**Method**: GET
**Authentication**: Bearer Token

**Response Format**:
```javascript
// Queued Status
{
  success: true,
  data: {
    jobId: "job_abc123def456",
    status: "queued",
    queuePosition: 2,
    estimatedTime: "3-5 minutes",
    progress: 0,
    stage: "waiting"
  }
}

// Processing Status
{
  success: true,
  data: {
    jobId: "job_abc123def456",
    status: "processing",
    progress: 25,
    stage: "analyzing",
    currentStep: "Analyzing personality traits",
    estimatedTimeRemaining: "2-3 minutes"
  }
}

// Completed Status
{
  success: true,
  data: {
    jobId: "job_abc123def456",
    status: "completed",
    progress: 100,
    stage: "completed",
    resultId: "result_xyz789abc123",
    completedAt: "2024-01-01T12:00:00Z"
  }
}

// Failed Status
{
  success: true,
  data: {
    jobId: "job_abc123def456",
    status: "failed",
    progress: 0,
    stage: "failed",
    error: "Analysis timeout",
    failedAt: "2024-01-01T12:00:00Z"
  }
}
```

#### 4.3 Hybrid Status Tracking Implementation
```javascript
// AssessmentStatus.jsx - Observer Pattern dengan WebSocket
const { isConnected, isAuthenticated } = useNotifications({
  onAnalysisComplete: async (data) => {
    addDebugInfo(`WebSocket: Analysis complete received for jobId: ${data?.jobId}`);

    if (data?.jobId === jobId && !hasNavigatedRef.current) {
      // Prevent race conditions
      if (isHandlingWebSocketRef.current) return;
      isHandlingWebSocketRef.current = true;

      // Transition to preparing stage
      setCurrentStage("preparing");

      // Wait for data persistence (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify data availability before navigation
      const resultId = data.resultId || jobId;
      const isDataAvailable = await verifyDataAvailability(resultId);

      if (isDataAvailable && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        navigate(`/results/${resultId}`);
      }
    }
  },

  onAnalysisFailed: (data) => {
    if (data?.jobId === jobId) {
      setError("Analysis failed. Please try again.");
      setCurrentStage("failed");
    }
  }
});

// Fallback Polling Mechanism (every 3 seconds)
const startFallbackPolling = () => {
  if (pollingIntervalRef.current) return; // Already polling

  addDebugInfo("Starting fallback polling (WebSocket unavailable or safety check)");

  pollingIntervalRef.current = setInterval(async () => {
    try {
      const response = await apiService.getAssessmentStatus(jobId);

      if (response.success && response.data.status === "completed" && !hasNavigatedRef.current) {
        addDebugInfo("Polling: Analysis completed, transitioning to preparing");
        setCurrentStage("preparing");

        // Wait for data persistence
        await new Promise(resolve => setTimeout(resolve, 5000));

        const resultId = response.data.resultId || jobId;
        const isDataAvailable = await verifyDataAvailability(resultId);

        if (isDataAvailable && !hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          addDebugInfo(`Polling: Data verified, navigating to results: ${resultId}`);
          navigate(`/results/${resultId}`);
        } else if (!hasNavigatedRef.current) {
          addDebugInfo("Polling: Data verification failed, continuing polling");
          startFallbackPolling();
        }
      } else if (response.data.status === "failed") {
        setError("Analysis failed. Please try again.");
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    } catch (err) {
      addDebugInfo(`Polling error: ${err.message}`);
    }
  }, 3000); // Poll every 3 seconds
};
```

#### 4.4 Status Stages & Transitions
1. **Queued** (0-30s): Waiting in processing queue
2. **Processing** (30s-2min): Initial data processing and validation
3. **Analyzing** (2-5min): AI analysis in progress (variable duration)
4. **Preparing** (5s): Finalizing results and data persistence
5. **Completed**: Ready to view results
6. **Failed**: Analysis failed, user can retry

### Phase 5: Data Verification & Result Fetching

#### 5.1 Data Verification API
**API Endpoint**: `GET /api/archive/results/{resultId}`
**Method**: GET
**Authentication**: Bearer Token

```javascript
// Memastikan data tersedia sebelum navigasi
const verifyDataAvailability = async (resultId, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      addDebugInfo(`Verifying data availability - attempt ${attempt}/${maxRetries}`);

      const response = await apiService.getResultById(resultId);

      if (response.success && response.data) {
        addDebugInfo("Data verification successful - results are available");
        return true;
      }
    } catch (error) {
      addDebugInfo(`Data verification attempt ${attempt} failed: ${error.message}`);

      if (attempt === maxRetries) {
        addDebugInfo("Data verification failed after all attempts");
        return false;
      }

      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
};
```

#### 5.2 Result Data API Response
**Success Response (200)**:
```javascript
{
  success: true,
  data: {
    id: "result_xyz789abc123",
    user_id: "user_123",
    job_id: "job_abc123def456",
    status: "completed",
    assessment_data: {
      riasec: {
        realistic: 75,
        investigative: 82,
        artistic: 65,
        social: 90,
        enterprising: 78,
        conventional: 70
      },
      ocean: {
        openness: 85,
        conscientiousness: 78,
        extraversion: 72,
        agreeableness: 88,
        neuroticism: 45
      },
      viaIs: {
        creativity: 82,
        curiosity: 90,
        judgment: 78,
        love_of_learning: 85,
        // ... all 24 character strengths
      }
    },
    ai_analysis: {
      career_recommendations: [
        {
          title: "Software Engineer",
          match_percentage: 92,
          reasoning: "High investigative and realistic scores...",
          industry: "Technology",
          salary_range: "$80,000 - $150,000",
          growth_outlook: "Excellent"
        },
        {
          title: "Data Scientist",
          match_percentage: 88,
          reasoning: "Strong analytical and investigative traits...",
          industry: "Technology",
          salary_range: "$90,000 - $160,000",
          growth_outlook: "Excellent"
        }
        // ... more recommendations
      ],
      personality_insights: [
        {
          category: "Strengths",
          insights: [
            "You demonstrate exceptional analytical thinking...",
            "Your curiosity drives continuous learning...",
            "Strong problem-solving capabilities..."
          ]
        },
        {
          category: "Growth Areas",
          insights: [
            "Consider developing leadership skills...",
            "Networking could enhance career opportunities..."
          ]
        }
      ],
      strengths_analysis: {
        top_strengths: ["curiosity", "love_of_learning", "judgment"],
        development_areas: ["leadership", "social_intelligence"],
        character_summary: "You are a natural learner and analytical thinker..."
      },
      archetype: {
        primary: "The Analyst",
        secondary: "The Innovator",
        description: "Analytical minds who thrive on solving complex problems...",
        traits: ["Logical", "Curious", "Detail-oriented", "Independent"]
      }
    },
    metadata: {
      processing_time: "3.2 minutes",
      ai_model_version: "v2.1.0",
      confidence_score: 0.94
    },
    created_at: "2024-01-01T12:00:00Z",
    updated_at: "2024-01-01T12:03:12Z"
  }
}
```

#### 5.3 Result Fetching Implementation
```javascript
// apiService.js - getResultById method
async getResultById(resultId) {
  try {
    const response = await axios.get(
      API_ENDPOINTS.ARCHIVE.RESULT_BY_ID(resultId), // `/api/archive/results/${resultId}`
      {
        timeout: 15000, // 15 second timeout
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error("Result not found or still processing");
    } else if (error.response?.status === 403) {
      throw new Error("Access denied to this result");
    }
    throw error;
  }
}
```

## 3. Response Handling dan Result Display

### 3.1 Result Data Structure
```javascript
// Struktur data hasil assessment
{
  id: "result_id",
  user_id: "user_id", 
  job_id: "job_id",
  status: "completed",
  assessment_data: {
    riasec: { realistic: 75, investigative: 82, ... },
    ocean: { openness: 85, conscientiousness: 78, ... },
    viaIs: { creativity: 82, curiosity: 90, ... }
  },
  ai_analysis: {
    career_recommendations: [...],
    personality_insights: [...],
    strengths_analysis: [...]
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

### 3.2 Result Components
- **ResultOverview.jsx**: Ringkasan hasil dan insights utama
- **ResultRiasec.jsx**: Visualisasi RIASEC dengan radar chart
- **ResultOcean.jsx**: Analisis Big Five personality traits
- **ResultVia.jsx**: Character strengths analysis

## 4. Error Handling

### 4.1 Submission Errors
- **Insufficient Tokens (402)**: User tidak memiliki cukup token
- **Validation Errors**: Data assessment tidak valid
- **Network Errors**: Koneksi bermasalah
- **Server Errors (5xx)**: Error di sisi server

### 4.2 Status Tracking Errors
- **WebSocket Connection Failed**: Fallback ke polling
- **Data Verification Failed**: Retry mechanism
- **Analysis Failed**: Error notification ke user

## 5. Security & Performance

### 5.1 Data Security
- Encrypted storage untuk menyimpan progress assessment
- Token-based authentication untuk API calls
- Secure WebSocket connections

### 5.2 Performance Optimizations
- Real-time progress saving
- Efficient data transformation
- Hybrid notification system (WebSocket + Polling)
- Data verification before navigation

## 6. Integration Points

### 6.1 Frontend Integration
```
Assessment → AssessmentStatus → Results
     ↓              ↓              ↓
  apiService → notificationService → resultService
```

### 6.2 Backend Integration
```
POST /submit → WebSocket notification → GET /results
     ↓                    ↓                    ↓
  Job Queue → AI Processing → Result Storage
```

## Kesimpulan

Sistem assessment menggunakan arsitektur yang robust dengan multiple layers of reliability:
1. **Real-time updates** via WebSocket untuk user experience yang optimal
2. **Fallback polling** untuk memastikan reliability
3. **Data verification** sebelum navigasi untuk mencegah error
4. **Comprehensive error handling** untuk berbagai skenario failure
5. **Secure data handling** dengan encryption dan proper authentication

Alur ini memastikan bahwa user mendapat feedback real-time tentang progress assessment mereka sambil menjaga reliability dan security sistem secara keseluruhan.
