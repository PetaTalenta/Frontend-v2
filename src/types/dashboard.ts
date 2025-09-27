export interface AssessmentData {
  id: number;
  archetype: string;                 // persona_profile.archetype or title (flattened for table)
  created_at: string;                // original created_at from API (string/ISO/date-like)
  status: string;                    // raw API status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | ...
  result_id?: string;                // API result id if available
  assessment_name?: string;          // API assessment_name
  job_id?: string;                   // Job id (for enrichment fallback)
}

export interface StatCard {
  id: string
  value: number
  label: string
  color: string
  icon: string
}

export interface ProgressItem {
  label: string
  value: number
}

export interface ChartData {
  label: string
  value: number
  color: string
}
