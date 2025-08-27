export interface AssessmentData {
  id: number
  nama: string
  tipe: "PG" | "Essay" | "Personality Assessment"
  tanggal: string
  status: "Belum Selesai" | "Selesai"
  resultId?: string
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
