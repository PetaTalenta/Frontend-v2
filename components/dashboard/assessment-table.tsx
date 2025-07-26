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

interface AssessmentTableProps {
  data: AssessmentData[]
}

export function AssessmentTable({ data }: AssessmentTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [assessmentData, setAssessmentData] = useState(data)

  // Update assessment data when prop changes
  useEffect(() => {
    setAssessmentData(data)
  }, [data])

  const totalPages = Math.ceil(assessmentData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = assessmentData.slice(startIndex, endIndex)

  const handleDelete = (id: number) => {
    // Filter out the item with the specified id
    const updatedData = assessmentData.filter(item => item.id !== id)
    setAssessmentData(updatedData)

    // If current page becomes empty after deletion, go to previous page
    const newTotalPages = Math.ceil(updatedData.length / itemsPerPage)
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages)
    }
  }

  const handleView = (id: number) => {
    // Find the assessment item to get the correct resultId
    const assessmentItem = assessmentData.find(item => item.id === id);
    const resultId = assessmentItem?.resultId || `result-${id}`;

    // Navigate to results page with the correct result ID
    router.push(`/results/${resultId}`)
  }

  return (
    <Card className="bg-white border-[#eaecf0] h-[800px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
        <div>
          <CardTitle className="text-lg font-semibold text-[#1e1e1e]">Assessment History</CardTitle>
          <p className="text-xs text-[#64707d] mt-1">
            Review your analytics results and use this information to improve future performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-[#eaecf0] text-[#64707d] text-xs"
            onClick={() => router.push("/username-test")}
          >
            Username Test
          </Button>
          <Button className="bg-[#6475e9] hover:bg-[#5a6bd8] text-white text-xs" onClick={() => router.push("/select-assessment") }>
            <Plus className="w-4 h-4 mr-2" />
            New Assessment
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-auto">
          <Table>
          <TableHeader>
            <TableRow className="border-[#eaecf0]">
              <TableHead className="text-[#64707d] font-medium">Nomor</TableHead>
              <TableHead className="text-[#64707d] font-medium">Nama</TableHead>
              <TableHead className="text-[#64707d] font-medium">Tipe Ujian</TableHead>
              <TableHead className="text-[#64707d] font-medium">Tanggal Ujian</TableHead>
              <TableHead className="text-[#64707d] font-medium">Status</TableHead>
              <TableHead className="text-[#64707d] font-medium">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((item, index) => (
              <TableRow key={item.id} className="border-[#eaecf0]">
                <TableCell className="text-[#1e1e1e]">{startIndex + index + 1}</TableCell>
                <TableCell className="text-[#1e1e1e]">{item.nama}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-[#f3f3f3] text-[#64707d]">
                    {item.tipe}
                  </Badge>
                </TableCell>
                <TableCell className="text-[#64707d]">{item.tanggal}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${
                      item.status === "Selesai"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }`}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(item.id)}>
                      <ExternalLink className="w-4 h-4 text-[#64707d]" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="w-4 h-4 text-[#64707d]" />
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
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Ya, Hapus
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
        <div className="flex items-center justify-between pt-4 border-t border-[#eaecf0] mt-4 flex-shrink-0">
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

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                className={`w-8 h-8 ${
                  currentPage === page ? "bg-[#6475e9] hover:bg-[#5a6bd8] text-white" : "text-[#64707d]"
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

