"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { Skeleton } from "../ui/skeleton"
import { useSWRConfig } from "swr"
import { toast as showToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import { ExternalLink, Trash2, Plus } from "lucide-react"
import type { AssessmentData } from "../../types/dashboard"
import "../../styles/components/dashboard/assessment-table.css"

interface AssessmentTableProps {
  data: AssessmentData[]
  onRefresh?: () => Promise<void>
  swrKey?: string
  isLoading?: boolean
}

export function AssessmentTable({ data, onRefresh, swrKey, isLoading }: AssessmentTableProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Gunakan langsung data dari props
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  const handleDelete = async (id: number) => {
    // Find the assessment item to get the result_id
    const assessmentItem = data.find(item => item.id === id);
    if (!assessmentItem?.result_id) {
      console.error('No result_id found for assessment item:', id);
      return;
    }

    const resultId = assessmentItem.result_id;
    setIsDeleting(resultId);

    // Toast: Menghapus...
    const t = showToast({ title: 'Menghapus…' });

    // Optimistic update: remove row immediately from SWR cache
    let previousData: AssessmentData[] | undefined;
    try {
      if (swrKey) {
        await mutate(
          swrKey,
          (current: any) => {
            previousData = current as AssessmentData[];
            const next = (current || []).filter((row: AssessmentData) => row.result_id !== resultId);
            return next;
          },
          false
        );
      }

      // Import API service dynamically
      const { apiService } = await import('../../services/apiService');

      // Call the API to delete the result
      await apiService.deleteResult(resultId);

      // Invalidate to keep sync with server (no page refresh)
      if (swrKey) {
        await mutate(swrKey);
      } else if (onRefresh) {
        await onRefresh();
      }

      // Dismiss toast after success
      t.dismiss();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      // Revert optimistic update if failed
      if (swrKey && previousData) {
        await mutate(swrKey, previousData, false);
      }
      // Update toast to show failure
      try { t.update({ title: 'Gagal menghapus' } as any); } catch (_) {}
    } finally {
      setIsDeleting(null);
    }
  }

  const handleView = async (id: number) => {
    try {
      // Find the assessment item to get the correct resultId
      const assessmentItem = data.find(item => item.id === id);

      if (!assessmentItem) {
        console.error('Assessment item not found for ID:', id);
        alert('Assessment tidak ditemukan. Silakan refresh halaman dan coba lagi.');
        return;
      }

      // Use the resultId from the assessment item, or generate a legacy format as fallback
      const resultId = assessmentItem.result_id || `result-${id}`;

      console.log('Navigating to result:', resultId);
      console.log('Assessment item:', assessmentItem);

      // Navigate to comprehensive results page
      router.push(`/results/${resultId}`);

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
                currentData.map((item, index) => (
                  <TableRow key={item.id} className="assessment-table__table-row">
                    <TableCell className="assessment-table__table-cell">{startIndex + index + 1}</TableCell>
                    <TableCell className="assessment-table__table-cell">{item.archetype}</TableCell>

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
                        <Button variant="ghost" size="icon" className="assessment-table__action-button" onClick={() => handleView(item.id)}>
                          <ExternalLink className="assessment-table__action-icon" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="assessment-table__action-button"
                              disabled={isDeleting === item.result_id}
                            >
                              <Trash2 className="assessment-table__action-icon" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus assessment "{item.archetype}"?
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isDeleting === item.result_id}>
                                Batal
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isDeleting === item.result_id}
                              >
                                {isDeleting === item.result_id ? 'Menghapus...' : 'Ya, Hapus'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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

