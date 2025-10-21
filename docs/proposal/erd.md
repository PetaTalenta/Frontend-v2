```mermaid
erDiagram
  USERS {
    uuid id PK
    varchar full_name
    citext email UNIQUE
    text firebase_uid UNIQUE
    boolean email_verified
    text provider
    timestamptz last_login_at
    varchar phone_number UNIQUE
    varchar wa_number
    text address
    user_role role
    timestamptz created_at
    timestamptz updated_at 
  }

  INSTRUCTOR_PROFILES {
    uuid user_id PK
    text bio
    text specialization
    timestamptz created_at
    timestamptz updated_at
    varchar full_name
    citext email
    varchar wa_number
  }

  COURSES {
    uuid id PK
    varchar title
    text description
    course_level level
    numeric price_per_session
    int duration_minutes
    int max_students
    boolean is_active
    timestamptz created_at
    timestamptz updated_at
    varchar instrument
  }

  CLASS_SCHEDULES {
    uuid id PK
    uuid course_id FK
    uuid instructor_id FK
    uuid room_id FK
    timestamptz start_time
    timestamptz end_time
    timestamptz created_at
    timestamptz updated_at
    uuid booking_id FK nullable unique
  }

  ROOMS {
    uuid id PK
    varchar name UNIQUE
    int capacity
    text description
    timestamptz created_at
    timestamptz updated_at
  }

  ROOM_AVAILABILITY {
    uuid id PK
    uuid room_id FK
    varchar day_of_week
    time start_time
    time end_time
    boolean is_available
    timestamptz created_at
    timestamptz updated_at
  }

  BOOKINGS {
    uuid id PK
    uuid user_id
    uuid course_id FK
    uuid first_choice_slot_id FK nullable
    uuid second_choice_slot_id FK nullable
    uuid confirmed_slot_id FK nullable
    booking_status status
    timestamptz expires_at
    timestamptz confirmed_at
    varchar experience_level
    text[] preferred_days
    jsonb preferred_time_range
    date start_date_target
    varchar guardian_name
    varchar guardian_wa_number
    boolean instrument_owned
    text notes
    varchar referral_source
    timestamptz created_at
    timestamptz updated_at
    varchar applicant_full_name
    citext applicant_email
    varchar applicant_wa_number
    jsonb first_preference
    jsonb second_preference
  }

  ENROLLMENTS {
    uuid id PK
    uuid course_id FK
    timestamptz registration_date
    enrollment_status status
    timestamptz created_at
    timestamptz updated_at
    uuid booking_id FK nullable
  }

  TEST_ASSESSMENT {
    uuid id PK
    varchar session_id
    jsonb assessment_data
    varchar status
    timestamptz created_at
    timestamptz updated_at
  }

  RESULT_TEST {
    uuid id PK
    uuid assessment_id FK
    varchar session_id
    jsonb ai_analysis
    varchar status
    timestamptz created_at
    timestamptz updated_at
  }

  %% Relationships
  USERS ||--|| INSTRUCTOR_PROFILES : "user_id"
  INSTRUCTOR_PROFILES ||--o{ CLASS_SCHEDULES : "instructor -> schedules"

  COURSES ||--o{ CLASS_SCHEDULES : "course -> schedules"
  COURSES ||--o{ ENROLLMENTS : "course -> enrollments"
  COURSES ||--o{ BOOKINGS : "course -> bookings"

  ROOMS ||--o{ CLASS_SCHEDULES : "room -> schedules"
  ROOMS ||--o{ ROOM_AVAILABILITY : "room -> availability"

  CLASS_SCHEDULES ||--o{ BOOKINGS : "slot referenced by bookings"
  BOOKINGS }o--|| CLASS_SCHEDULES : "first_choice_slot_id, second_choice_slot_id, confirmed_slot_id"
  CLASS_SCHEDULES }o--|| BOOKINGS : "booking_id"

  BOOKINGS ||--o{ ENROLLMENTS : "booking -> enrollment"

  TEST_ASSESSMENT ||--o{ RESULT_TEST : "assessment -> results"

```