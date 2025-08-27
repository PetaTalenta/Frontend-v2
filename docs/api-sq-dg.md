sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as API Server
    participant WS as WebSocket
    participant AI as AI Engine
    participant DB as Database
    
    Note over U,DB: Phase 1: Assessment Preparation
    U->>F: Start Assessment
    F->>API: GET /api/auth/token-balance
    API-->>F: Token Balance Response
    
    alt Insufficient Tokens
        F-->>U: Show Token Error
    else Sufficient Tokens
        Note over U,F: Phase 2: Assessment Filling
        U->>F: Fill Questions (RIASEC, Big Five, VIA)
        F->>F: Save Progress to Encrypted Storage
        
        Note over U,DB: Phase 3: Assessment Submission
        U->>F: Submit Assessment
        F->>F: Transform & Validate Data
        F->>API: POST /api/assessment/submit
        API->>DB: Store Assessment Data
        API->>AI: Queue Analysis Job
        API-->>F: Job ID Response
        F->>F: Clear Saved Progress
        F-->>U: Navigate to Status Page
        
        Note over U,DB: Phase 4: Status Tracking
        F->>WS: Connect WebSocket
        WS-->>F: Connection Established
        F->>WS: Authenticate with JWT
        WS-->>F: Authentication Success
        
        F->>API: GET /api/assessment/status/{jobId}
        API-->>F: Status: queued
        
        loop Status Polling (Fallback)
            F->>API: GET /api/assessment/status/{jobId}
            API-->>F: Status: processing/analyzing
        end
        
        Note over AI,DB: AI Analysis Process
        AI->>AI: Analyze Assessment Data
        AI->>DB: Store Analysis Results
        AI->>WS: Emit analysis-complete event
        
        WS-->>F: analysis-complete notification
        F->>F: Transition to Preparing Stage
        F->>F: Wait 5 seconds for data persistence
        
        Note over F,DB: Phase 5: Data Verification & Results
        F->>API: GET /api/archive/results/{resultId}
        API->>DB: Fetch Result Data
        
        alt Data Not Ready
            API-->>F: 404 Not Found
            F->>F: Retry Verification
        else Data Ready
            API-->>F: Complete Result Data
            F-->>U: Navigate to Results Page
            F-->>U: Display Assessment Results
        end
    end
    
    Note over U,DB: Error Handling Scenarios
    alt WebSocket Fails
        WS-->>F: Connection Lost
        F->>F: Start Fallback Polling
    end
    
    alt Analysis Fails
        AI->>WS: Emit analysis-failed event
        WS-->>F: analysis-failed notification
        F-->>U: Show Error Message
    end