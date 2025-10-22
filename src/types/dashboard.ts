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