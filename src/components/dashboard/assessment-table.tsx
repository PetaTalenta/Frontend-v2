"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
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
}

export function AssessmentTable({ data, onRefresh }: AssessmentTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [assessmentData, setAssessmentData] = useState(data)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Update assessment data when prop changes
  useEffect(() => {
    setAssessmentData(data)
  }, [data])

  const totalPages = Math.ceil(assessmentData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = assessmentData.slice(startIndex, endIndex)

  const handleDelete = async (id: number) => {
    // Find the assessment item to get the resultId
    const assessmentItem = assessmentData.find(item => item.id === id);
    if (!assessmentItem?.resultId) {
      console.error('No resultId found for assessment item:', id);
      return;
    }

    setIsDeleting(assessmentItem.resultId);

    try {
      // Import API service dynamically
      const { apiService } = await import('../../services/apiService');

      // Call the API to delete the result
      await apiService.deleteResult(assessmentItem.resultId);

      console.log('Assessment deleted successfully:', assessmentItem.resultId);

  // Always refresh the page after deletion to update the assessment history
  window.location.reload();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      // You might want to show a toast notification here
      alert('Gagal menghapus assessment. Silakan coba lagi.');
    } finally {
      setIsDeleting(null);
    }
  }

  const handleView = async (id: number) => {
    try {
      // Find the assessment item to get the correct resultId
      const assessmentItem = assessmentData.find(item => item.id === id);

      if (!assessmentItem) {
        console.error('Assessment item not found for ID:', id);
        alert('Assessment tidak ditemukan. Silakan refresh halaman dan coba lagi.');
        return;
      }

      // Use the resultId from the assessment item, or generate a legacy format as fallback
      const resultId = assessmentItem.resultId || `result-${id}`;

      console.log('Navigating to result:', resultId);
      console.log('Assessment item:', assessmentItem);

      // Navigate to comprehensive results page with error handling
      await router.push(`/results/${resultId}`);

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
                <TableHead className="assessment-table__table-head">Nama</TableHead>
                <TableHead className="assessment-table__table-head text-center dashboard-hide-mobile">Tipe Ujian</TableHead>
                <TableHead className="assessment-table__table-head dashboard-hide-mobile">Tanggal Ujian</TableHead>
                <TableHead className="assessment-table__table-head">Status</TableHead>
                <TableHead className="assessment-table__table-head">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((item, index) => (
                <TableRow key={item.id} className="assessment-table__table-row">
                  <TableCell className="assessment-table__table-cell">{startIndex + index + 1}</TableCell>
                  <TableCell className="assessment-table__table-cell">{item.nama}</TableCell>
                  <TableCell className="text-center dashboard-hide-mobile">
                    <Badge variant="secondary" className="assessment-table__badge" style={{ display: 'inline-block', minWidth: 100 }}>
                      {item.tipe}
                    </Badge>
                  </TableCell>
                  <TableCell className="assessment-table__table-cell--secondary dashboard-hide-mobile">{item.tanggal}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`assessment-table__badge ${
                        item.status === "Selesai"
                          ? "assessment-table__badge--success"
                          : item.status === "Proses"
                            ? "assessment-table__badge--processing"
                            : item.status === "Gagal"
                              ? "assessment-table__badge--danger"
                              : item.status === "Batal"
                                ? "assessment-table__badge--cancelled"
                                : "assessment-table__badge--warning"
                      }`}
                    >
                      {item.status === "Selesai"
                        ? "Selesai"
                        : item.status === "Proses"
                          ? "Sedang Diproses"
                          : item.status === "Gagal"
                            ? "Gagal"
                            : item.status === "Batal"
                              ? "Dibatalkan"
                              : "Belum Selesai"}
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
                            disabled={isDeleting === item.resultId}
                          >
                            <Trash2 className="assessment-table__action-icon" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus assessment "{item.nama}"?
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting === item.resultId}>
                              Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={isDeleting === item.resultId}
                            >
                              {isDeleting === item.resultId ? 'Menghapus...' : 'Ya, Hapus'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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

