"use client"

import { useState, useCallback } from "react"
import type { AssessmentData } from "../types/dashboard"

export function useDashboard() {
  const [assessments, setAssessments] = useState<AssessmentData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addAssessment = useCallback((assessment: Omit<AssessmentData, "id">) => {
    const newAssessment: AssessmentData = {
      ...assessment,
      id: Date.now(), // Simple ID generation
    }
    setAssessments((prev) => [...prev, newAssessment])
  }, [])

  const deleteAssessment = useCallback((id: number) => {
    setAssessments((prev) => prev.filter((assessment) => assessment.id !== id))
  }, [])

  const updateAssessment = useCallback((id: number, updates: Partial<AssessmentData>) => {
    setAssessments((prev) =>
      prev.map((assessment) => (assessment.id === id ? { ...assessment, ...updates } : assessment)),
    )
  }, [])

  const fetchAssessments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // In real app, this would be an actual API call
      setLoading(false)
    } catch (err) {
      setError("Failed to fetch assessments")
      setLoading(false)
    }
  }, [])

  return {
    assessments,
    loading,
    error,
    addAssessment,
    deleteAssessment,
    updateAssessment,
    fetchAssessments,
  }
}
