graph TD
    A[User Starts Assessment] --> B[Load Saved Progress]
    B --> C[Check Token Balance]
    C --> D{Has Sufficient Tokens?}
    D -->|No| E[Show Token Error]
    D -->|Yes| F[Fill Assessment Questions]
    
    F --> G[RIASEC - 60 Questions]
    F --> H[Big Five - 50 Questions] 
    F --> I[VIA Strengths - 120 Questions]
    
    G --> J{All Complete?}
    H --> J
    I --> J
    
    J -->|No| K[Save Progress to Storage]
    K --> F
    J -->|Yes| L[Transform Data to API Format]
    
    L --> M[Validate Assessment Data]
    M --> N{Validation Passed?}
    N -->|No| O[Show Validation Error]
    N -->|Yes| P[POST /api/assessment/submit]
    
    P --> Q{Submission Success?}
    Q -->|No| R[Handle Error Response]
    R --> S[Show Error Message]
    Q -->|Yes| T[Receive Job ID]
    
    T --> U[Clear Saved Progress]
    U --> V[Navigate to Status Page]
    
    V --> W[Initialize WebSocket Connection]
    W --> X[Setup Status Polling Fallback]
    
    X --> Y[GET /api/assessment/status/jobId]
    Y --> Z{Status Check}
    
    Z -->|queued| AA[Show Queue Position]
    Z -->|processing| BB[Show Processing Stage]
    Z -->|analyzing| CC[Show Analysis Progress]
    Z -->|failed| DD[Show Error Message]
    Z -->|completed| EE[Transition to Preparing]
    
    AA --> Y
    BB --> Y
    CC --> Y
    
    EE --> FF[Wait 5 seconds for Data Persistence]
    FF --> GG[Verify Data Availability]
    GG --> HH[GET /api/archive/results/resultId]
    
    HH --> II{Data Available?}
    II -->|No| JJ[Retry Verification]
    JJ --> GG
    II -->|Yes| KK[Navigate to Results Page]
    
    KK --> LL[Display Assessment Results]
    LL --> MM[Show RIASEC Analysis]
    LL --> NN[Show Big Five Analysis]
    LL --> OO[Show Character Strengths]
    LL --> PP[Show Career Recommendations]
    LL --> QQ[Show AI Insights]
    
    %% WebSocket Events
    W --> RR[WebSocket: analysis-complete]
    RR --> EE
    W --> SS[WebSocket: analysis-failed] 
    SS --> DD
    
    %% Styling
    classDef apiCall fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef userAction fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    
    class P,Y,HH apiCall
    class A,F,G,H,I userAction
    class D,J,N,Q,Z,II decision
    class E,O,R,S,DD error
    class KK,LL,MM,NN,OO,PP,QQ success