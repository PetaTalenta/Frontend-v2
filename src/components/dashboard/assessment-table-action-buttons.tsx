"use client"

import React, { useCallback } from 'react'
import { Button } from './button'
import { SimpleAlertDialog } from './alert-dialog-simple'
import { ExternalLink, Trash2 } from 'lucide-react'
import type { AssessmentData } from '../../types/dashboard'
import { isJobProcessing } from '../../hooks/useJobs'

interface AssessmentActionButtonsProps {
  item: AssessmentData
  isDeleting: string | null
  onView: (id: number) => void
  onDelete: (id: number) => void
}

const AssessmentActionButtons = React.memo(({
  item,
  isDeleting,
  onView,
  onDelete
}: AssessmentActionButtonsProps) => {
  const handleView = useCallback(() => {
    onView(item.id)
  }, [item.id, onView])

  const handleDelete = useCallback(() => {
    onDelete(item.id)
  }, [item.id, onDelete])

  const deletingKey = item.result_id || item.job_id
  const isCurrentlyDeleting = isDeleting === deletingKey
  const isProcessing = isJobProcessing(item.status)

  const actionButtonStyle = {
    height: '2rem',
    width: '2rem'
  }

  const actionIconStyle = {
    width: '1rem',
    height: '1rem',
    color: '#64707d'
  }

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem'
    }}>
      <Button
        variant="ghost"
        size="icon"
        style={actionButtonStyle}
        className="hover:bg-[#6475E9] hover:text-white"
        onClick={handleView}
        disabled={isProcessing}
        title={isProcessing ? 'Sedang diproses' : 'Lihat hasil'}
      >
        <ExternalLink
          style={actionIconStyle}
          className="hover:text-white"
        />
      </Button>

      <SimpleAlertDialog
        title="Konfirmasi Hapus"
        description={`Apakah Anda yakin ingin menghapus assessment "${item.archetype}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        confirmText={isCurrentlyDeleting ? 'Menghapus...' : 'Ya, Hapus'}
        cancelText="Batal"
        trigger={
          <Button
            variant="ghost"
            size="icon"
            style={actionButtonStyle}
            className="hover:bg-[#6475E9] hover:text-white"
            disabled={isProcessing || isCurrentlyDeleting}
            title={isProcessing ? 'Sedang diproses' : 'Hapus'}
          >
            <Trash2
              style={actionIconStyle}
              className="hover:text-white"
            />
          </Button>
        }
      />
    </div>
  )
})

AssessmentActionButtons.displayName = 'AssessmentActionButtons'

export { AssessmentActionButtons }