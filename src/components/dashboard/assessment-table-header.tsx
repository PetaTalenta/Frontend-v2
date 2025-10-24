"use client"

import React from 'react'
import { Button } from './button'
import { Plus } from 'lucide-react'
import { tableStyles, getResponsiveStyles } from './assessment-table-styles'

interface AssessmentTableHeaderProps {
  windowWidth: number
  onNewAssessment: () => void
}

const AssessmentTableHeader = React.memo(({ 
  windowWidth, 
  onNewAssessment 
}: AssessmentTableHeaderProps) => {
  const responsiveStyles = getResponsiveStyles(windowWidth)

  return (
    <div style={responsiveStyles.header}>
      <div style={tableStyles.headerContent}>
        <div style={tableStyles.title}>Riwayat Asesmen</div>
        <p style={tableStyles.description}>
          Tinjau hasil analisis Anda dan gunakan informasi ini untuk meningkatkan kinerja di masa mendatang.
        </p>
      </div>
      <div style={responsiveStyles.headerActions}>
        <Button
          style={responsiveStyles.newAssessmentButton}
          className="hover:bg-[#5a6bd8]"
          onClick={onNewAssessment}
        >
          <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
          Asesmen Baru
        </Button>
      </div>
    </div>
  )
})

AssessmentTableHeader.displayName = 'AssessmentTableHeader'

export { AssessmentTableHeader }