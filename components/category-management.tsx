"use client"
import type React from "react"
import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Tag, Download, Upload, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Papa from "papaparse"

import type { User, Category, Item } from "@/app/page" // Import types
import { createCategory, updateCategory, deleteCategory } from "@/app/actions"

export function CategoryManagement({
  user,
  categories,
  items,
  refreshData,
}: {
  user: User
  categories: Category[]
  items: Item[]
  refreshData: () => void
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    // Validasi input
    const code = formData.get("code") as string
    const name = formData.get("name") as string

    if (!code || !name) {
      toast({
        title: "Validasi Gagal",
        description: "Kode dan nama kategori harus diisi",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Cek duplikasi kode
    const existingCategory = categories.find((cat) => cat.code.toLowerCase() === code.toLowerCase())
    if (existingCategory) {
      toast({
        title: "Kode Sudah Ada",
        description: "Kode kategori sudah digunakan, gunakan kode lain",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    startTransition(async () => {
      try {
        const result = await createCategory(formData)
        if (result.success) {
          setIsAddDialogOpen(false)
          toast({
            title: "Kategori Ditambahkan",
            description: result.message,
            duration: 3000,
          })
          refreshData()
          // Reset form
          event.currentTarget.reset()
        } else {
          toast({
            title: "Gagal Menambah Kategori",
            description: result.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat menambah kategori",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    })
  }

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setIsEditDialogOpen(true)
  }

  const handleUpdateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedCategory) return

    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)
    formData.append("id", selectedCategory.id.toString())
    formData.append("createdAt", selectedCategory.createdAt)

    startTransition(async () => {
      try {
        const result = await updateCategory(formData)
        if (result.success) {
          setIsEditDialogOpen(false)
          setSelectedCategory(null)
          toast({
            title: "Kategori Diperbarui",
            description: result.message,
            duration: 3000,
          })
          refreshData()
        } else {
          toast({
            title: "Gagal Memperbarui Kategori",
            description: result.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat memperbarui kategori",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    })
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
      return
    }

    startTransition(async () => {
      try {
        const result = await deleteCategory(id)
        if (result.success) {
          toast({
            title: "Kategori Dihapus",
            description: result.message,
            variant: "destructive",
            duration: 3000,
          })
          refreshData()
        } else {
          toast({
            title: "Gagal Menghapus Kategori",
            description: result.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat menghapus kategori",
          variant: "destructive",
        })
      }
    })
  }

  // Count items per category
  const getCategoryItemCount = (categoryName: string) => {
    return items.filter((item) => item.category === categoryName).length
  }

  const handleExportCategories = () => {
    const headers = ["id", "code", "name", "description", "status", "createdAt", "updatedAt"]
    const csvData = Papa.unparse(categories, {
      header: true,
      columns: headers,
    })
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", "categories_data.csv")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({
        title: "Export Berhasil",
        description: "Data kategori berhasil diekspor ke categories_data.csv",
      })
    }
  }

  const handleImportCategories = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length) {
          toast({
            title: "Import Gagal",
            description: `Ada kesalahan dalam parsing CSV: ${results.errors[0].message}`,
            variant: "destructive",
          })
          return
        }

        const importedData = results.data as Record<string, string>[]
        let successCount = 0
        let errorCount = 0

        for (const row of importedData) {
          const formData = new FormData()
          formData.append("code", row.Code || row.code)
          formData.append("name", row.Name || row.name)
          formData.append("description", row.Description || row.description || "")

          const result = await createCategory(formData)
          if (result.success) {
            successCount++
          } else {
            errorCount++
            toast({
              title: "Import Sebagian Gagal",
              description: `Gagal mengimpor kategori ${row.Name || row.name}: ${result.message}`,
              variant: "destructive",
            })
          }
        }

        if (successCount > 0) {
          refreshData()
          toast({
            title: "Import Selesai",
            description: `${successCount} kategori berhasil diimpor, ${errorCount} gagal.`,
          })
        } else if (errorCount > 0) {
          toast({
            title: "Import Gagal Total",
            description: "Tidak ada kategori yang berhasil diimpor.",
            variant: "destructive",
          })
        }
      },
      error: (error) => {
        toast({
          title: "Import Gagal",
          description: `Terjadi kesalahan saat membaca file: ${error.message}`,
          variant: "destructive",
        })
      },
    })
  }

  if (user.role !== "admin" && user.role !== "manager") {
    return (
      <div className="text-center py-12">
        <Tag className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
        <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Kategori Barang</h2>
          <p className="text-sm sm:text-base text-gray-600">Kelola kategori untuk pengelompokan barang</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Total: {categories.length} kategori</span>
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleExportCategories} size="sm" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCategories}
            className="hidden"
            id="import-categories-csv"
          />
          <Button
            onClick={() => document.getElementById("import-categories-csv")?.click()}
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Kategori
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Kategori Baru</DialogTitle>
                <DialogDescription>Masukkan informasi kategori baru</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kode Kategori *</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="Contoh: LIN, CLS, AMN"
                    required
                    maxLength={10}
                    className="uppercase"
                    onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Kategori *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Contoh: Linen, Cleaning Supplies"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Deskripsi singkat tentang kategori ini"
                    maxLength={500}
                  />
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Cari kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg truncate flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-500" />
                    {category.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 font-mono">{category.code}</p>
                </div>
                <Badge variant={category.status === "active" ? "default" : "secondary"} className="self-start">
                  {category.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Deskripsi:</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{category.description || "Tidak ada deskripsi"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Jumlah Barang:</p>
                  <p className="text-sm text-gray-600">{getCategoryItemCount(category.name)} barang</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Dibuat:</p>
                  <p className="text-sm text-gray-600">{new Date(category.createdAt).toLocaleDateString("id-ID")}</p>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)} disabled={isPending}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={getCategoryItemCount(category.name) > 0 || isPending}
                    title={
                      getCategoryItemCount(category.name) > 0
                        ? "Tidak dapat menghapus kategori yang memiliki barang"
                        : "Hapus kategori"
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tidak ada kategori ditemukan</h3>
          <p className="text-gray-600">
            {searchTerm ? "Coba ubah kata kunci pencarian" : "Mulai dengan menambah kategori baru"}
          </p>
        </div>
      )}

      {/* Edit Category Dialog */}
      {selectedCategory && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Kategori</DialogTitle>
              <DialogDescription>Perbarui informasi kategori</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editCode">Kode Kategori *</Label>
                <Input
                  id="editCode"
                  name="code"
                  required
                  defaultValue={selectedCategory.code}
                  maxLength={10}
                  className="uppercase"
                  onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editName">Nama Kategori *</Label>
                <Input id="editName" name="name" required defaultValue={selectedCategory.name} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Deskripsi</Label>
                <Textarea
                  id="editDescription"
                  name="description"
                  defaultValue={selectedCategory.description}
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select name="status" required defaultValue={selectedCategory.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
