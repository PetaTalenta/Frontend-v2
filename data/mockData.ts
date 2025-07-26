import type { AssessmentData, StatCard, ProgressItem, ChartData } from "../types/dashboard"

export const assessmentData: AssessmentData[] = [
  { id: 1, nama: "Matematika", tipe: "PG", tanggal: "12 Juni 2024", status: "Selesai" },
  { id: 2, nama: "Bahasa Inggris", tipe: "PG", tanggal: "12 Juni 2024", status: "Selesai" },
  { id: 3, nama: "Bahasa Indonesia", tipe: "PG", tanggal: "22 Juni 2024", status: "Belum Selesai" },
  { id: 4, nama: "Biologi", tipe: "Essay", tanggal: "22 Juni 2024", status: "Selesai" },
  { id: 6, nama: "Bahasa Inggris", tipe: "PG", tanggal: "12 Juni 2024", status: "Belum Selesai" },
  { id: 7, nama: "Kimia", tipe: "Essay", tanggal: "16 Juni 2024", status: "Selesai" },
  { id: 8, nama: "Fisika", tipe: "PG", tanggal: "18 Juni 2024", status: "Belum Selesai" },
  { id: 9, nama: "Fisika", tipe: "PG", tanggal: "18 Juni 2024", status: "Selesai" },
  { id: 10, nama: "Fisika", tipe: "PG", tanggal: "18 Juni 2024", status: "Belum Selesai" },
]

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
