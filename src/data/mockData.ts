import type { AssessmentData, StatCard, ProgressItem, ChartData } from "../types/dashboard"

// Assessment data is now fetched from API - no more mock data
export const assessmentData: AssessmentData[] = []

export const statsData: StatCard[] = [
  { id: "analysis", value: 3, label: "Total Analysis", color: "#dbeafe", icon: "MagnifyingGlass.svg" },
  { id: "completed", value: 4, label: "Completed", color: "#dbfce7", icon: "Check.svg" },
  { id: "processing", value: 6, label: "Processing", color: "#dbeafe", icon: "Cpu.svg" },
  { id: "balance", value: 2, label: "Token Balance", color: "#f3e8ff", icon: "Command.svg" },
]

export const progressData: ProgressItem[] = [
  { label: "Investigative", value: 71 },
  { label: "Arts", value: 92 },
  { label: "Practical", value: 32 },
  { label: "Social", value: 54 },
  { label: "Leadership ", value: 86 },
  { label: "Analytical ", value: 71 },
]

export const chartData: ChartData[] = [
  { label: "Category 1", value: 30, color: "#d0d5dd" },
  { label: "Category 2", value: 50, color: "#6475e9" },
  { label: "Category 3", value: 70, color: "#9e9e9e" },
  { label: "Category 4", value: 40, color: "#6475e9" },
  { label: "Category 5", value: 25, color: "#a2acf2" },
]
