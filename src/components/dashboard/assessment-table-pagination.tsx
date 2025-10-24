"use client"

import React from 'react'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { tableStyles, getResponsiveStyles } from './assessment-table-styles'

interface AssessmentTablePaginationProps {
  windowWidth: number
  currentPage: number
  totalPages: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

const AssessmentTablePagination = React.memo(({
  windowWidth,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}: AssessmentTablePaginationProps) => {
  const responsiveStyles = getResponsiveStyles(windowWidth)

  const handleItemsPerPageChange = (value: string) => {
    onItemsPerPageChange(Number(value))
  }

  return (
    <div style={responsiveStyles.pagination}>
      <div style={tableStyles.paginationControls}>
        <span style={responsiveStyles.paginationText}>Show</span>
        <div style={responsiveStyles.paginationSelect}>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className={windowWidth >= 640 ? "w-16 h-8" : "w-12 h-6"}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span style={responsiveStyles.paginationText}>Data</span>
      </div>
      <div style={tableStyles.paginationButtons}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "ghost"}
            size="sm"
            style={{
              ...responsiveStyles.paginationButton,
              ...(currentPage === page ? tableStyles.paginationButtonActive : {})
            }}
            className={currentPage === page ? "hover:bg-[#5a6bd8]" : ""}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
      </div>
    </div>
  )
})

AssessmentTablePagination.displayName = 'AssessmentTablePagination'

export { AssessmentTablePagination }