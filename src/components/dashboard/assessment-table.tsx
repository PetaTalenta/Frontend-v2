"use client"

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AssessmentTableHeader } from './assessment-table-header'
import { AssessmentTableBody } from './assessment-table-body'
import { AssessmentTablePagination } from './assessment-table-pagination'
import type { AssessmentData } from '../../types/dashboard'

interface AssessmentTableProps {
  data: AssessmentData[]
  onRefresh?: () => Promise<void>
  swrKey?: string
  isLoading?: boolean
  isValidating?: boolean
}

const AssessmentTableComponent = ({
  data,
  onRefresh,
  swrKey,
  isLoading = false,
  isValidating = false
}: AssessmentTableProps) => {
  const router = useRouter()
  
  // State management
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Computed values with useMemo for performance
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(data.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentData = data.slice(startIndex, endIndex)
    
    return {
      totalPages,
      startIndex,
      endIndex,
      currentData
    }
  }, [data, currentPage, itemsPerPage])

  // Reset pagination when data changes
  React.useEffect(() => {
    if (currentPage > paginationData.totalPages && paginationData.totalPages > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, paginationData.totalPages])

  // Event handlers with useCallback to prevent race conditions
  const handleNewAssessment = useCallback(() => {
    router.push("/select-assessment")
  }, [router])

  const handleView = useCallback(async (id: number) => {
    try {
      // Find the assessment item to get the correct identifiers
      const assessmentItem = data.find(item => item.id === id)

      if (!assessmentItem) {
        console.error('Assessment item not found for ID:', id)
        alert('Assessment tidak ditemukan. Silakan refresh halaman dan coba lagi.')
        return
      }

      // Use the resultId from the assessment item, or generate a legacy format as fallback
      const resultId = assessmentItem.result_id || `result-${id}`
      const jobId = assessmentItem.job_id

      console.log('Navigating to result:', resultId)
      console.log('Assessment item:', assessmentItem)

      // Navigate to comprehensive results page, include jobId when available
      const url = jobId ? `/results/${resultId}?jobId=${encodeURIComponent(jobId)}` : `/results/${resultId}`
      router.push(url)

    } catch (error) {
      console.error('Error navigating to results:', error)
      alert('Gagal membuka halaman hasil. Silakan coba lagi.')
    }
  }, [data, router])

  const handleDelete = useCallback(async (id: number) => {
    // Find the assessment item to get identifiers
    const assessmentItem = data.find(item => item.id === id)
    const resultId = assessmentItem?.result_id || null
    const jobId = assessmentItem?.job_id || null

    if (!resultId && !jobId) {
      console.error('No result_id or job_id found for assessment item:', id)
      alert('ID hasil atau job tidak ditemukan.')
      return
    }

    const deletingKey = (resultId || jobId)!
    setIsDeleting(deletingKey)

    try {
      // Simulasi delete operation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Here you would make the actual API call to delete
      // await deleteAssessment(resultId, jobId)
      
      setIsDeleting(null)
      alert('Assessment berhasil dihapus (dummy)')
      
      // Refresh data if onRefresh is provided
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      console.error('Error deleting assessment:', error)
      setIsDeleting(null)
      alert('Gagal menghapus assessment. Silakan coba lagi.')
    }
  }, [data, onRefresh])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }, [])

  return (
    <div style={{
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '0.5rem',
      border: '1px solid #eaecf0',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      height: 'auto'
    }}>
      <AssessmentTableHeader
        onNewAssessment={handleNewAssessment}
      />
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: '0',
        padding: '1rem'
      }}>
        <div style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'visible',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin'
        }}>
          <AssessmentTableBody
            isLoading={isLoading || isValidating}
            currentData={paginationData.currentData}
            startIndex={paginationData.startIndex}
            itemsPerPage={itemsPerPage}
            isDeleting={isDeleting}
            onView={handleView}
            onDelete={handleDelete}
          />
        </div>
        
        {paginationData.totalPages > 0 && (
          <AssessmentTablePagination
            currentPage={currentPage}
            totalPages={paginationData.totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>
    </div>
  )
}

export const AssessmentTable = React.memo(AssessmentTableComponent)
AssessmentTable.displayName = 'AssessmentTable'
export type { AssessmentTableProps }