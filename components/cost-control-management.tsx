"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Edit, Download, Upload, TrendingUp, Calculator, RefreshCw } from "lucide-react"
import type { User, LogEntry } from "@/app/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"
import { Badge } from "@/components/ui/badge"

interface CostItemDefinition {
  id: number
  name: string
  price: number
}

interface CostControlData {
  itemId: number
  itemName: string
  dates: string[]
  totalPickedUpQuantity: number
  price: number
  totalCost: number
  pendingQuantity: number
  returnedQuantity: number
}

const initialItemDefinitions: CostItemDefinition[] = [
  { id: 1, name: "Bath Towel Baru", price: 2600 },
  { id: 2, name: "Bath Towel Lama", price: 2600 },
  { id: 3, name: "Bath Mat", price: 2400 },
  { id: 4, name: "Bed Sheet Single", price: 3300 },
  { id: 5, name: "Bed Sheet Double", price: 3600 },
  { id: 6, name: "Duvet Cover Single", price: 4600 },
  { id: 7, name: "Duvet Cover Double", price: 5600 },
  { id: 8, name: "Pillow Case Baru", price: 1400 },
  { id: 9, name: "Pillow Case Lama", price: 1400 },
  { id: 10, name: "Pillow Case (MIX)", price: 1400 },
  { id: 11, name: "Inner Duvet Single", price: 15000 },
  { id: 12, name: "Inner Duvet Double", price: 25000 },
  { id: 13, name: "Skarting Duvet Single", price: 0 },
  { id: 14, name: "Skarting Duvet Double", price: 0 },
  { id: 15, name: "Napkin", price: 1200 },
  { id: 16, name: "Cover Chair", price: 2500 },
  { id: 17, name: "Table Cloth", price: 6000 },
  { id: 18, name: "Bath Robe", price: 0 },
]

export function CostControlManagement({ user, logBookEntries }: { user: User; logBookEntries: LogEntry[] }) {
  const [itemDefinitions, setItemDefinitions] = useState<CostItemDefinition[]>(initialItemDefinitions)
  const [editingItem, setEditingItem] = useState<CostItemDefinition | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [costControlData, setCostControlData] = useState<CostControlData[]>([])
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentMonth = format(new Date(), "MM")
  const currentYear = format(new Date(), "yyyy")

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth)
  const [selectedYear, setSelectedYear] = useState<string>(currentYear)

  const months = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  useEffect(() => {
    const filteredLogEntries = logBookEntries.filter((entry) => {
      const entryDate = new Date(entry.date)
      const entryMonth = format(entryDate, "MM")
      const entryYear = format(entryDate, "yyyy")

      return entryMonth === selectedMonth && entryYear === selectedYear
    })

    const aggregatedData: {
      [itemId: number]: {
        dates: Set<string>
        totalOutQuantity: number
        totalPendingQuantity: number
        totalReturnedQuantity: number
      }
    } = {}

    filteredLogEntries.forEach((entry) => {
      if (entry.outQuantity > 0) {
        if (!aggregatedData[entry.itemId]) {
          aggregatedData[entry.itemId] = {
            dates: new Set(),
            totalOutQuantity: 0,
            totalPendingQuantity: 0,
            totalReturnedQuantity: 0,
          }
        }
        aggregatedData[entry.itemId].dates.add(entry.date)
        aggregatedData[entry.itemId].totalOutQuantity += entry.outQuantity
        aggregatedData[entry.itemId].totalPendingQuantity += entry.pendingQuantity
        aggregatedData[entry.itemId].totalReturnedQuantity += entry.returnedQuantity
      }
    })

    const newCostControlData: CostControlData[] = []
    itemDefinitions.forEach((itemDef) => {
      const aggregated = aggregatedData[itemDef.id]
      if (aggregated) {
        newCostControlData.push({
          itemId: itemDef.id,
          itemName: itemDef.name,
          dates: Array.from(aggregated.dates).sort(),
          totalPickedUpQuantity: aggregated.totalOutQuantity,
          price: itemDef.price,
          totalCost: aggregated.totalOutQuantity * itemDef.price,
          pendingQuantity: aggregated.totalPendingQuantity,
          returnedQuantity: aggregated.totalReturnedQuantity,
        })
      } else {
        newCostControlData.push({
          itemId: itemDef.id,
          itemName: itemDef.name,
          dates: [],
          totalPickedUpQuantity: 0,
          price: itemDef.price,
          totalCost: 0,
          pendingQuantity: 0,
          returnedQuantity: 0,
        })
      }
    })

    setCostControlData(newCostControlData.sort((a, b) => a.itemName.localeCompare(b.itemName)))
    setLastUpdateTime(new Date().toLocaleString("id-ID"))
  }, [logBookEntries, itemDefinitions, selectedMonth, selectedYear])

  if (user.role !== "admin" && user.role !== "manager") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  const handleEditItem = (item: CostItemDefinition) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingItem) return

    const formData = new FormData(e.currentTarget)
    const newPrice = Number.parseFloat(formData.get("price") as string) || 0

    setItemDefinitions((prevDefs) =>
      prevDefs.map((def) => (def.id === editingItem.id ? { ...def, price: newPrice } : def)),
    )

    setIsEditDialogOpen(false)
    setEditingItem(null)
    toast({
      title: "Harga Diperbarui",
      description: "Harga item berhasil diperbarui dan akan mempengaruhi perhitungan biaya secara real-time.",
    })
  }

  const totalAllCosts = costControlData.reduce((sum, data) => sum + data.totalCost, 0)
  const totalPickUpItems = costControlData.reduce((sum, data) => sum + data.totalPickedUpQuantity, 0)
  const totalPendingItems = costControlData.reduce(
    (sum, data) => sum + (data.pendingQuantity - data.returnedQuantity),
    0,
  )

  const generateCsvData = () => {
    const headers = ["No", "ITEM", "DATE", "QTY PICK UP", "PENDING", "RETURNED", "PRICE (Rp)", "TOTAL COST (Rp)"]
    const csvRows = []

    csvRows.push(headers.join(","))

    costControlData.forEach((data, index) => {
      const row = [
        index + 1,
        `"${data.itemName}"`,
        `"${data.dates.join(", ")}"`,
        data.totalPickedUpQuantity > 0 ? data.totalPickedUpQuantity : "-",
        data.pendingQuantity - data.returnedQuantity,
        data.returnedQuantity,
        data.price.toLocaleString("id-ID"),
        data.totalCost.toLocaleString("id-ID"),
      ]
      csvRows.push(row.join(","))
    })
    return csvRows.join("\n")
  }

  const generateXlsxData = () => {
    const dataForXlsx = costControlData.map((data, index) => ({
      No: index + 1,
      ITEM: data.itemName,
      DATE: data.dates.join(", "),
      "QTY PICK UP": data.totalPickedUpQuantity > 0 ? data.totalPickedUpQuantity : "-",
      PENDING: data.pendingQuantity - data.returnedQuantity,
      RETURNED: data.returnedQuantity,
      "PRICE (Rp)": data.price,
      "TOTAL COST (Rp)": data.totalCost,
    }))

    const ws = XLSX.utils.json_to_sheet(dataForXlsx)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Cost Control Report")
    return XLSX.write(wb, { bookType: "xlsx", type: "array" })
  }

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = ""
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  const handleExport = async (formatType: "csv" | "xlsx", sendEmail = false) => {
    const filename = `cost_control_report_${selectedMonth}-${selectedYear}.${formatType}`
    let fileData: string | ArrayBuffer
    let fileType: string
    let base64Content: string | undefined

    if (formatType === "csv") {
      fileData = generateCsvData()
      fileType = "text/csv;charset=utf-8;"
      base64Content = btoa(fileData as string)
    } else {
      fileData = generateXlsxData()
      fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      base64Content = arrayBufferToBase64(fileData as ArrayBuffer)
    }

    if (sendEmail) {
      toast({
        title: "Mengirim Email...",
        description: "Harap tunggu, laporan sedang dikirim.",
        variant: "default",
      })
      try {
        const response = await fetch("/api/send-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientEmail: user.email,
            subject: `Laporan Biaya CM Coin Laundry - ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`,
            body: `<p>Terlampir adalah laporan biaya CM Coin Laundry untuk periode ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}.</p>`,
            attachment: {
              filename: filename,
              content: base64Content,
              fileType: fileType,
            },
          }),
        })

        const result = await response.json()

        if (response.ok) {
          toast({
            title: "Ekspor ke Email Berhasil",
            description: result.message,
            variant: "default",
          })
        } else {
          throw new Error(result.message || "Terjadi kesalahan saat mengirim email.")
        }
      } catch (error: any) {
        toast({
          title: "Ekspor ke Email Gagal",
          description: `Gagal mengirim email: ${error.message}. Pastikan konfigurasi server email sudah benar.`,
          variant: "destructive",
        })
        console.error("Error sending email via API:", error)
      }
    } else {
      downloadFile(fileData, filename, fileType)
      toast({
        title: "Ekspor Berhasil",
        description: `File ${filename} berhasil diunduh.`,
        variant: "default",
      })
    }
  }

  const downloadFile = (data: string | ArrayBuffer, filename: string, type: string) => {
    const blob = new Blob([data], { type: type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      toast({
        title: "Impor Gagal",
        description: "Tidak ada file yang dipilih.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        let importedItems: { ITEM: string; "PRICE (Rp)": number }[] = []

        if (file.name.endsWith(".csv")) {
          const csvText = data as string
          const lines = csvText.split("\n").filter((line) => line.trim() !== "")
          if (lines.length < 2) {
            throw new Error("File CSV kosong atau tidak valid.")
          }
          const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
          const itemIndex = headers.indexOf("ITEM")
          const priceIndex = headers.indexOf("PRICE (Rp)")

          if (itemIndex === -1 || priceIndex === -1) {
            throw new Error("File CSV harus memiliki kolom 'ITEM' dan 'PRICE (Rp)'.")
          }

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
            if (values.length > Math.max(itemIndex, priceIndex)) {
              importedItems.push({
                ITEM: values[itemIndex],
                "PRICE (Rp)": Number.parseFloat(values[priceIndex].replace(/[^0-9.-]+/g, "")) || 0,
              })
            }
          }
        } else if (file.name.endsWith(".xlsx")) {
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
          if (json.length < 2) {
            throw new Error("File XLSX kosong atau tidak valid.")
          }
          const headers = json[0].map((h) => h.trim())
          const itemColIndex = headers.indexOf("ITEM")
          const priceColIndex = headers.indexOf("PRICE (Rp)")

          if (itemColIndex === -1 || priceColIndex === -1) {
            throw new Error("File XLSX harus memiliki kolom 'ITEM' dan 'PRICE (Rp)'.")
          }

          importedItems = json
            .slice(1)
            .map((row) => ({
              ITEM: row[itemColIndex],
              "PRICE (Rp)": Number.parseFloat(String(row[priceColIndex]).replace(/[^0-9.-]+/g, "")) || 0,
            }))
            .filter((row) => typeof row.ITEM === "string" && !isNaN(row["PRICE (Rp)"]))
        } else {
          throw new Error("Format file tidak didukung. Harap unggah file .csv atau .xlsx.")
        }

        if (importedItems.length === 0) {
          throw new Error("Tidak ada data item yang valid ditemukan dalam file.")
        }

        const updatedItemDefs = itemDefinitions.map((existingItem) => {
          const importedMatch = importedItems.find((importedItem) => importedItem["ITEM"] === existingItem.name)
          if (importedMatch) {
            return { ...existingItem, price: importedMatch["PRICE (Rp)"] }
          }
          return existingItem
        })

        setItemDefinitions(updatedItemDefs)
        toast({
          title: "Impor Berhasil",
          description: `${importedItems.length} harga item berhasil diperbarui.`,
          variant: "default",
        })
      } catch (error: any) {
        toast({
          title: "Impor Gagal",
          description: `Terjadi kesalahan saat mengimpor file: ${error.message}`,
          variant: "destructive",
        })
        console.error("Error importing file:", error)
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }

    if (file.name.endsWith(".csv")) {
      reader.readAsText(file)
    } else if (file.name.endsWith(".xlsx")) {
      reader.readAsArrayBuffer(file)
    } else {
      toast({
        title: "Impor Gagal",
        description: "Format file tidak didukung. Harap unggah file .csv atau .xlsx.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Integration Info */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold">Cost Control CM Coin Laundry</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Analisis biaya operasional berdasarkan data real-time dari Loog Book
        </p>
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calculator className="h-5 w-5 text-green-400 mr-2" />
              <div>
                <p className="text-sm text-green-800 font-medium">Real-time Calculation</p>
                <p className="text-xs text-green-600">
                  Data otomatis terupdate dari Loog Book | Terakhir update: {lastUpdateTime}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              <RefreshCw className="w-3 h-3 mr-1" />
              Live Data
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter, Import, and Export Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-4">
          <div className="grid gap-2">
            <Label htmlFor="month-filter">Bulan</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-filter" className="w-[180px]">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="year-filter">Tahun</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-filter" className="w-[120px]">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Impor Harga
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".csv,.xlsx" className="hidden" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Ekspor Laporan
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>Ekspor sebagai CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xlsx")}>Ekspor sebagai XLSX</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv", true)}>Kirim via Email (CSV)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xlsx", true)}>Kirim via Email (XLSX)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Biaya</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">Rp {totalAllCosts.toLocaleString("id-ID")}</div>
            <p className="text-xs text-blue-600">Biaya operasional periode ini</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Item Diproses</CardTitle>
            <Calculator className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{totalPickUpItems}</div>
            <p className="text-xs text-green-600">Item yang telah diproses</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Item Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{totalPendingItems}</div>
            <p className="text-xs text-yellow-600">Item yang belum dikembalikan</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Rata-rata Biaya</CardTitle>
            <Calculator className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              Rp {totalPickUpItems > 0 ? Math.round(totalAllCosts / totalPickUpItems).toLocaleString("id-ID") : "0"}
            </div>
            <p className="text-xs text-purple-600">Per item yang diproses</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Control Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tabel Cost Control</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Data dari Loog Book
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">No</TableHead>
                  <TableHead>ITEM</TableHead>
                  <TableHead>TANGGAL PICK UP</TableHead>
                  <TableHead className="text-right">QTY PICK UP</TableHead>
                  <TableHead className="text-right">PENDING</TableHead>
                  <TableHead className="text-right">RETURNED</TableHead>
                  <TableHead className="text-right">HARGA (Rp)</TableHead>
                  <TableHead className="text-right">TOTAL BIAYA (Rp)</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costControlData.length > 0 ? (
                  costControlData.map((data, index) => (
                    <TableRow key={data.itemId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{data.itemName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {data.dates.length > 0 ? (
                            data.dates.map((date, idx) => (
                              <div key={idx} className="text-sm">
                                {date}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {data.totalPickedUpQuantity > 0 ? data.totalPickedUpQuantity : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            data.pendingQuantity - data.returnedQuantity > 0 ? "text-yellow-600 font-medium" : ""
                          }
                        >
                          {data.pendingQuantity - data.returnedQuantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={data.returnedQuantity > 0 ? "text-green-600 font-medium" : ""}>
                          {data.returnedQuantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">Rp {data.price.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        Rp {data.totalCost.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(itemDefinitions.find((item) => item.id === data.itemId)!)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Tidak ada data dari Loog Book untuk periode yang dipilih.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* All Items Price Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Harga Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">No</TableHead>
                  <TableHead>ITEM</TableHead>
                  <TableHead className="text-right">HARGA (Rp)</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemDefinitions.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {item.price > 0 ? `Rp ${item.price.toLocaleString("id-ID")}` : "Gratis"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => handleEditItem(item)} className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Harga Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <Label>Item</Label>
                <Input value={editingItem.name} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={editingItem.price || ""}
                  placeholder="Masukkan harga"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
