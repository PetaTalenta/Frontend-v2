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
import { getStatusBadgeVariant, getStatusText, isJobProcessing, formatDateTimeForTable } from "../../hooks/useJobs"

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
    <div className="bg-white flex flex-col rounded-lg border shadow-sm border-[#eaecf0] h-auto sm:h-auto md:h-auto lg:h-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-shrink-0 flex-nowrap gap-3 p-4 sm:p-6 md:p-5">
        <div className="flex flex-col gap-2">
          <div className="font-semibold text-[#1e1e1e] text-lg sm:text-lg md:text-lg lg:text-lg leading-7">Riwayat Asesmen</div>
          <p className="text-xs mt-1 text-[#64707d]">
            Tinjau hasil analisis Anda dan gunakan informasi ini untuk meningkatkan kinerja di masa mendatang.
          </p>
        </div>
        <div className="flex gap-2 ml-auto sm:ml-auto w-full sm:w-auto justify-end">
          <Button
            className="text-white text-sm h-10 px-4 bg-[#6475E9] hover:bg-[#5a6bd8] w-full sm:w-auto justify-center"
            onClick={() => router.push("/select-assessment")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Asesmen Baru
          </Button>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0 p-4 sm:p-6 md:p-4 lg:p-4">
        <div className="flex-1 overflow-x-auto overflow-y-visible -webkit-overflow-scrolling-touch scrollbar-thin">
          <Table className="min-w-[600px] sm:min-w-full md:min-w-full lg:min-w-full">
            <TableHeader>
              <TableRow className="border-[#eaecf0]">
                <TableHead className="font-medium text-[#64707d] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">No</TableHead>
                <TableHead className="font-medium text-[#64707d] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">Archetype</TableHead>
                <TableHead className="font-medium text-[#64707d] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm hidden sm:hidden md:hidden lg:table-cell">Waktu</TableHead>
                <TableHead className="font-medium text-[#64707d] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">Status</TableHead>
                <TableHead className="font-medium text-[#64707d] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, idx) => (
                  <TableRow key={`skeleton-${idx}`}>
                    <TableCell className="px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm"><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell className="px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm"><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm hidden sm:hidden md:hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm"><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">
                      <div className="flex gap-2 sm:gap-2 md:gap-2 lg:gap-2">
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
                        className="border-[#eaecf0]"
                        style={{
                          opacity: isPending ? 0.6 : 1,
                          transition: 'all 0.3s ease-in-out'
                        }}
                      >
                        <TableCell className="text-[#1e1e1e] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">{startIndex + index + 1}</TableCell>
                        <TableCell className="text-[#1e1e1e] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">
                          {item.archetype}
                          {isPending && (
                            <span className="ml-2 text-xs text-gray-500 italic">
                              (Syncing...)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-[#64707d] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm hidden sm:hidden md:hidden lg:table-cell">{formatDateTimeForTable(item.created_at)}</TableCell>
                        <TableCell className="px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">
                          <Badge
                            variant="secondary"
                            className={`bg-[#f3f3f3] text-[#64707d] ${getStatusBadgeVariant(item.status)}`}
                          >
                            {getStatusText(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">
                          <div className="flex gap-2 sm:gap-2 md:gap-2 lg:gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 sm:h-8 sm:w-8 md:h-8 md:w-8 lg:h-8 lg:w-8 hover:bg-[#6475E9] hover:text-white"
                              onClick={() => handleView(item.id)}
                              disabled={isJobProcessing(item.status)}
                              title={isJobProcessing(item.status) ? 'Sedang diproses' : 'Lihat hasil'}
                            >
                              <ExternalLink className="w-4 h-4 text-[#64707d] hover:text-white" />
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
                                  className="h-8 w-8 sm:h-8 sm:w-8 md:h-8 md:w-8 lg:h-8 lg:w-8 hover:bg-[#6475E9] hover:text-white"
                                  disabled={isJobProcessing(item.status) || isDeleting === (item.result_id || item.job_id)}
                                  title={isJobProcessing(item.status) ? 'Sedang diproses' : 'Hapus'}
                                >
                                  <Trash2 className="w-4 h-4 text-[#64707d] hover:text-white" />
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
                    <TableRow key={`empty-${idx}`} className="border-[#eaecf0] opacity-50">
                      <TableCell className="text-[#1e1e1e] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">&nbsp;</TableCell>
                      <TableCell className="text-[#1e1e1e] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">&nbsp;</TableCell>
                      <TableCell className="text-[#64707d] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm hidden sm:hidden md:hidden lg:table-cell">&nbsp;</TableCell>
                      <TableCell className="text-[#1e1e1e] px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">&nbsp;</TableCell>
                      <TableCell className="px-2 sm:px-4 md:px-2 lg:px-4 py-2 text-xs sm:text-sm md:text-sm lg:text-sm">
                        <div className="flex gap-2 sm:gap-2 md:gap-2 lg:gap-2" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between p-4 sm:p-4 md:p-3 lg:p-4 border-t border-[#e5e7eb] mt-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#64707d]">Show</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-[#64707d]">Data</span>
          </div>
          <div className="flex gap-1 bg-transparent">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                className={`w-8 h-8 rounded-md ${
                  currentPage === page
                    ? "text-white bg-[#6475E9] hover:bg-[#5a6bd8]"
                    : "text-[#64707d] bg-[#f3f3f3]"
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