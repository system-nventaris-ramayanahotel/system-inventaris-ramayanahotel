"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Edit, Download, Search, Plus, Eye, Trash2, Filter, Loader2 } from "lucide-react"
import type { User, Item, Depreciation } from "@/app/page"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import Papa from "papaparse"
import { createDepreciation, updateDepreciation, deleteDepreciation } from "@/app/actions"

export function DepreciationManagement({
  user,
  items,
  depreciations,
  refreshData,
  isLoading,
}: {
  user: User
  items: Item[]
  depreciations: Depreciation[]
  refreshData: () => void
  isLoading: boolean
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedDepreciation, setSelectedDepreciation] = useState<Depreciation | null>(null)
  const { toast } = useToast()

  // Real-time updates for depreciations
  useRealtimeData({
    table: "depreciations",
    enabled: true,
    onInsert: (payload) => {
      const newDepreciation = payload.new as Depreciation
      toast({
        title: "Penyusutan Baru Ditambahkan",
        description: "Penyusutan baru ditambahkan oleh pengguna lain",
      })
      refreshData()
    },
    onUpdate: (payload) => {
      const updatedDepreciation = payload.new as Depreciation
      toast({
        title: "Penyusutan Diperbarui",
        description: "Penyusutan diperbarui oleh pengguna lain",
      })
      refreshData()
    },
    onDelete: (payload) => {
      const deletedDepreciation = payload.old as Depreciation
      toast({
        title: "Penyusutan Dihapus",
        description: "Penyusutan dihapus oleh pengguna lain",
        variant: "destructive",
      })
      refreshData()
    },
  })

  const statusOptions = ["all", "completed", "pending"]

  const filteredDepreciations = depreciations.filter((depreciation) => {
    const item = items.find((i) => i.id === depreciation.itemId)
    const matchesSearch =
      item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      depreciation.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || depreciation.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const handleAddDepreciation = async (formData: FormData) => {
    const result = await createDepreciation(formData, user.id)
    if (result.success) {
      setIsAddDialogOpen(false)
      toast({ title: "Penyusutan Ditambahkan", description: result.message })
      await refreshData()
    } else {
      toast({ title: "Gagal Menambah Penyusutan", description: result.message, variant: "destructive" })
    }
  }

  const handleEditDepreciation = (depreciation: Depreciation) => {
    setSelectedDepreciation(depreciation)
    setIsEditDialogOpen(true)
  }

  const handleViewDepreciation = (depreciation: Depreciation) => {
    setSelectedDepreciation(depreciation)
    setIsViewDialogOpen(true)
  }

  const handleUpdateDepreciation = async (formData: FormData) => {
    if (!selectedDepreciation) return
    formData.append("id", selectedDepreciation.id.toString())
    formData.append("userId", user.id.toString())
    const result = await updateDepreciation(formData)
    if (result.success) {
      setIsEditDialogOpen(false)
      setSelectedDepreciation(null)
      toast({ title: "Penyusutan Diperbarui", description: result.message })
      await refreshData()
    } else {
      toast({ title: "Gagal Memperbarui Penyusutan", description: result.message, variant: "destructive" })
    }
  }

  const handleDeleteDepreciation = async (id: number) => {
    const result = await deleteDepreciation(id)
    if (result.success) {
      toast({ title: "Penyusutan Dihapus", description: result.message, variant: "destructive" })
      await refreshData()
    } else {
      toast({ title: "Gagal Menghapus Penyusutan", description: result.message, variant: "destructive" })
    }
  }

  const handleExportDepreciations = () => {
    const exportData = filteredDepreciations.map((depreciation) => {
      const item = items.find((i) => i.id === depreciation.itemId)
      return {
        id: depreciation.id,
        itemCode: item?.code || "N/A",
        itemName: item?.name || "N/A",
        quantity: depreciation.quantity,
        unit: item?.unit || "N/A",
        date: depreciation.date,
        reason: depreciation.reason,
        status: depreciation.status,
        userId: depreciation.userId,
      }
    })

    const headers = ["id", "itemCode", "itemName", "quantity", "unit", "date", "reason", "status", "userId"]

    try {
      const csv = Papa.unparse(exportData, {
        header: true,
        columns: headers,
      })
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", "depreciations_data.csv")
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast({
          title: "Export Berhasil",
          description: "Data penyusutan berhasil diekspor ke depreciations_data.csv",
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

  const getStatusBadgeVariant = (status: Depreciation["status"]) => {
    return status === "completed" ? "default" : "secondary"
  }

  const totalDepreciatedItems = depreciations.reduce((sum, dep) => sum + dep.quantity, 0)
  const completedDepreciations = depreciations.filter((dep) => dep.status === "completed").length
  const pendingDepreciations = depreciations.filter((dep) => dep.status === "pending").length

  if (user.role !== "admin" && user.role !== "manager" && user.role !== "staff") {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Memuat data penyusutan...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Penyusutan Barang</h2>
          <p className="text-sm sm:text-base text-gray-600">Kelola penyusutan dan kerusakan barang inventaris</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleExportDepreciations} size="sm" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          {(user.role === "admin" || user.role === "manager" || user.role === "staff") && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Penyusutan
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tambah Penyusutan Baru</DialogTitle>
                </DialogHeader>
                <form action={handleAddDepreciation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemId">Barang</Label>
                    <Select name="itemId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih barang" />
                      </SelectTrigger>
                      <SelectContent>
                        {items
                          .filter((item) => item.status === "active" && item.currentStock > 0)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((item) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name} ({item.code}) - Stok: {item.currentStock} {item.unit}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Jumlah</Label>
                    <Input id="quantity" name="quantity" type="number" min="1" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Alasan Penyusutan</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="Contoh: Rusak, hilang, kadaluarsa, dll."
                      required
                    />
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Batal
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">
                      Simpan
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Total Penyusutan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{depreciations.length}</div>
            <p className="text-xs text-red-600">Jumlah transaksi penyusutan</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Total Item Disusutkan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{totalDepreciatedItems}</div>
            <p className="text-xs text-orange-600">Jumlah barang yang disusutkan</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Selesai</CardTitle>
            <AlertTriangle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{completedDepreciations}</div>
            <p className="text-xs text-green-600">Penyusutan selesai</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{pendingDepreciations}</div>
            <p className="text-xs text-yellow-600">Penyusutan pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari penyusutan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {statusOptions.slice(1).map((status) => (
              <SelectItem key={status} value={status}>
                {status === "completed" ? "Selesai" : "Pending"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Depreciations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Kode Barang</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                  <TableHead className="hidden md:table-cell">Alasan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepreciations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm || selectedStatus !== "all"
                          ? "Tidak ada penyusutan yang sesuai dengan pencarian"
                          : "Belum ada data penyusutan. Tambahkan penyusutan pertama Anda!"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepreciations.map((depreciation) => {
                    const item = items.find((i) => i.id === depreciation.itemId)

                    return (
                      <TableRow key={depreciation.id}>
                        <TableCell className="font-medium">{depreciation.id}</TableCell>
                        <TableCell className="font-medium">{item?.code || "N/A"}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item?.name || "Barang Tidak Dikenal"}</p>
                            <p className="text-sm text-gray-500">{item?.category || "N/A"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="font-medium">
                              {depreciation.quantity} {item?.unit || "unit"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-gray-500">
                          {depreciation.date}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-sm truncate max-w-32" title={depreciation.reason}>
                            {depreciation.reason}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(depreciation.status)}>
                            {depreciation.status === "completed" ? "Selesai" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDepreciation(depreciation)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(user.role === "admin" || user.role === "manager") && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleEditDepreciation(depreciation)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDepreciation(depreciation.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Depreciation Dialog */}
      {selectedDepreciation && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Penyusutan</DialogTitle>
            </DialogHeader>
            <form action={handleUpdateDepreciation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editItemId">Barang</Label>
                <Select name="itemId" required defaultValue={selectedDepreciation.itemId.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih barang" />
                  </SelectTrigger>
                  <SelectContent>
                    {items
                      .filter((item) => item.status === "active")
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ({item.code}) - Stok: {item.currentStock} {item.unit}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editQuantity">Jumlah</Label>
                <Input
                  id="editQuantity"
                  name="quantity"
                  type="number"
                  min="1"
                  required
                  defaultValue={selectedDepreciation.quantity}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editReason">Alasan Penyusutan</Label>
                <Textarea id="editReason" name="reason" required defaultValue={selectedDepreciation.reason} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select name="status" required defaultValue={selectedDepreciation.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* View Depreciation Dialog */}
      {selectedDepreciation && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Penyusutan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div>
                  <strong className="text-sm">ID:</strong>
                  <p className="text-sm">{selectedDepreciation.id}</p>
                </div>
                <div>
                  <strong className="text-sm">Barang:</strong>
                  <p className="text-sm">
                    {items.find((i) => i.id === selectedDepreciation.itemId)?.name || "Barang Tidak Dikenal"}
                  </p>
                </div>
                <div>
                  <strong className="text-sm">Kode Barang:</strong>
                  <p className="text-sm">{items.find((i) => i.id === selectedDepreciation.itemId)?.code || "N/A"}</p>
                </div>
                <div>
                  <strong className="text-sm">Jumlah:</strong>
                  <p className="text-sm">
                    {selectedDepreciation.quantity}{" "}
                    {items.find((i) => i.id === selectedDepreciation.itemId)?.unit || "unit"}
                  </p>
                </div>
                <div>
                  <strong className="text-sm">Tanggal:</strong>
                  <p className="text-sm">{selectedDepreciation.date}</p>
                </div>
                <div>
                  <strong className="text-sm">Alasan:</strong>
                  <p className="text-sm">{selectedDepreciation.reason}</p>
                </div>
                <div>
                  <strong className="text-sm">Status:</strong>
                  <Badge variant={getStatusBadgeVariant(selectedDepreciation.status)} className="ml-2">
                    {selectedDepreciation.status === "completed" ? "Selesai" : "Pending"}
                  </Badge>
                </div>
                <div>
                  <strong className="text-sm">User ID:</strong>
                  <p className="text-sm">{selectedDepreciation.userId}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)} className="w-full">
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
