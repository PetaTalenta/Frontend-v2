Auth Service
Authentication, user management, and administration system for ATMA. Provides secure JWT-based authentication with role-based access control.

Base URL
https://api.chhrone.web.id/api/auth
Version
1.0.0
Port
3001
Endpoints: 8

POST
/api/auth/register
Register User
Register a new user account with email and password.

⏱️ Rate Limit
2500 requests per 15 minutes

Parameters
Name	Type	Required	Description
email	string	Yes	Valid email format, maximum 255 characters
password	string	Yes	Minimum 8 characters, must contain at least one letter and one number
Request Body
{
  "email": "user@example.com",
  "password": "myPassword1"
}
📋 Copy
Response
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": null,
      "user_type": "user",
      "is_active": true,
      "token_balance": 5,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
📋 Copy
Example
curl -X POST https://api.chhrone.web.id/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "myPassword1"
  }'
📋 Copy
POST
/api/auth/login
Login User
Authenticate user and obtain JWT token for API access.

⏱️ Rate Limit
2500 requests per 15 minutes

Parameters
Name	Type	Required	Description
email	string	Yes	Valid email format
password	string	Yes	User password
Request Body
{
  "email": "user@example.com",
  "password": "myPassword1"
}
📋 Copy
Response
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "user_type": "user",
      "is_active": true,
      "token_balance": 5
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
📋 Copy
Example
curl -X POST https://api.chhrone.web.id/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "myPassword1"
  }'
📋 Copy
GET
/api/auth/profile
Get User Profile
Get the profile information of the authenticated user.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Response
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "user_type": "user",
      "is_active": true,
      "token_balance": 5,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    "profile": {
      "full_name": "John Doe",
      "date_of_birth": "1990-01-15",
      "gender": "male",
      "school_id": 1
    }
  }
}
📋 Copy
Example
curl -X GET https://api.chhrone.web.id/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
PUT
/api/auth/profile
Update User Profile
Update the profile information of the authenticated user.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
username	string	No	Alphanumeric only, 3-100 characters
full_name	string	No	Maximum 100 characters
school_id	integer	No	Positive integer
date_of_birth	string	No	ISO date format (YYYY-MM-DD), cannot be future date
gender	string	No	Must be one of: 'male', 'female'
Request Body
{
  "username": "johndoe",
  "full_name": "John Doe",
  "school_id": 1,
  "date_of_birth": "1990-01-15",
  "gender": "male"
}
📋 Copy
Response
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "johndoe",
      "user_type": "user",
      "is_active": true,
      "token_balance": 5
    },
    "profile": {
      "full_name": "John Doe",
      "date_of_birth": "1990-01-15",
      "gender": "male",
      "school_id": 1
    }
  },
  "message": "Profile updated successfully"
}
📋 Copy
Example
curl -X PUT https://api.chhrone.web.id/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "full_name": "John Doe",
    "school_id": 1,
    "date_of_birth": "1990-01-15",
    "gender": "male"
  }'
📋 Copy
POST
/api/auth/change-password
Change Password
Change the password for the authenticated user.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
currentPassword	string	Yes	Current user password
newPassword	string	Yes	Minimum 8 characters, must contain at least one letter and one number
Request Body
{
  "currentPassword": "oldPassword1",
  "newPassword": "newPassword2"
}
📋 Copy
Response
{
  "success": true,
  "message": "Password changed successfully"
}
📋 Copy
Example
curl -X POST https://api.chhrone.web.id/api/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldPassword1",
    "newPassword": "newPassword2"
  }'
📋 Copy
GET
/api/auth/token-balance
Get Token Balance
Get the current token balance for the authenticated user.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Response
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "tokenBalance": 5,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
📋 Copy
Example
curl -X GET https://api.chhrone.web.id/api/auth/token-balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
DELETE
/api/auth/account
Delete Account
Delete the authenticated user's account (soft delete). This operation cannot be undone.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Response
{
  "success": true,
  "message": "Account deleted successfully",
  "data": {
    "deletedAt": "2024-01-15T10:30:00.000Z",
    "originalEmail": "user@example.com"
  }
}
📋 Copy
Example
curl -X DELETE https://api.chhrone.web.id/api/auth/account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
POST
/api/auth/logout
Logout User
Logout the authenticated user and invalidate the JWT token.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Response
{
  "success": true,
  "message": "Logout successful"
}
📋 Copy
Example
curl -X POST https://api.chhrone.web.id/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"






  Assessment Service
AI-driven talent mapping assessment service. Submit and monitor personality assessments using RIASEC, OCEAN, and VIA-IS frameworks for comprehensive career guidance.

Base URL
https://api.chhrone.web.id/api/assessment
Version
1.0.0
Port
3003
Endpoints: 6

POST
/api/assessment/submit
Submit Assessment
Submit assessment data for AI analysis. Assessment consists of RIASEC (6 dimensions), OCEAN (5 dimensions), and VIA-IS (24 character strengths).

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
1000 requests per 1 hour

Parameters
Name	Type	Required	Description
assessmentName	string	No	Must be one of: 'AI-Driven Talent Mapping', 'AI-Based IQ Test', or 'Custom Assessment'
riasec	object	Yes	RIASEC assessment with 6 dimensions, all scores must be integers between 0-100
ocean	object	Yes	Big Five personality traits with 5 dimensions, all scores must be integers between 0-100
viaIs	object	Yes	VIA-IS character strengths - all 24 strengths must be provided, scores between 0-100
Request Body
{
  "assessmentName": "AI-Driven Talent Mapping",
  "riasec": {
    "realistic": 75,
    "investigative": 80,
    "artistic": 65,
    "social": 70,
    "enterprising": 85,
    "conventional": 60
  },
  "ocean": {
    "openness": 80,
    "conscientiousness": 75,
    "extraversion": 70,
    "agreeableness": 85,
    "neuroticism": 40
  },
  "viaIs": {
    "creativity": 80,
    "curiosity": 85,
    "judgment": 75,
    "loveOfLearning": 90,
    "perspective": 70,
    "bravery": 65,
    "perseverance": 80,
    "honesty": 85,
    "zest": 75,
    "love": 80,
    "kindness": 85,
    "socialIntelligence": 75,
    "teamwork": 80,
    "fairness": 85,
    "leadership": 70,
    "forgiveness": 75,
    "humility": 80,
    "prudence": 75,
    "selfRegulation": 80,
    "appreciationOfBeauty": 70,
    "gratitude": 85,
    "hope": 80,
    "humor": 75,
    "spirituality": 60
  }
}
📋 Copy
Response
{
  "success": true,
  "message": "Assessment submitted successfully and queued for analysis",
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "queued",
    "estimatedProcessingTime": "2-5 minutes",
    "queuePosition": 3,
    "tokenCost": 1,
    "remainingTokens": 9
  }
}
📋 Copy
Example
curl -X POST https://api.chhrone.web.id/api/assessment/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assessmentName": "AI-Driven Talent Mapping",
    "riasec": {
      "realistic": 75,
      "investigative": 80,
      "artistic": 65,
      "social": 70,
      "enterprising": 85,
      "conventional": 60
    },
    "ocean": {
      "openness": 80,
      "conscientiousness": 75,
      "extraversion": 70,
      "agreeableness": 85,
      "neuroticism": 40
    },
    "viaIs": {
      "creativity": 80,
      "curiosity": 85,
      "judgment": 75
    }
  }'
📋 Copy
GET
/api/assessment/status/:jobId
Get Job Status
Get the processing status of an assessment job by job ID.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 10 minutes

Parameters
Name	Type	Required	Description
jobId	string	Yes	UUID of the assessment job
Response
{
  "success": true,
  "message": "Job status retrieved successfully",
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "progress": 75,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:05:00Z",
    "estimatedTimeRemaining": "2 minutes",
    "queuePosition": 1,
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "userEmail": "user@example.com",
    "resultId": "550e8400-e29b-41d4-a716-446655440002",
    "assessmentName": "AI-Driven Talent Mapping",
    "error": null
  }
}
📋 Copy
Example
curl -X GET https://api.chhrone.web.id/api/assessment/status/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
GET
/api/assessment/queue/status
Get Queue Status
Get information about the assessment processing queue for monitoring purposes.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 10 minutes

Response
{
  "success": true,
  "message": "Queue status retrieved successfully",
  "data": {
    "queueLength": 15,
    "activeWorkers": 3,
    "averageProcessingTime": "3.2 minutes",
    "estimatedWaitTime": "5-10 minutes",
    "jobStats": {
      "total": 1000,
      "queued": 15,
      "processing": 3,
      "completed": 950,
      "failed": 32
    }
  }
}
📋 Copy
Example
curl -X GET https://api.chhrone.web.id/api/assessment/queue/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
GET
/api/assessment/health
Service Health Check
Check the health status of the assessment service and its dependencies.

⏱️ Rate Limit
5000 requests per 10 minutes

Response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "assessment-service",
  "version": "1.0.0",
  "dependencies": {
    "rabbitmq": {
      "status": "healthy",
      "details": {
        "messageCount": 5,
        "consumerCount": 2
      }
    },
    "authService": {
      "status": "healthy"
    },
    "archiveService": {
      "status": "healthy"
    }
  },
  "jobs": {
    "total": 1000,
    "queued": 5,
    "processing": 2,
    "completed": 950,
    "failed": 43
  }
}
📋 Copy
Example
curl -X GET https://api.chhrone.web.id/api/assessment/health
📋 Copy
GET
/api/assessment/idempotency/health
Idempotency Health Check
Check the health status of the idempotency service to prevent duplicate submissions.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 10 minutes

Response
{
  "success": true,
  "message": "Idempotency service health check completed",
  "data": {
    "status": "healthy",
    "cacheSize": 150,
    "expiredEntries": 5,
    "lastCleanup": "2024-01-01T09:00:00Z"
  }
}
📋 Copy
Example
curl -X GET https://api.chhrone.web.id/api/assessment/idempotency/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
POST
/api/assessment/idempotency/cleanup
Cleanup Idempotency Cache
Clean up expired idempotency cache entries for maintenance purposes.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 10 minutes

Response
{
  "success": true,
  "message": "Idempotency cache cleaned up successfully",
  "data": {
    "removedEntries": 25,
    "remainingEntries": 125
  }
}
📋 Copy
Example
curl -X POST https://api.chhrone.web.id/api/assessment/idempotency/cleanup \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
Archive Service
Archive Service menyediakan API untuk mengelola hasil analisis assessment dan job tracking. API ini diakses melalui API Gateway pada port 3000 dengan prefix /api/archive/.

Base URL
http://localhost:3000/api/archive
Version
1.0.0
Port
3002
Endpoints: 14

GET
/api/archive/results
Get User Results
Mendapatkan daftar hasil analisis untuk user yang terautentikasi.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
page	number	No	Halaman data (default: 1)
limit	number	No	Jumlah data per halaman (default: 10)
status	string	No	Filter berdasarkan status
sort	string	No	Field untuk sorting (default: 'created_at')
order	string	No	Urutan sorting (default: 'DESC')
Response
{
  "success": true,
  "message": "Results retrieved successfully",
  "data": {
    "results": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "user_id": "550e8400-e29b-41d4-a716-446655440002",
        "assessment_data": {
          "riasec": {
            "realistic": 75,
            "investigative": 85,
            "artistic": 65,
            "social": 70,
            "enterprising": 80,
            "conventional": 60
          },
          "ocean": {
            "openness": 88,
            "conscientiousness": 75,
            "extraversion": 72,
            "agreeableness": 85,
            "neuroticism": 35
          },
          "viaIs": {
            "creativity": 82,
            "curiosity": 90,
            "judgment": 78,
            "loveOfLearning": 95,
            "perspective": 75,
            "bravery": 68,
            "perseverance": 85,
            "honesty": 88,
            "zest": 76,
            "love": 82,
            "kindness": 87,
            "socialIntelligence": 74,
            "teamwork": 79,
            "fairness": 86,
            "leadership": 72,
            "forgiveness": 77,
            "humility": 81,
            "prudence": 73,
            "selfRegulation": 84,
            "appreciationOfBeauty": 69,
            "gratitude": 89,
            "hope": 83,
            "humor": 71,
            "spirituality": 58
          },
          "assessmentName": "AI-Driven Talent Mapping"
        },
        "persona_profile": {
          "archetype": "The Analytical Innovator",
          "shortSummary": "Anda adalah seorang pemikir analitis dengan kecenderungan investigatif yang kuat dan kreativitas tinggi. Kombinasi antara kecerdasan logis-matematis dan keterbukaan terhadap pengalaman baru membuat Anda unggul dalam memecahkan masalah kompleks dengan pendekatan inovatif.",
          "strengthSummary": "Kekuatan utama Anda terletak pada analisis mendalam, kreativitas, dan dorongan kuat untuk belajar hal baru. Ini membuat Anda mampu menghasilkan solusi unik di berbagai situasi kompleks.",
          "strengths": [
            "Kemampuan analisis yang tajam",
            "Kreativitas dan inovasi",
            "Keingintahuan intelektual yang tinggi",
            "Kemampuan belajar mandiri yang kuat",
            "Pemikiran sistematis dan terstruktur"
          ],
          "weaknessSummary": "Anda cenderung overthinking, perfeksionis, dan kadang kurang sabar menghadapi proses lambat atau bekerja sama dengan orang lain.",
          "weaknesses": [
            "Terkadang terlalu perfeksionis",
            "Dapat terjebak dalam overthinking",
            "Kurang sabar dengan proses yang lambat",
            "Kemampuan sosial yang perlu dikembangkan",
            "Kesulitan mendelegasikan tugas"
          ],
          "careerRecommendation": [
            {
              "careerName": "Data Scientist",
              "careerProspect": {
                "jobAvailability": "high",
                "salaryPotential": "high",
                "careerProgression": "high",
                "industryGrowth": "super high",
                "skillDevelopment": "super high"
              }
            },
            {
              "careerName": "Peneliti",
              "careerProspect": {
                "jobAvailability": "moderate",
                "salaryPotential": "moderate",
                "careerProgression": "moderate",
                "industryGrowth": "moderate",
                "skillDevelopment": "high"
              }
            },
            {
              "careerName": "Pengembang Software",
              "careerProspect": {
                "jobAvailability": "super high",
                "salaryPotential": "high",
                "careerProgression": "high",
                "industryGrowth": "super high",
                "skillDevelopment": "super high"
              }
            }
          ],
          "insights": [
            "Kembangkan keterampilan komunikasi untuk menyampaikan ide kompleks dengan lebih efektif",
            "Latih kemampuan bekerja dalam tim untuk mengimbangi kecenderungan bekerja sendiri",
            "Manfaatkan kekuatan analitis untuk memecahkan masalah sosial",
            "Cari mentor yang dapat membantu mengembangkan keterampilan kepemimpinan",
            "Tetapkan batas waktu untuk menghindari analisis berlebihan"
          ],
          "skillSuggestion": [
            "Public Speaking",
            "Leadership",
            "Teamwork",
            "Time Management",
            "Delegation"
          ],
          "possiblePitfalls": [
            "Mengisolasi diri dari tim karena terlalu fokus pada analisis individu",
            "Menunda keputusan karena perfeksionisme berlebihan",
            "Kurang membangun jaringan karena terlalu fokus pada teknis"
          ],
          "riskTolerance": "moderate",
          "workEnvironment": "Lingkungan kerja yang memberikan otonomi intelektual, menghargai inovasi, dan menyediakan tantangan kognitif yang berkelanjutan. Anda berkembang di tempat yang terstruktur namun fleksibel.",
          "roleModel": [
            "Marie Curie",
            "Albert Einstein",
            "B.J. Habibie"
          ]
        },
        "status": "completed",
        "error_message": null,
        "assessment_name": "AI-Driven Talent Mapping",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:35:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
📋 Copy
Example
curl -X GET "http://localhost:3000/api/archive/results?page=1&limit=10&sort=created_at&order=DESC" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
GET
/api/archive/results/:id
Get Specific Result
Mendapatkan detail hasil analisis berdasarkan ID.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
id	UUID	Yes	ID hasil analisis
Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "assessment_data": {
      "assessmentName": "AI-Driven Talent Mapping",
      "riasec": {
        "realistic": 75,
        "investigative": 85,
        "artistic": 65,
        "social": 70,
        "enterprising": 80,
        "conventional": 60
      },
      "ocean": {
        "openness": 88,
        "conscientiousness": 75,
        "extraversion": 72,
        "agreeableness": 85,
        "neuroticism": 35
      },
      "viaIs": {
        "creativity": 82,
        "curiosity": 90,
        "judgment": 78,
        "loveOfLearning": 95,
        "perspective": 75,
        "bravery": 68,
        "perseverance": 85,
        "honesty": 88,
        "zest": 76,
        "love": 82,
        "kindness": 87,
        "socialIntelligence": 74,
        "teamwork": 79,
        "fairness": 86,
        "leadership": 72,
        "forgiveness": 77,
        "humility": 81,
        "prudence": 73,
        "selfRegulation": 84,
        "appreciationOfBeauty": 69,
        "gratitude": 89,
        "hope": 83,
        "humor": 71,
        "spirituality": 58
      }
    },
    "persona_profile": {
      "archetype": "The Analytical Innovator",
      "shortSummary": "Anda adalah seorang pemikir analitis dengan kecenderungan investigatif yang kuat dan kreativitas tinggi. Kombinasi antara kecerdasan logis-matematis dan keterbukaan terhadap pengalaman baru membuat Anda unggul dalam memecahkan masalah kompleks dengan pendekatan inovatif.",
      "strengthSummary": "Kekuatan utama Anda terletak pada analisis mendalam, kreativitas, dan dorongan kuat untuk belajar hal baru. Ini membuat Anda mampu menghasilkan solusi unik di berbagai situasi kompleks.",
      "strengths": [
        "Kemampuan analisis yang tajam",
        "Kreativitas dan inovasi",
        "Keingintahuan intelektual yang tinggi",
        "Kemampuan belajar mandiri yang kuat",
        "Pemikiran sistematis dan terstruktur"
      ],
      "weaknessSummary": "Anda cenderung overthinking, perfeksionis, dan kadang kurang sabar menghadapi proses lambat atau bekerja sama dengan orang lain.",
      "weaknesses": [
        "Terkadang terlalu perfeksionis",
        "Dapat terjebak dalam overthinking",
        "Kurang sabar dengan proses yang lambat",
        "Kemampuan sosial yang perlu dikembangkan",
        "Kesulitan mendelegasikan tugas"
      ],
      "careerRecommendation": [
        {
          "careerName": "Data Scientist",
          "careerProspect": {
            "jobAvailability": "high",
            "salaryPotential": "high",
            "careerProgression": "high",
            "industryGrowth": "super high",
            "skillDevelopment": "super high"
          }
        },
        {
          "careerName": "Peneliti",
          "careerProspect": {
            "jobAvailability": "moderate",
            "salaryPotential": "moderate",
            "careerProgression": "moderate",
            "industryGrowth": "moderate",
            "skillDevelopment": "high"
          }
        },
        {
          "careerName": "Pengembang Software",
          "careerProspect": {
            "jobAvailability": "super high",
            "salaryPotential": "high",
            "careerProgression": "high",
            "industryGrowth": "super high",
            "skillDevelopment": "super high"
          }
        }
      ],
      "insights": [
        "Kembangkan keterampilan komunikasi untuk menyampaikan ide kompleks dengan lebih efektif",
        "Latih kemampuan bekerja dalam tim untuk mengimbangi kecenderungan bekerja sendiri",
        "Manfaatkan kekuatan analitis untuk memecahkan masalah sosial",
        "Cari mentor yang dapat membantu mengembangkan keterampilan kepemimpinan",
        "Tetapkan batas waktu untuk menghindari analisis berlebihan"
      ],
      "skillSuggestion": [
        "Public Speaking",
        "Leadership",
        "Teamwork",
        "Time Management",
        "Delegation"
      ],
      "possiblePitfalls": [
        "Mengisolasi diri dari tim karena terlalu fokus pada analisis individu",
        "Menunda keputusan karena perfeksionisme berlebihan",
        "Kurang membangun jaringan karena terlalu fokus pada teknis"
      ],
      "riskTolerance": "moderate",
      "workEnvironment": "Lingkungan kerja yang memberikan otonomi intelektual, menghargai inovasi, dan menyediakan tantangan kognitif yang berkelanjutan. Anda berkembang di tempat yang terstruktur namun fleksibel.",
      "roleModel": [
        "Marie Curie",
        "Albert Einstein",
        "B.J. Habibie"
      ]
    },
    "status": "completed",
    "error_message": null,
    "assessment_name": "AI-Driven Talent Mapping",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
📋 Copy
Example
curl -X GET http://localhost:3000/api/archive/results/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
PUT
/api/archive/results/:id
Update Result
Memperbarui hasil analisis (hanya pemilik atau admin).

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
id	UUID	Yes	ID hasil analisis
Request Body
{
  "assessment_data": "Object - Data assessment yang diperbarui",
  "persona_profile": "Object - Profil persona yang diperbarui",
  "status": "String - Status hasil analisis"
}
📋 Copy
Response
{
  "success": true,
  "message": "Result updated successfully",
  "data": {
    "id": "uuid",
    "updated_at": "timestamp"
  }
}
📋 Copy
Example
curl -X PUT http://localhost:3000/api/archive/results/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "assessment_data": {...}, "persona_profile": {...}}'
📋 Copy
GET
/api/archive/jobs
Get User Jobs
Mendapatkan daftar job analisis untuk user yang terautentikasi.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
page	number	No	Halaman data (default: 1)
limit	number	No	Jumlah data per halaman (default: 10)
status	string	No	Filter berdasarkan status: 'pending', 'processing', 'completed', 'failed'
assessment_name	string	No	Filter berdasarkan nama assessment
sort	string	No	Field untuk sorting (default: 'created_at')
order	string	No	Urutan sorting (default: 'DESC')
Response
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [
      {
        "job_id": "job_12345abcdef",
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "status": "processing",
        "assessment_name": "AI-Driven Talent Mapping",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:32:00.000Z",
        "result_id": null
      },
      {
        "job_id": "job_67890ghijkl",
        "user_id": "550e8400-e29b-41d4-a716-446655440001",
        "status": "completed",
        "assessment_name": "AI-Driven Talent Mapping",
        "created_at": "2024-01-14T09:15:00.000Z",
        "updated_at": "2024-01-14T09:18:00.000Z",
        "result_id": "550e8400-e29b-41d4-a716-446655440003"
      }
    ],
    "total": 25
  }
}
📋 Copy
Example
curl -X GET "http://localhost:3000/api/archive/jobs?status=completed&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
GET
/api/archive/jobs/:jobId
Get Job Status
Mendapatkan status job berdasarkan job ID.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
jobId	string	Yes	ID job
Response
{
  "success": true,
  "message": "Job retrieved successfully",
  "data": {
    "job_id": "string",
    "user_id": "uuid",
    "status": "processing",
    "assessment_name": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "result_id": "uuid"
  }
}
📋 Copy
Example
curl -X GET http://localhost:3000/api/archive/jobs/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
GET
/api/archive/jobs/stats
Get Job Statistics
Mendapatkan statistik job untuk user yang terautentikasi.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Response
{
  "success": true,
  "message": "Job statistics retrieved successfully",
  "data": {
    "total_jobs": 50,
    "pending": 5,
    "processing": 2,
    "completed": 40,
    "failed": 3,
    "success_rate": 0.94
  }
}
📋 Copy
Example
curl -X GET http://localhost:3000/api/archive/jobs/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
DELETE
/api/archive/jobs/:jobId
Delete Job
Menghapus/membatalkan job (hanya pemilik).

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
jobId	string	Yes	ID job
Response
{
  "success": true,
  "message": "Job deleted successfully",
  "data": {
    "deleted_job_id": "string",
    "deleted_at": "timestamp"
  }
}
📋 Copy
Example
curl -X DELETE http://localhost:3000/api/archive/jobs/job_12345abcdef \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
GET
/api/archive/stats
Get User Statistics
Mendapatkan statistik untuk user yang terautentikasi.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Response
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "total_results": 25,
    "total_jobs": 30,
    "completed_assessments": 25,
    "archetype_distribution": {
      "The Analytical Innovator": 8,
      "The Creative Collaborator": 6,
      "The Strategic Leader": 4,
      "The Empathetic Helper": 7
    },
    "recent_activity": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "archetype": "The Analytical Innovator",
        "created_at": "2024-01-15T10:30:00.000Z",
        "status": "completed"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "archetype": "The Creative Collaborator",
        "created_at": "2024-01-14T15:20:00.000Z",
        "status": "completed"
      }
    ]
  }
}
📋 Copy
Example
curl -X GET http://localhost:3000/api/archive/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
GET
/api/archive/stats/overview
Get User Overview
Mendapatkan overview statistik untuk dashboard user.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Response
{
  "success": true,
  "message": "Overview retrieved successfully",
  "data": {
    "summary": {
      "total_assessments": 25,
      "this_month": 5,
      "success_rate": 0.96
    },
    "recent_results": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "archetype": "The Analytical Innovator",
        "assessment_name": "AI-Driven Talent Mapping",
        "created_at": "2024-01-15T10:30:00.000Z",
        "status": "completed"
      }
    ],
    "archetype_summary": {
      "most_common": "The Analytical Innovator",
      "frequency": 3,
      "last_archetype": "The Creative Collaborator",
      "unique_archetypes": 4,
      "archetype_trend": "consistent"
    }
  }
}
📋 Copy
Example
curl -X GET http://localhost:3000/api/archive/stats/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
DELETE
/api/archive/results/:resultId
Delete Result
Menghapus hasil analisis (hanya pemilik).

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
resultId	UUID	Yes	ID hasil analisis
Response
{
  "success": true,
  "message": "Result deleted successfully",
  "data": {
    "deleted_result_id": "550e8400-e29b-41d4-a716-446655440000",
    "deleted_at": "2024-01-15T10:30:00.000Z"
  }
}
📋 Copy
Example
curl -X DELETE http://localhost:3000/api/archive/results/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
GET
/api/archive/v1/stats
Unified Statistics
Endpoint statistik terpadu dengan parameter fleksibel.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
type	string	No	Tipe statistik: user, system, demographic, performance
scope	string	No	Scope: overview, detailed, analysis, summary
timeRange	string	No	Rentang waktu: '1 day', '7 days', '30 days', '90 days'
Response
{
  "success": true,
  "message": "Unified statistics retrieved successfully",
  "data": "Varies based on parameters"
}
📋 Copy
Example
curl -X GET "http://localhost:3000/api/archive/v1/stats?type=user&scope=overview&timeRange=30 days" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
GET
/api/archive/v1/data/:type
Unified Data Retrieval
Endpoint pengambilan data terpadu.

🔐 Authentication Required
Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
type	string	Yes	Tipe data: results, jobs, demographics
page	number	No	Halaman data (default: 1)
limit	number	No	Jumlah data per halaman (default: 10)
sort	string	No	Field untuk sorting
order	string	No	Urutan sorting
Response
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": "Varies based on type parameter"
}
📋 Copy
Example
curl -X GET "http://localhost:3000/api/archive/v1/data/results?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
📋 Copy
DELETE
/api/archive/admin/users/:userId
Delete User (Admin)
Admin endpoint untuk menghapus user dengan soft delete. Hanya dapat diakses oleh admin dengan role 'admin' atau 'superadmin'.

🔐 Authentication Required
Admin Bearer Token Required

⏱️ Rate Limit
5000 requests per 15 minutes

Parameters
Name	Type	Required	Description
userId	UUID	Yes	ID user yang akan dihapus
Response
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "deletedUserId": "550e8400-e29b-41d4-a716-446655440000",
    "originalEmail": "user@example.com",
    "newEmail": "deleted_1705312200_user@example.com",
    "deletedAt": "2024-01-15T10:30:00.000Z",
    "deletedBy": {
      "adminId": "550e8400-e29b-41d4-a716-446655440001",
      "adminUsername": "admin_user"
    }
  }
}
📋 Copy
Example
curl -X DELETE http://localhost:3000/api/archive/admin/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
📋 Copy
GET
/api/archive/health
Service Health
Mengecek status kesehatan service (tidak memerlukan autentikasi).

🔐 Authentication Required
None

⏱️ Rate Limit
No limit

Response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "version": "1.0.0",
  "service": "archive-service"
}
📋 Copy
Example
curl -X GET http://localhost:3000/api/archive/health