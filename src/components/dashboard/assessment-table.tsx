"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Badge } from "./badge"
import { Skeleton } from "./skeleton"
import { SimpleAlertDialog } from "./alert-dialog-simple"
import { ExternalLink, Trash2, Plus } from "lucide-react"
import type { AssessmentData } from "../../types/dashboard"
import "../../styles/components/dashboard/assessment-table.css"

interface AssessmentTableProps {
  data: AssessmentData[]
  onRefresh?: () => Promise<void>
  swrKey?: string
  isLoading?: boolean
  isValidating?: boolean
}

function AssessmentTableComponent({ data, onRefresh, swrKey, isLoading, isValidating }: AssessmentTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Gunakan langsung data dari props
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  const handleDelete = async (id: number) => {
    // Find the assessment item to get identifiers
    const assessmentItem = data.find(item => item.id === id);
    const resultId = assessmentItem?.result_id || null;
    const jobId = assessmentItem?.job_id || null;

    if (!resultId && !jobId) {
      console.error('No result_id or job_id found for assessment item:', id);
      alert('ID hasil atau job tidak ditemukan.');
      return;
    }

    const deletingKey = (resultId || jobId)!;
    setIsDeleting(deletingKey);

    // Simulasi delete operation
    setTimeout(() => {
      setIsDeleting(null);
      alert('Assessment berhasil dihapus (dummy)');
    }, 1000);
  }

  const handleView = async (id: number) => {
    try {
      // Find the assessment item to get the correct identifiers
      const assessmentItem = data.find(item => item.id === id);

      if (!assessmentItem) {
        console.error('Assessment item not found for ID:', id);
        alert('Assessment tidak ditemukan. Silakan refresh halaman dan coba lagi.');
        return;
      }

      // Use the resultId from the assessment item, or generate a legacy format as fallback
      const resultId = assessmentItem.result_id || `result-${id}`;
      const jobId = assessmentItem.job_id;

      console.log('Navigating to result:', resultId);
      console.log('Assessment item:', assessmentItem);

      // Navigate to comprehensive results page, include jobId when available
      const url = jobId ? `/results/${resultId}?jobId=${encodeURIComponent(jobId)}` : `/results/${resultId}`;
      router.push(url);

    } catch (error) {
      console.error('Error navigating to results:', error);
      alert('Gagal membuka halaman hasil. Silakan coba lagi.');
    }
  }

  return (
    <div className="assessment-table">
      <div className="assessment-table__header sm:flex-row sm:items-center sm:justify-between space-y-0">
        <div className="assessment-table__header-text">
          <div className="assessment-table__title" style={{fontWeight:'bold', fontSize:'1.5rem'}}>Riwayat Asesmen</div>
          <p className="assessment-table__description">
            Tinjau hasil analisis Anda dan gunakan informasi ini untuk meningkatkan kinerja di masa mendatang.
          </p>
        </div>
        <div className="assessment-table__header-actions">
          <Button className="assessment-table__new-button" onClick={() => router.push("/select-assessment") }>
            <Plus className="assessment-table__new-button-icon" />
            Asesmen Baru
          </Button>
        </div>
      </div>
      <div className="assessment-table__content">
        <div className="assessment-table__table-container responsive-table-wrapper">
          <Table>
            <TableHeader>
              <TableRow className="assessment-table__table-row">
                <TableHead className="assessment-table__table-head">No</TableHead>
                <TableHead className="assessment-table__table-head">Archetype</TableHead>

                <TableHead className="assessment-table__table-head dashboard-hide-mobile">Tanggal Ujian</TableHead>
                <TableHead className="assessment-table__table-head">Status</TableHead>
                <TableHead className="assessment-table__table-head">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="dashboard-hide-mobile"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell>
                      <div className="assessment-table__action-buttons">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  {currentData.map((item, index) => {
                    const isPending = (item as any)._isPending;

                    return (
                      <TableRow
                        key={item.id}
                        className="assessment-table__table-row"
                        style={{
                          opacity: isPending ? 0.6 : 1,
                          transition: 'all 0.3s ease-in-out'
                        }}
                      >
                        <TableCell className="assessment-table__table-cell">{startIndex + index + 1}</TableCell>
                        <TableCell className="assessment-table__table-cell">
                          {item.archetype}
                          {isPending && (
                            <span className="ml-2 text-xs text-gray-500 italic">
                              (Syncing...)
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="assessment-table__table-cell--secondary dashboard-hide-mobile">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`assessment-table__badge ${(() => {
                            const s = String(item.status).toLowerCase();
                            if (s === 'completed') return 'assessment-table__badge--success';
                            if (s === 'processing' || s === 'queued' || s === 'pending' || s === 'in_progress') return 'assessment-table__badge--processing';
                            if (s === 'failed' || s === 'error') return 'assessment-table__badge--danger';
                            if (s === 'cancelled' || s === 'canceled') return 'assessment-table__badge--cancelled';
                            return 'assessment-table__badge--warning';
                          })()}`}
                        >
                          {(() => {
                            const s = String(item.status).toLowerCase();
                            if (s === 'completed') return 'Selesai';
                            if (s === 'processing' || s === 'queued' || s === 'pending' || s === 'in_progress') return 'Sedang Diproses';
                            if (s === 'failed' || s === 'error') return 'Gagal';
                            if (s === 'cancelled' || s === 'canceled') return 'Dibatalkan';
                            return 'Belum Selesai';
                          })()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="assessment-table__action-buttons">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="assessment-table__action-button"
                            onClick={() => handleView(item.id)}
                            disabled={(() => {
                              const s = String(item.status).toLowerCase();
                              return s === 'processing' || s === 'queued' || s === 'pending' || s === 'in_progress';
                            })()}
                            title={(() => {
                              const s = String(item.status).toLowerCase();
                              return (s === 'processing' || s === 'queued' || s === 'pending' || s === 'in_progress') ? 'Sedang diproses' : 'Lihat hasil';
                            })()}
                          >
                            <ExternalLink className="assessment-table__action-icon" />
                          </Button>

                          <SimpleAlertDialog
                            title="Konfirmasi Hapus"
                            description={`Apakah Anda yakin ingin menghapus assessment "${item.archetype}"? Tindakan ini tidak dapat dibatalkan.`}
                            onConfirm={() => handleDelete(item.id)}
                            confirmText={isDeleting === (item.result_id || item.job_id) ? 'Menghapus...' : 'Ya, Hapus'}
                            cancelText="Batal"
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="assessment-table__action-button"
                                disabled={(() => {
                                  const s = String(item.status).toLowerCase();
                                  const isProcessing = s === 'processing' || s === 'queued' || s === 'pending' || s === 'in_progress';
                                  return isProcessing || isDeleting === (item.result_id || item.job_id);
                                })()}
                                title={(() => {
                                  const s = String(item.status).toLowerCase();
                                  const isProcessing = s === 'processing' || s === 'queued' || s === 'pending' || s === 'in_progress';
                                  return isProcessing ? 'Sedang diproses' : 'Hapus';
                                })()}
                              >
                                <Trash2 className="assessment-table__action-icon" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}

                  {/* Filler rows to keep table height consistent up to itemsPerPage */}
                  {currentData.length < itemsPerPage && Array.from({ length: itemsPerPage - currentData.length }).map((_, idx) => (
                    <TableRow key={`empty-${idx}`} className="assessment-table__table-row opacity-50">
                      <TableCell className="assessment-table__table-cell">&nbsp;</TableCell>
                      <TableCell className="assessment-table__table-cell">&nbsp;</TableCell>
                      <TableCell className="assessment-table__table-cell--secondary dashboard-hide-mobile">&nbsp;</TableCell>
                      <TableCell className="assessment-table__table-cell">&nbsp;</TableCell>
                      <TableCell>
                        <div className="assessment-table__action-buttons" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        <div className="assessment-table__pagination">
          <div className="assessment-table__pagination-left">
            <span className="assessment-table__pagination-text">Show</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="assessment-table__pagination-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="assessment-table__pagination-text">Data</span>
          </div>
          <div className="assessment-table__pagination-right">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                className={`assessment-table__pagination-button ${
                  currentPage === page ? "assessment-table__pagination-button--active" : "assessment-table__pagination-button--inactive"
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const AssessmentTable = React.memo(AssessmentTableComponent)