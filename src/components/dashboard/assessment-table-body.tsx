 "use client"

import React, { useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Skeleton } from './skeleton'
import { AssessmentActionButtons } from './assessment-table-action-buttons'
import type { AssessmentData } from '../../types/dashboard'
import { getStatusText, formatDateTimeForTable, getStatusBadgeVariant } from '../../hooks/useJobs'

interface AssessmentTableBodyProps {
  isLoading: boolean
  currentData: AssessmentData[]
  startIndex: number
  itemsPerPage: number
  isDeleting: string | null
  onView: (id: number) => void
  onDelete: (id: number) => void
}

const AssessmentTableBody = React.memo(({
  isLoading,
  currentData,
  startIndex,
  itemsPerPage,
  isDeleting,
  onView,
  onDelete
}: AssessmentTableBodyProps) => {
  const tableCellStyle = useMemo(() => ({
    color: '#1e1e1e',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    fontSize: '0.875rem'
  }), [])

  const getStatusBadgeStyle = useMemo(() => (status: string) => {
    const variant = getStatusBadgeVariant(status)
    // Parse the CSS classes to convert to inline styles
    const styles: React.CSSProperties = {}
    
    // Extract background color
    if (variant.includes('bg-[#DBFCE7]')) {
      styles.backgroundColor = '#DBFCE7'
      styles.color = '#00A63E'
      styles.border = '1px solid #a6f4c5'
    } else if (variant.includes('bg-[#DBEAFE]')) {
      styles.backgroundColor = '#DBEAFE'
      styles.color = '#6C7EEB'
      styles.border = '1px solid #93c5fd'
    } else if (variant.includes('bg-[#fca5a5]')) {
      styles.backgroundColor = '#fca5a5'
      styles.color = '#DE3729'
      styles.border = '1px solid #fecaca'
    } else if (variant.includes('bg-[#f2f2f2]')) {
      styles.backgroundColor = '#f2f2f2'
      styles.color = '#666666'
      styles.border = '1px solid #e0e0e0'
    }
    
    return styles
  }, [])

  const tableHeaderStyle = useMemo(() => ({
    fontWeight: 500,
    color: '#64707d',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    fontSize: '0.875rem'
  }), [])

  const skeletonRows = useMemo(() =>
    [...Array(3)].map((_, idx) => (
      <TableRow key={`skeleton-${idx}`}>
        <TableCell style={tableCellStyle}>
          <Skeleton className="h-4 w-6" />
        </TableCell>
        <TableCell style={tableCellStyle}>
          <Skeleton className="h-4 w-48" />
        </TableCell>
        <TableCell
          style={{
            ...tableCellStyle,
            color: '#64707d',
            textAlign: 'center',
            paddingRight: '1.5rem'
          }}
        >
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell style={{
          ...tableCellStyle,
          textAlign: 'center',
          width: '120px',
          paddingRight: '1.5rem'
        }}>
          <Skeleton className="h-6 w-24" />
        </TableCell>
        <TableCell style={{
          ...tableCellStyle,
          textAlign: 'center',
          paddingLeft: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </TableCell>
      </TableRow>
    )),
    [tableCellStyle]
  )

  const dataRows = useMemo(() =>
    currentData.map((item, index) => {
      const isPending = (item as any)._isPending

      return (
        <TableRow
          key={item.id}
          style={{
            borderColor: '#eaecf0',
            opacity: isPending ? 0.6 : 1,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <TableCell style={tableCellStyle}>
            {startIndex + index + 1}
          </TableCell>
          <TableCell style={tableCellStyle}>
            {item.archetype}
            {isPending && (
              <span style={{
                marginLeft: '0.5rem',
                fontSize: '0.75rem',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                (Syncing...)
              </span>
            )}
          </TableCell>
          <TableCell
            style={{
              ...tableCellStyle,
              color: '#64707d',
              textAlign: 'center',
              paddingRight: '1.5rem'
            }}
          >
            {formatDateTimeForTable(item.created_at)}
          </TableCell>
          <TableCell style={{
            ...tableCellStyle,
            textAlign: 'center',
            width: '120px',
            paddingRight: '1.5rem'
          }}>
            <div style={{
              ...getStatusBadgeStyle(item.status),
              padding: '0.25rem 0.75rem',
              borderRadius: '0.75rem',
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'inline-block',
              width: '100%',
              textAlign: 'center'
            }}>
              {getStatusText(item.status)}
            </div>
          </TableCell>
          <TableCell style={{
            ...tableCellStyle,
            textAlign: 'center',
            paddingLeft: '1.5rem'
          }}>
            <AssessmentActionButtons
              item={item}
              isDeleting={isDeleting}
              onView={onView}
              onDelete={onDelete}
            />
          </TableCell>
        </TableRow>
      )
    }),
    [currentData, startIndex, tableCellStyle, isDeleting, onView, onDelete, getStatusBadgeStyle]
  )

  const fillerRows = useMemo(() =>
    currentData.length < itemsPerPage && Array.from({ length: itemsPerPage - currentData.length }).map((_, idx) => (
      <TableRow key={`empty-${idx}`} style={{
        borderColor: '#eaecf0',
        opacity: 0.5
      }}>
        <TableCell style={tableCellStyle}>&nbsp;</TableCell>
        <TableCell style={tableCellStyle}>&nbsp;</TableCell>
        <TableCell
          style={{
            ...tableCellStyle,
            color: '#64707d',
            textAlign: 'center',
            paddingRight: '1.5rem'
          }}
        >&nbsp;</TableCell>
        <TableCell style={{
          ...tableCellStyle,
          textAlign: 'center',
          width: '120px',
          paddingRight: '1.5rem'
        }}>&nbsp;</TableCell>
        <TableCell style={{
          ...tableCellStyle,
          textAlign: 'center',
          paddingLeft: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center'
          }} />
        </TableCell>
      </TableRow>
    )),
    [currentData.length, itemsPerPage, tableCellStyle]
  )

  return (
    <Table style={{
      minWidth: '100%'
    }}>
      <TableHeader>
        <TableRow style={{
          borderColor: '#eaecf0'
        }}>
          <TableHead style={tableHeaderStyle}>No</TableHead>
          <TableHead style={tableHeaderStyle}>Archetype</TableHead>
          <TableHead style={{
            ...tableHeaderStyle,
            textAlign: 'center',
            paddingRight: '1.5rem'
          }}>
            Waktu
          </TableHead>
          <TableHead style={{
            ...tableHeaderStyle,
            textAlign: 'center',
            width: '120px',
            paddingRight: '1.5rem'
          }}>Status</TableHead>
          <TableHead style={{
            ...tableHeaderStyle,
            textAlign: 'center',
            paddingLeft: '1.5rem'
          }}>Action</TableHead>
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