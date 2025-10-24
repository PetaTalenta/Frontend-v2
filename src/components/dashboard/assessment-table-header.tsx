"use client"

import React from 'react'
import { Button } from './button'
import { Plus } from 'lucide-react'

interface AssessmentTableHeaderProps {
  onNewAssessment: () => void
}

const AssessmentTableHeader = React.memo(({
  onNewAssessment
}: AssessmentTableHeaderProps) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      flexWrap: 'nowrap',
      gap: '0.75rem',
      padding: '1.25rem'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{
          fontWeight: 600,
          color: '#1e1e1e',
          fontSize: '1.125rem',
          lineHeight: '1.75rem'
        }}>Riwayat Asesmen</div>
        <p style={{
          fontSize: '0.75rem',
          marginTop: '0.25rem',
          color: '#64707d'
        }}>
          Tinjau hasil analisis Anda dan gunakan informasi ini untuk meningkatkan kinerja di masa mendatang.
        </p>
      </div>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginLeft: 'auto',
        width: 'auto',
        justifyContent: 'flex-end'
      }}>
        <Button
          style={{
            color: 'white',
            fontSize: '0.875rem',
            height: '2.5rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            backgroundColor: '#6475E9',
            width: 'auto',
            justifyContent: 'center'
          }}
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