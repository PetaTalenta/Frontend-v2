"use client"

import React from 'react'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

interface AssessmentTablePaginationProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

const AssessmentTablePagination = React.memo(({
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}: AssessmentTablePaginationProps) => {
  const handleItemsPerPageChange = (value: string) => {
    onItemsPerPageChange(Number(value))
  }

  const paginationStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    borderTop: '1px solid #e5e7eb',
    marginTop: '1rem',
    flexShrink: 0,
    flexDirection: 'row' as const,
    gap: '0'
  }

  const paginationTextStyle = {
    fontSize: '0.875rem',
    color: '#64707d'
  }

  const paginationSelectStyle = {
    width: '4rem',
    height: '2rem'
  }

  const paginationButtonStyle = {
    width: '2rem',
    height: '2rem',
    borderRadius: '0.375rem',
    backgroundColor: '#f3f3f3',
    color: '#64707d',
    fontSize: '0.875rem'
  }

  const paginationButtonActiveStyle = {
    backgroundColor: '#6475E9',
    color: 'white'
  }

  return (
    <div style={paginationStyle}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span style={paginationTextStyle}>Show</span>
        <div style={paginationSelectStyle}>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span style={paginationTextStyle}>Data</span>
      </div>
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        backgroundColor: 'transparent',
        justifyContent: 'center'
      }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "ghost"}
            size="sm"
            style={{
              ...paginationButtonStyle,
              ...(currentPage === page ? paginationButtonActiveStyle : {})
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