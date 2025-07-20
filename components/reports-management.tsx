"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Filter, CalendarDays } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Papa from "papaparse"

import type { User, Item, Supplier, Transaction, Depreciation } from "@/app/page" // Import types

export function ReportsManagement({
  user,
  items,
  suppliers,
  transactions,
  depreciations,
  users,
}: {
  user: User
  items: Item[]
  suppliers: Supplier[]
  transactions: Transaction[]
  depreciations: Depreciation[]
  users: User[]
}) {
  const [reportType, setReportType] = useState("items")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const { toast } = useToast()

  // -----------------------------------------------------------------
  // Ensure we always work with arrays – avoids undefined .find/.map
  // -----------------------------------------------------------------
  const safeItems = items ?? []
  const safeSuppliers = suppliers ?? []
  const safeTransactions = transactions ?? []
  const safeDepreciations = depreciations ?? []
  const safeUsers = users ?? []

  const filterDataByDate = (rows: any[], dateField: string) => {
    return (rows ?? []).filter((row) => {
      const rowDate = new Date(row[dateField])
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null

      if (start && rowDate < start) return false
      if (end && rowDate > end) return false
      return true
    })
  }

  const generateReportData = () => {
    let data: any[] = []
    let headers: string[] = []
    let filename = "report.csv"

    switch (reportType) {
      case "items":
        data = filterDataByDate(safeItems, "createdAt")
        headers = [
          "id",
          "code",
          "name",
          "category",
          "currentStock",
          "minStock",
          "location",
          "price",
          "status",
          "createdAt",
        ]
        filename = "laporan_barang.csv"
        break
      case "transactions":
        data = filterDataByDate(safeTransactions, "date").map((t) => {
          const item = safeItems.find((i) => i.id === t.itemId)
          const user = safeUsers.find((u) => u.id === t.userId)
          const supplier = safeSuppliers.find((s) => s.id === t.supplierId)
          return {
            ...t,
            itemName: item?.name,
            itemCode: item?.code,
            userName: user?.name,
            supplierName: supplier?.name,
          }
        })
        headers = [
          "id",
          "type",
          "itemName",
          "itemCode",
          "quantity",
          "userName",
          "supplierName",
          "borrowerId",
          "notes",
          "status",
          "date",
          "dueDate",
          "returnDate",
        ]
        filename = "laporan_transaksi.csv"
        break
      case "depreciations":
        data = filterDataByDate(safeDepreciations, "date").map((d) => {
          const item = safeItems.find((i) => i.id === d.itemId)
          const user = safeUsers.find((u) => u.id === d.userId)
          return {
            ...d,
            itemName: item?.name,
            itemCode: item?.code,
            userName: user?.name,
          }
        })
        headers = ["id", "itemName", "itemCode", "quantity", "date", "reason", "userName", "status"]
        filename = "laporan_penyusutan.csv"
        break
      case "suppliers":
        data = filterDataByDate(safeSuppliers, "createdAt")
        headers = ["id", "code", "name", "contact", "phone", "email", "address", "status", "createdAt"]
        filename = "laporan_supplier.csv"
        break
      case "users":
        data = filterDataByDate(safeUsers, "lastLogin") // Assuming lastLogin as a relevant date field for users
        headers = ["id", "username", "name", "email", "role", "status", "lastLogin"]
        filename = "laporan_pengguna.csv"
        break
      default:
        break
    }
    return { data, headers, filename }
  }

  const handleExport = () => {
    const { data, headers, filename } = generateReportData()
    if (data.length === 0) {
      toast({
        title: "Export Gagal",
        description: "Tidak ada data untuk diekspor dengan filter yang dipilih.",
        variant: "destructive",
      })
      return
    }
    // Helper function to download CSV (from app/page.tsx)
    const downloadCsvLocal = (data: any[], filename: string, headers: string[]) => {
      try {
        const csv = Papa.unparse(data, {
          header: true,
          columns: headers,
        })
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob)
          link.setAttribute("href", url)
          link.setAttribute("download", filename)
          link.style.visibility = "hidden"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          toast({
            title: "Export Berhasil",
            description: `Data berhasil diekspor ke ${filename}`,
          })
        }
      } catch (error: any) {
        toast({
          title: "Export Gagal",
          description: `Terjadi kesalahan saat mengekspor: ${error.message}`,
          variant: "destructive",
        })
      }
    }
    downloadCsvLocal(data, filename, headers)
  }

  const { data: previewData, headers: previewHeaders } = generateReportData()

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Laporan</h2>
          <p className="text-sm sm:text-base text-gray-600">Buat dan ekspor laporan inventaris</p>
        </div>
        <Button onClick={handleExport} size="sm" className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export Laporan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Laporan</CardTitle>
          <CardDescription>Pilih jenis laporan dan rentang tanggal</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">Jenis Laporan</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Pilih jenis laporan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="items">Data Barang</SelectItem>
                <SelectItem value="transactions">Transaksi (Masuk/Keluar/Peminjaman)</SelectItem>
                <SelectItem value="depreciations">Penyusutan Barang</SelectItem>
                <SelectItem value="suppliers">Data Supplier</SelectItem>
                <SelectItem value="users">Data Pengguna</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Tanggal Mulai</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Tanggal Akhir</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pratinjau Laporan</CardTitle>
          <CardDescription>Pratinjau 10 data pertama dari laporan yang dipilih</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {previewData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewHeaders.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {previewHeaders.map((header, colIndex) => (
                        <TableCell key={colIndex} className="text-sm">
                          {String(row[header])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-600 py-8">Tidak ada data untuk pratinjau laporan ini.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
