"use client"

import React, { useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Skeleton } from './skeleton'
import { AssessmentActionButtons } from './assessment-table-action-buttons'
import type { AssessmentData } from '../../types/dashboard'
import { getStatusText, formatDateTimeForTable } from '../../hooks/useJobs'
import { tableStyles, getResponsiveStyles } from './assessment-table-styles'

interface AssessmentTableBodyProps {
  windowWidth: number
  isLoading: boolean
  currentData: AssessmentData[]
  startIndex: number
  itemsPerPage: number
  isDeleting: string | null
  onView: (id: number) => void
  onDelete: (id: number) => void
}

const AssessmentTableBody = React.memo(({
  windowWidth,
  isLoading,
  currentData,
  startIndex,
  itemsPerPage,
  isDeleting,
  onView,
  onDelete
}: AssessmentTableBodyProps) => {
  const responsiveStyles = useMemo(() => getResponsiveStyles(windowWidth), [windowWidth])

  const skeletonRows = useMemo(() => 
    [...Array(3)].map((_, idx) => (
      <TableRow key={`skeleton-${idx}`}>
        <TableCell style={responsiveStyles.tableCell}>
          <Skeleton className="h-4 w-6" />
        </TableCell>
        <TableCell style={responsiveStyles.tableCell}>
          <Skeleton className="h-4 w-48" />
        </TableCell>
        <TableCell 
          style={{
            ...responsiveStyles.tableCell,
            ...tableStyles.tableCellSecondary,
            display: windowWidth >= 1024 ? 'table-cell' : 'none'
          }}
        >
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell style={responsiveStyles.tableCell}>
          <Skeleton className="h-6 w-24" />
        </TableCell>
        <TableCell style={responsiveStyles.tableCell}>
          <div style={tableStyles.actionButtons}>
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </TableCell>
      </TableRow>
    )),
    [responsiveStyles, windowWidth]
  )

  const dataRows = useMemo(() =>
    currentData.map((item, index) => {
      const isPending = (item as any)._isPending

      return (
        <TableRow
          key={item.id}
          style={{
            ...tableStyles.tableRow,
            opacity: isPending ? 0.6 : 1,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <TableCell style={responsiveStyles.tableCell}>
            {startIndex + index + 1}
          </TableCell>
          <TableCell style={responsiveStyles.tableCell}>
            {item.archetype}
            {isPending && (
              <span style={tableStyles.pendingText}>
                (Syncing...)
              </span>
            )}
          </TableCell>
          <TableCell 
            style={{
              ...responsiveStyles.tableCell,
              ...tableStyles.tableCellSecondary,
              display: windowWidth >= 1024 ? 'table-cell' : 'none'
            }}
          >
            {formatDateTimeForTable(item.created_at)}
          </TableCell>
          <TableCell style={responsiveStyles.tableCell}>
            <div style={tableStyles.statusBadge}>
              {getStatusText(item.status)}
            </div>
          </TableCell>
          <TableCell style={responsiveStyles.tableCell}>
            <AssessmentActionButtons
              item={item}
              windowWidth={windowWidth}
              isDeleting={isDeleting}
              onView={onView}
              onDelete={onDelete}
            />
          </TableCell>
        </TableRow>
      )
    }),
    [currentData, startIndex, responsiveStyles, windowWidth, isDeleting, onView, onDelete]
  )

  const fillerRows = useMemo(() =>
    currentData.length < itemsPerPage && Array.from({ length: itemsPerPage - currentData.length }).map((_, idx) => (
      <TableRow key={`empty-${idx}`} style={tableStyles.emptyRow}>
        <TableCell style={responsiveStyles.tableCell}>&nbsp;</TableCell>
        <TableCell style={responsiveStyles.tableCell}>&nbsp;</TableCell>
        <TableCell 
          style={{
            ...responsiveStyles.tableCell,
            ...tableStyles.tableCellSecondary,
            display: windowWidth >= 1024 ? 'table-cell' : 'none'
          }}
        >&nbsp;</TableCell>
        <TableCell style={responsiveStyles.tableCell}>&nbsp;</TableCell>
        <TableCell style={responsiveStyles.tableCell}>
          <div style={tableStyles.actionButtons} />
        </TableCell>
      </TableRow>
    )),
    [currentData.length, itemsPerPage, responsiveStyles, windowWidth]
  )

  return (
    <Table style={responsiveStyles.table}>
      <TableHeader>
        <TableRow style={tableStyles.tableRow}>
          <TableHead style={responsiveStyles.tableHeader}>No</TableHead>
          <TableHead style={responsiveStyles.tableHeader}>Archetype</TableHead>
          <TableHead 
            style={{
              ...responsiveStyles.tableHeader,
              display: windowWidth >= 1024 ? 'table-cell' : 'none'
            }}
          >
            Waktu
          </TableHead>
          <TableHead style={responsiveStyles.tableHeader}>Status</TableHead>
          <TableHead style={responsiveStyles.tableHeader}>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? skeletonRows : (
          <>
            {dataRows}
            {fillerRows}
          </>
        )}
      </TableBody>
    </Table>
  )
})

AssessmentTableBody.displayName = 'AssessmentTableBody'

export { AssessmentTableBody }