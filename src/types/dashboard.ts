export interface AssessmentData {
  id: number;
  archetype: string;
  created_at: string;
  status: string;
  result_id?: string | null;
  job_id?: string | null;
}

export interface StatCard {
  id: string;
  label: string;
  value: number;
  color: string;
  icon: string;
  iconColor?: string; // Optional custom icon color
}

export interface ProgressItem {
  label: string;
  value: number;
}

export interface ChartData {
  label: string;
  value: number;
  color: string;
}

// Jobs API Types
export interface JobData {
  id: string;
  job_id: string;
  user_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result_id: string | null;
  assessment_name: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
  priority: number;
  retry_count: number;
  max_retries: number;
  processing_started_at: string | null;
  archetype: string | null;
}

export interface JobsPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface JobsResponse {
  success: boolean;
  message: string;
  data: {
    jobs: JobData[];
    pagination: JobsPagination;
  };
}

export interface JobsParams {
  page?: number;
  limit?: number;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  assessment_name?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

// Jobs Stats Types
export interface JobsStatsData {
  total_jobs: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  success_rate: number;
  avg_processing_time_seconds: number;
}

export interface JobsStatsResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: JobsStatsData;
}

// Dashboard Stats Types
export interface DashboardStats {
  processing: number;
  completed: number;
  failed: number;
  tokenBalance: number;
  totalJobs: number;
  successRate: number;
  avgProcessingTime: number;
}

export interface DashboardStatsData {
  jobsStats: JobsStatsData;
  tokenBalance: number;
}