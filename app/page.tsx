"use client"

import { CardDescription } from "@/components/ui/card"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Papa from "papaparse"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import { useDataSync } from "@/hooks/use-data-sync"
import { useOptimisticUpdates } from "@/hooks/use-optimistic-updates"
import {
  Package,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Home,
  BarChart3,
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  AlertTriangle,
  Download,
  Upload,
  MapPin,
  Bell,
  LogOut,
  Tag,
  Shirt,
  ChevronDown,
  Wifi,
  WifiOff,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CategoryManagement } from "@/components/category-management"
import { LoogBookManagement } from "@/components/loog-book-management"
import { CostControlManagement } from "@/components/cost-control-management"
import { InvoiceManagement } from "@/components/invoice-management"
import { GuestLaundryManagement } from "@/components/guest-laundry-management"
import { ItemsInManagement } from "@/components/items-in-management"
import { ItemsOutManagement } from "@/components/items-out-management"
import { LocationManagement } from "@/components/location-management"
import { ReportsManagement } from "@/components/reports-management"
import { DepreciationManagement } from "@/components/depreciation-management"

// Import Server Actions
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  fetchSuppliers,
  fetchTransactions,
  fetchDepreciations,
  fetchCategories,
} from "@/app/actions"

// Types (exported for use in mock-db.ts and actions.ts)
export interface User {
  id: number
  username: string
  name: string
  email: string
  role: "admin" | "manager" | "staff"
  status: "active" | "inactive"
  lastLogin: string
  avatarUrl?: string
}

export interface Item {
  id: number
  code: string
  name: string
  category: string
  description: string
  unit: string
  minStock: number
  currentStock: number
  location: string
  supplierId: number
  price: number
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
  imageUrl?: string
}

export interface Supplier {
  id: number
  code: string
  name: string
  contact: string
  phone: string
  email: string
  address: string
  status: "active" | "inactive"
  createdAt: string
}

export interface Transaction {
  id: number
  type: "in" | "out" | "borrow" | "return"
  itemId: number
  quantity: number
  userId: number
  supplierId?: number
  borrowerId?: string
  notes: string
  status: "pending" | "approved" | "completed" | "cancelled"
  date: string
  dueDate?: string
  returnDate?: string
}

export interface Depreciation {
  id: number
  itemId: number
  quantity: number
  date: string
  reason: string
  userId: number
  status: "completed" | "pending"
}

export interface Category {
  id: number
  code: string
  name: string
  description: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

// Define a type for a log entry (moved from LoogBookManagement)
export interface LogEntry {
  id: number
  date: string
  itemId: number
  outQuantity: number
  inQuantity: number
  pendingQuantity: number
  returnedQuantity: number
  returnedImageUrl?: string
  returnedDate?: string
}

// Helper function to download CSV
const downloadCsv = (data: any[], filename: string, headers: string[], toast: ReturnType<typeof useToast>["toast"]) => {
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

// Navigation items with permissions
const getNavigationItems = (userRole: string) => {
  const allItems = [
    { title: "DASHBOARD", icon: Home, key: "dashboard", roles: ["admin", "manager", "staff"] },
    {
      title: "LAUNDRY",
      icon: Shirt,
      key: "laundry",
      roles: ["admin", "manager", "staff"],
      children: [
        {
          title: "CM Coin Laundry",
          key: "cm-coin-laundry",
          roles: ["admin", "manager"],
          children: [
            { title: "Loog Book", key: "loog-book", roles: ["admin", "manager"] },
            { title: "Cost Control", key: "cost-control", roles: ["admin", "manager"] },
            { title: "Invoice", key: "invoice", roles: ["admin", "manager"] },
            { title: "Guest Laundry", key: "guest-laundry", roles: ["admin", "manager", "staff"] },
          ],
        },
      ],
    },
    { title: "DATA BARANG", icon: Package, key: "items", roles: ["admin", "manager", "staff"] },
    { title: "KATEGORI BARANG", icon: Tag, key: "categories", roles: ["admin", "manager"] },
    { title: "PENYUSUTAN BARANG", icon: ArrowDownLeft, key: "depreciation", roles: ["admin", "manager", "staff"] },
    { title: "BARANG MASUK", icon: ArrowDownLeft, key: "items-in", roles: ["admin", "manager"] },
    { title: "BARANG KELUAR", icon: ArrowUpRight, key: "items-out", roles: ["admin", "manager"] },
    { title: "LOKASI PENYIMPANAN", icon: MapPin, key: "locations", roles: ["admin", "manager", "staff"] },
    { title: "DATA PENGGUNA", icon: Users, key: "users", roles: ["admin"] },
    { title: "LAPORAN", icon: BarChart3, key: "reports", roles: ["admin", "manager"] },
    { title: "PENGATURAN", icon: Settings, key: "settings", roles: ["admin", "manager", "staff"] },
  ]

  // Filter items based on user role and recursively filter children
  const filterItemsByRole = (items: (typeof allItems)[0][], role: string) => {
    return items.reduce((acc: (typeof allItems)[0][], item) => {
      if (item.roles.includes(role)) {
        const newItem = { ...item }
        if (item.children) {
          newItem.children = filterItemsByRole(item.children, role)
        }
        acc.push(newItem)
      }
      return acc
    }, [])
  }

  return filterItemsByRole(allItems, userRole)
}

// Login Component
function LoginForm({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Mock users for preview environment when Supabase is not fully configured
  const mockUsers: User[] = [
    {
      id: 1,
      username: "Bas",
      name: "Bas",
      email: "bas@example.com",
      role: "admin",
      status: "active",
      lastLogin: new Date().toISOString().split("T")[0],
    },
    {
      id: 2,
      username: "Kiswanto",
      name: "Kiswanto",
      email: "kiswanto@example.com",
      role: "manager",
      status: "active",
      lastLogin: new Date().toISOString().split("T")[0],
    },
    {
      id: 3,
      username: "hkcrew",
      name: "HK Crew",
      email: "hkcrew@example.com",
      role: "staff",
      status: "active",
      lastLogin: new Date().toISOString().split("T")[0],
    },
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      let availableUsers: User[] = []

      try {
        availableUsers = await fetchUsers() // Try to fetch from Supabase
      } catch (fetchError) {
        console.warn("Failed to fetch users from database, using mock users:", fetchError)
        availableUsers = mockUsers
      }

      // If Supabase returns no users (e.g., in preview or not seeded), use mock users
      if (availableUsers.length === 0) {
        availableUsers = mockUsers
      }

      const user = availableUsers.find((u) => u.username === username)

      if (user && user.status === "active") {
        // Mock password check for demo purposes. In a real app, use secure authentication.
        if (
          (user.username === "Bas" && password === "Husky321") ||
          (user.username === "Kiswanto" && password === "Kiswanto1973") ||
          (user.username === "hkcrew" && password === "Crew321")
        ) {
          // Update last login
          const updatedUser = {
            ...user,
            lastLogin: new Date().toISOString().split("T")[0],
          }

          // Store user in localStorage for persistence
          localStorage.setItem("currentUser", JSON.stringify(updatedUser))

          onLogin(updatedUser)

          toast({
            title: "Login Berhasil",
            description: `Selamat datang, ${user.name}!`,
          })
        } else {
          setError("Username atau password salah")
          toast({
            title: "Login Gagal",
            description: "Username atau password salah.",
            variant: "destructive",
          })
        }
      } else if (user && user.status === "inactive") {
        setError("Akun Anda tidak aktif. Hubungi administrator.")
        toast({
          title: "Login Gagal",
          description: "Akun Anda tidak aktif. Hubungi administrator.",
          variant: "destructive",
        })
      } else {
        setError("Username atau password salah")
        toast({
          title: "Login Gagal",
          description: "Username atau password salah.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError("Terjadi kesalahan saat login")
      toast({
        title: "Login Gagal",
        description: `Terjadi kesalahan: ${err.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#25282A] to-[#25282A] p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="w-80 h-20 bg-white rounded-lg flex items-center justify-center mx-auto overflow-hidden p-4 shadow-sm">
            <img
              src="/images/ramayana-logo-new.png"
              alt="Ramayana Hotel Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl font-bold">Inventaris HK</CardTitle>
            <p className="text-sm sm:text-base text-gray-600">Hotel Management System</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full"
                required
                disabled={isLoading}
              />
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Masuk...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Dashboard Component
function Dashboard({
  user,
  items,
  users,
  suppliers,
  transactions,
  setCurrentPage,
  isOnline,
  isLoading,
}: {
  user: User
  items: Item[]
  users: User[]
  suppliers: Supplier[]
  transactions: Transaction[]
  setCurrentPage: (page: string) => void
  isOnline: boolean
  isLoading: boolean
}) {
  const dashboardStats = [
    {
      title: "Model Barang",
      value: items.length.toString(),
      color: "bg-gradient-to-br from-green-500 to-green-600",
      icon: Package,
      link: "items",
    },
    {
      title: "Pengguna",
      value: users.length.toString(),
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      icon: Users,
      link: "users",
    },
  ]

  const transactionStats = [
    {
      title: "Total Barang Masuk",
      value: transactions
        .filter((t) => t.type === "in")
        .reduce((sum, t) => sum + t.quantity, 0)
        .toString(),
      color: "bg-gradient-to-br from-blue-600 to-blue-700",
      link: "items-in",
    },
    {
      title: "Total Barang Keluar",
      value: transactions
        .filter((t) => t.type === "out")
        .reduce((sum, t) => sum + t.quantity, 0)
        .toString(),
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      link: "items-out",
    },
    {
      title: "Total Transaksi Barang Masuk",
      value: transactions.filter((t) => t.type === "in").length.toString(),
      color: "bg-gradient-to-br from-orange-600 to-orange-700",
      link: "items-in",
    },
    {
      title: "Total Transaksi Barang Keluar",
      value: transactions.filter((t) => t.type === "out").length.toString(),
      color: "bg-gradient-to-br from-blue-700 to-blue-800",
      link: "items-out",
    },
  ]

  const lowStockItems = items.filter((item) => item.currentStock <= item.minStock).slice(0, 5)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Memuat data dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Connection Status */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <WifiOff className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Mode Offline</p>
              <p className="text-sm text-yellow-700">
                Anda sedang offline. Data akan disinkronkan ketika koneksi kembali tersedia.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Message */}
      <div className="bg-[#F0D58D] text-white p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Selamat Datang, {user.name}!</h2>
        <p className="text-sm sm:text-base opacity-90">
          Role: {user.role.toUpperCase()} | Last Login: {user.lastLogin}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {dashboardStats.map((stat, index) => (
          <Card
            key={index}
            className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() => setCurrentPage(stat.link)}
          >
            <CardContent className="p-0">
              <div className={`${stat.color} p-4 sm:p-6 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full -mr-8 sm:-mr-10 -mt-8 sm:-mt-10"></div>
                <div className="relative z-10">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" />
                  <div className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">{stat.value}</div>
                  <div className="text-xs sm:text-sm opacity-90">{stat.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {transactionStats.map((stat, index) => (
          <Card
            key={index}
            className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            onClick={() => setCurrentPage(stat.link)}
          >
            <CardContent className="p-0">
              <div className={`${stat.color} p-4 sm:p-6 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full -mr-6 sm:-mr-8 -mt-6 sm:-mt-8"></div>
                <div className="relative z-10">
                  <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{stat.value}</div>
                  <div className="text-xs sm:text-sm opacity-90">{stat.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low Stock Items */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
          <CardTitle className="text-lg sm:text-xl font-bold">Barang Stok Rendah</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setCurrentPage("items")} className="self-start sm:self-auto">
            Lihat Semua <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {lowStockItems.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 space-y-2 sm:space-y-0"
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-red-800 truncate">{item.name}</p>
                      <p className="text-sm text-red-600">
                        Stok: {item.currentStock} {item.unit} (Min: {item.minStock})
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="self-start sm:self-auto">
                    Stok Rendah
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">Tidak ada barang dengan stok rendah.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
          <CardTitle className="text-lg sm:text-xl font-bold">Aktivitas Transaksi Terbaru</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage("items-in")}
            className="self-start sm:self-auto"
          >
            Lihat Semua <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => {
                const item = items.find((i) => i.id === transaction.itemId)
                const transactionTypeLabel =
                  transaction.type === "in"
                    ? "Barang Masuk"
                    : transaction.type === "out"
                      ? "Barang Keluar"
                      : transaction.type === "borrow"
                        ? "Peminjaman"
                        : "Pengembalian"
                const statusVariant =
                  transaction.status === "completed"
                    ? "default"
                    : transaction.status === "pending"
                      ? "secondary"
                      : "destructive"

                return (
                  <div
                    key={transaction.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 sm:space-y-0"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div
                        className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                          transaction.type === "in"
                            ? "bg-green-500"
                            : transaction.type === "out"
                              ? "bg-red-500"
                              : transaction.type === "borrow"
                                ? "bg-blue-500"
                                : "bg-purple-500"
                        }`}
                      ></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{item?.name || "Barang Tidak Dikenal"}</p>
                        <p className="text-sm text-gray-600">
                          {transactionTypeLabel} - {transaction.quantity} {item?.unit || "unit"}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant} className="self-start sm:self-auto">
                      {transaction.status === "completed"
                        ? "Selesai"
                        : transaction.status === "pending"
                          ? "Dipinjam"
                          : transaction.status}
                    </Badge>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-600 text-center py-4">Tidak ada aktivitas transaksi terbaru.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Users Management Component
function UsersManagement({
  currentUser,
  users,
  refreshData,
  isLoading,
}: {
  currentUser: User
  users: User[]
  refreshData: () => void
  isLoading: boolean
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  // Real-time updates for users - disabled auto refresh
  useRealtimeData({
    table: "users",
    enabled: false, // Disabled automatic real-time updates
    onInsert: (payload) => {
      const newUser = payload.new as User
      toast({
        title: "Pengguna Baru Ditambahkan",
        description: `${newUser.name} ditambahkan oleh pengguna lain`,
      })
      refreshData()
    },
    onUpdate: (payload) => {
      const updatedUser = payload.new as User
      toast({
        title: "Pengguna Diperbarui",
        description: `${updatedUser.name} diperbarui oleh pengguna lain`,
      })
      refreshData()
    },
    onDelete: (payload) => {
      const deletedUser = payload.old as User
      toast({
        title: "Pengguna Dihapus",
        description: `${deletedUser.name} dihapus oleh pengguna lain`,
        variant: "destructive",
      })
      refreshData()
    },
  })

  const userRoles = ["all", "admin", "manager", "staff"]

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const handleAddUser = async (formData: FormData) => {
    const result = await createUser(formData)
    if (result.success) {
      setIsAddDialogOpen(false)
      toast({ title: "Pengguna Ditambahkan", description: result.message })
      await refreshData()
    } else {
      toast({ title: "Gagal Menambah Pengguna", description: result.message, variant: "destructive" })
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsViewDialogOpen(true)
  }

  const handleUpdateUser = async (formData: FormData) => {
    if (!selectedUser) return

    const password = formData.get("password") as string
    const passwordConfirm = formData.get("passwordConfirm") as string

    // Validate password if provided
    if (password && password.trim() !== "") {
      if (password !== passwordConfirm) {
        toast({
          title: "Password Tidak Cocok",
          description: "Password baru dan konfirmasi password harus sama.",
          variant: "destructive",
        })
        return
      }

      if (password.length < 6) {
        toast({
          title: "Password Terlalu Pendek",
          description: "Password harus minimal 6 karakter.",
          variant: "destructive",
        })
        return
      }
    }

    formData.append("id", selectedUser.id.toString())
    const result = await updateUser(formData)
    if (result.success) {
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      toast({
        title: "Pengguna Diperbarui",
        description:
          password && password.trim() !== "" ? "Data pengguna dan password berhasil diperbarui" : result.message,
      })
      await refreshData()
    } else {
      toast({ title: "Gagal Memperbarui Pengguna", description: result.message, variant: "destructive" })
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (id === currentUser.id) {
      toast({
        title: "Tidak Dapat Menghapus",
        description: "Anda tidak dapat menghapus akun Anda sendiri.",
        variant: "destructive",
      })
      return
    }

    const result = await deleteUser(id)
    if (result.success) {
      toast({ title: "Pengguna Dihapus", description: result.message, variant: "destructive" })
      await refreshData()
    } else {
      toast({ title: "Gagal Menghapus Pengguna", description: result.message, variant: "destructive" })
    }
  }

  const handleExportUsers = () => {
    const headers = ["id", "username", "name", "email", "role", "status", "lastLogin"]
    downloadCsv(users, "users_data.csv", headers, toast)
  }

  const getRoleBadgeVariant = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "manager":
        return "default"
      case "staff":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusBadgeVariant = (status: User["status"]) => {
    return status === "active" ? "default" : "secondary"
  }

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Memuat data pengguna...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Data Pengguna</h2>
          <p className="text-sm sm:text-base text-gray-600">Kelola pengguna sistem inventaris</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleExportUsers} size="sm" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pengguna
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                <DialogDescription>Masukkan informasi pengguna baru</DialogDescription>
              </DialogHeader>
              <form action={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
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
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            {userRoles.slice(1).map((role) => (
              <SelectItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm || selectedRole !== "all"
                          ? "Tidak ada pengguna yang sesuai dengan pencarian"
                          : "Belum ada data pengguna. Tambahkan pengguna pertama Anda!"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-600 text-white font-semibold">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status === "active" ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500">{user.lastLogin}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {user.id !== currentUser.id && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>Perbarui informasi pengguna</DialogDescription>
            </DialogHeader>
            <form action={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editUsername">Username</Label>
                <Input id="editUsername" name="username" required defaultValue={selectedUser.username} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editName">Nama Lengkap</Label>
                <Input id="editName" name="name" required defaultValue={selectedUser.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input id="editEmail" name="email" type="email" required defaultValue={selectedUser.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select name="role" required defaultValue={selectedUser.role}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select name="status" required defaultValue={selectedUser.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPassword">Password Baru (Opsional)</Label>
                <Input
                  id="editPassword"
                  name="password"
                  type="password"
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                />
                <p className="text-xs text-gray-500">Kosongkan field ini jika tidak ingin mengubah password</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPasswordConfirm">Konfirmasi Password Baru</Label>
                <Input
                  id="editPasswordConfirm"
                  name="passwordConfirm"
                  type="password"
                  placeholder="Ulangi password baru"
                />
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

      {/* View User Dialog */}
      {selectedUser && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Pengguna</DialogTitle>
              <DialogDescription>Informasi lengkap tentang pengguna ini</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                    {selectedUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <strong className="text-sm">ID:</strong>
                  <p className="text-sm">{selectedUser.id}</p>
                </div>
                <div>
                  <strong className="text-sm">Username:</strong>
                  <p className="text-sm">{selectedUser.username}</p>
                </div>
                <div>
                  <strong className="text-sm">Nama Lengkap:</strong>
                  <p className="text-sm">{selectedUser.name}</p>
                </div>
                <div>
                  <strong className="text-sm">Email:</strong>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <strong className="text-sm">Role:</strong>
                  <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="ml-2">
                    {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                  </Badge>
                </div>
                <div>
                  <strong className="text-sm">Status:</strong>
                  <Badge variant={getStatusBadgeVariant(selectedUser.status)} className="ml-2">
                    {selectedUser.status === "active" ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
                <div>
                  <strong className="text-sm">Last Login:</strong>
                  <p className="text-sm">{selectedUser.lastLogin}</p>
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

// Items Management Component with Real-time Updates
function ItemsManagement({
  user,
  items,
  suppliers,
  refreshData,
  categories,
  setCurrentPage,
  isLoading,
}: {
  user: User
  items: Item[]
  suppliers: Supplier[]
  refreshData: () => void
  categories: Category[]
  setCurrentPage: (page: string) => void
  isLoading: boolean
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(
    selectedItem?.imageUrl ? new File([], selectedItem.imageUrl) : null,
  )
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(selectedItem?.imageUrl || null)
  const { toast } = useToast()

  // Real-time updates for items - disabled auto refresh
  useRealtimeData({
    table: "items",
    enabled: false, // Disabled automatic real-time updates
    onInsert: (payload) => {
      const newItem = payload.new as Item
      toast({
        title: "Barang Baru Ditambahkan",
        description: `${newItem.name} ditambahkan oleh pengguna lain`,
      })
      refreshData()
    },
    onUpdate: (payload) => {
      const updatedItem = payload.new as Item
      toast({
        title: "Barang Diperbarui",
        description: `${updatedItem.name} diperbarui oleh pengguna lain`,
      })
      refreshData()
    },
    onDelete: (payload) => {
      const deletedItem = payload.old as Item
      toast({
        title: "Barang Dihapus",
        description: `${deletedItem.name} dihapus oleh pengguna lain`,
        variant: "destructive",
      })
      refreshData()
    },
  })

  const itemCategories = [
    "all",
    ...Array.from(new Set(categories.filter((cat) => cat.status === "active").map((category) => category.name))),
  ]

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImageFile(file)
      setPreviewImageUrl(URL.createObjectURL(file))
    } else {
      setSelectedImageFile(null)
      setPreviewImageUrl(null)
    }
  }

  const handleAddItem = async (formData: FormData) => {
    const result = await createItem(formData, previewImageUrl || undefined)
    if (result.success) {
      setIsAddDialogOpen(false)
      setSelectedImageFile(null)
      setPreviewImageUrl(null)
      toast({ title: "Barang Ditambahkan", description: result.message })
      await refreshData()
    } else {
      toast({ title: "Gagal Menambah Barang", description: result.message, variant: "destructive" })
    }
  }

  const handleEditItem = (item: Item) => {
    setSelectedItem(item)
    setPreviewImageUrl(item.imageUrl || null)
    setIsEditDialogOpen(true)
  }

  const handleViewItem = (item: Item) => {
    setSelectedItem(item)
    setIsViewDialogOpen(true)
  }

  const handleUpdateItem = async (formData: FormData) => {
    if (!selectedItem) return
    formData.append("id", selectedItem.id.toString())
    formData.append("createdAt", selectedItem.createdAt)
    const result = await updateItem(formData, previewImageUrl || undefined)
    if (result.success) {
      setIsEditDialogOpen(false)
      setSelectedItem(null)
      setSelectedImageFile(null)
      setPreviewImageUrl(null)
      toast({ title: "Barang Diperbarui", description: result.message })
      await refreshData()
    } else {
      toast({ title: "Gagal Memperbarui Barang", description: result.message, variant: "destructive" })
    }
  }

  const handleDeleteItem = async (id: number) => {
    const result = await deleteItem(id)
    if (result.success) {
      toast({ title: "Barang Dihapus", description: result.message, variant: "destructive" })
      await refreshData()
    } else {
      toast({ title: "Gagal Menghapus Barang", description: result.message, variant: "destructive" })
    }
  }

  const getStockStatus = (item: Item) => {
    if (item.currentStock <= item.minStock) return "low"
    if (item.currentStock <= item.minStock * 1.5) return "medium"
    return "high"
  }

  const handleExportItems = () => {
    const headers = [
      "id",
      "code",
      "name",
      "category",
      "description",
      "unit",
      "minStock",
      "currentStock",
      "location",
      "supplierId",
      "price",
      "status",
      "createdAt",
      "updatedAt",
      "imageUrl",
    ]
    downloadCsv(items, "items_data.csv", headers, toast)
  }

  const handleImportItems = (event: React.ChangeEvent<HTMLInputElement>) => {
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
          formData.append("code", row.Code)
          formData.append("name", row.Name)
          formData.append("category", row.Category)
          formData.append("description", row.Description || "")
          formData.append("unit", row.Unit)
          formData.append("minStock", row.MinStock)
          formData.append("currentStock", row.CurrentStock)
          formData.append("location", row.Location)
          formData.append("supplierId", row.SupplierID)
          formData.append("price", row.Price)
          if (row.Status) formData.append("status", row.Status)
          if (row.CreatedAt) formData.append("createdAt", row.CreatedAt)
          if (row.UpdatedAt) formData.append("updatedAt", row.UpdatedAt)
          const imageUrl = row.ImageUrl || undefined

          const result = await createItem(formData, imageUrl)
          if (result.success) {
            successCount++
          } else {
            errorCount++
            toast({
              title: "Import Sebagian Gagal",
              description: `Gagal mengimpor baris untuk item ${row.Name}: ${result.message}`,
              variant: "destructive",
            })
          }
        }

        if (successCount > 0) {
          await refreshData()
          toast({
            title: "Import Selesai",
            description: `${successCount} barang berhasil diimpor, ${errorCount} gagal.`,
          })
        } else if (errorCount > 0) {
          toast({
            title: "Import Gagal Total",
            description: `Tidak ada barang yang berhasil diimpor.`,
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

  const getCategoryDisplayName = (categoryValue: string) => {
    const category = categories.find((cat) => cat.name === categoryValue || cat.id.toString() === categoryValue)
    return category ? category.name : categoryValue
  }

  const hasActiveCategories = categories.some((cat) => cat.status === "active")

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Memuat data barang...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold">Data Barang</h2>
          <p className="text-sm sm:text-base text-gray-600">Kelola inventaris barang hotel</p>
          {!hasActiveCategories && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    Belum ada kategori aktif. Silakan buat kategori terlebih dahulu di menu{" "}
                    <button
                      onClick={() => setCurrentPage("categories")}
                      className="font-medium underline hover:text-yellow-900"
                    >
                      Kategori Barang
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleExportItems} size="sm" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <input type="file" accept=".csv" onChange={handleImportItems} className="hidden" id="import-items-csv" />
          <Button
            onClick={() => document.getElementById("import-items-csv")?.click()}
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          {(user.role === "admin" || user.role === "manager") && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto" disabled={!hasActiveCategories}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Barang
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tambah Barang Baru</DialogTitle>
                  <DialogDescription>Masukkan informasi barang baru</DialogDescription>
                </DialogHeader>
                <form action={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Kode Barang</Label>
                      <Input id="code" name="code" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Barang</Label>
                      <Input id="name" name="name" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Select name="category" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((cat) => cat.status === "active")
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name} ({category.code})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Satuan</Label>
                      <Input id="unit" name="unit" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Stok Minimum</Label>
                      <Input id="minStock" name="minStock" type="number" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentStock">Stok Saat Ini</Label>
                      <Input id="currentStock" name="currentStock" type="number" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Harga</Label>
                      <Input id="price" name="price" type="number" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Lokasi</Label>
                      <Input id="location" name="location" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplierId">Supplier</Label>
                      <Select name="supplierId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers
                            .filter((supplier) => supplier.status === "active")
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemImage">Gambar Barang</Label>
                    <Input id="itemImage" type="file" accept="image/*" onChange={handleImageChange} />
                    {previewImageUrl && (
                      <img
                        src={previewImageUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="mt-2 h-20 w-20 object-cover rounded-md"
                      />
                    )}
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

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {itemCategories.slice(1).map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Gambar</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="hidden sm:table-cell">Kategori</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="hidden md:table-cell">Status Stok</TableHead>
                  <TableHead className="hidden lg:table-cell">Lokasi</TableHead>
                  <TableHead className="hidden lg:table-cell">Harga</TableHead>
                  <TableHead className="hidden xl:table-cell">Tgl Input</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm || selectedCategory !== "all"
                          ? "Tidak ada barang yang sesuai dengan pencarian"
                          : "Belum ada data barang. Tambahkan barang pertama Anda!"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const stockStatus = getStockStatus(item)

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs text-center p-1">
                              No Image
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{item.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-32">{item.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{getCategoryDisplayName(item.category)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {item.currentStock} {item.unit}
                            </p>
                            <p className="text-sm text-gray-500">Min: {item.minStock}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant={
                              stockStatus === "low" ? "destructive" : stockStatus === "medium" ? "secondary" : "default"
                            }
                          >
                            {stockStatus === "low"
                              ? "Stok Rendah"
                              : stockStatus === "medium"
                                ? "Stok Sedang"
                                : "Stok Aman"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{item.location}</TableCell>
                        <TableCell className="hidden lg:table-cell">Rp {item.price.toLocaleString()}</TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-gray-500">{item.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewItem(item)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(user.role === "admin" || user.role === "manager") && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
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

      {/* Edit Item Dialog */}
      {selectedItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Barang</DialogTitle>
              <DialogDescription>Perbarui informasi barang</DialogDescription>
            </DialogHeader>
            <form action={handleUpdateItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCode">Kode Barang</Label>
                  <Input id="editCode" name="code" required defaultValue={selectedItem.code} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editName">Nama Barang</Label>
                  <Input id="editName" name="name" required defaultValue={selectedItem.name} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCategory">Kategori</Label>
                  <Select name="category" required defaultValue={selectedItem.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((cat) => cat.status === "active")
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name} ({category.code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editUnit">Satuan</Label>
                  <Input id="editUnit" name="unit" required defaultValue={selectedItem.unit} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Deskripsi</Label>
                <Textarea id="editDescription" name="description" defaultValue={selectedItem.description} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editMinStock">Stok Minimum</Label>
                  <Input
                    id="editMinStock"
                    name="minStock"
                    type="number"
                    required
                    defaultValue={selectedItem.minStock}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCurrentStock">Stok Saat Ini</Label>
                  <Input
                    id="editCurrentStock"
                    name="currentStock"
                    type="number"
                    required
                    defaultValue={selectedItem.currentStock}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPrice">Harga</Label>
                  <Input id="editPrice" name="price" type="number" required defaultValue={selectedItem.price} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editLocation">Lokasi</Label>
                  <Input id="editLocation" name="location" required defaultValue={selectedItem.location} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSupplierId">Supplier</Label>
                  <Select name="supplierId" required defaultValue={selectedItem.supplierId.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers
                        .filter((supplier) => supplier.status === "active")
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select name="status" required defaultValue={selectedItem.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editItemImage">Gambar Barang</Label>
                <Input id="editItemImage" type="file" accept="image/*" onChange={handleImageChange} />
                {previewImageUrl && (
                  <img
                    src={previewImageUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="mt-2 h-20 w-20 object-cover rounded-md"
                  />
                )}
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

      {/* View Item Dialog */}
      {selectedItem && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Barang</DialogTitle>
              <DialogDescription>Informasi lengkap tentang barang ini</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedItem.imageUrl && (
                <img
                  src={selectedItem.imageUrl || "/placeholder.svg"}
                  alt={selectedItem.name}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}
              <div className="space-y-3">
                <div>
                  <strong className="text-sm">Kode:</strong>
                  <p className="text-sm">{selectedItem.code}</p>
                </div>
                <div>
                  <strong className="text-sm">Nama:</strong>
                  <p className="text-sm">{selectedItem.name}</p>
                </div>
                <div>
                  <strong className="text-sm">Kategori:</strong>
                  <p className="text-sm">{getCategoryDisplayName(selectedItem.category)}</p>
                </div>
                <div>
                  <strong className="text-sm">Deskripsi:</strong>
                  <p className="text-sm">{selectedItem.description || "-"}</p>
                </div>
                <div>
                  <strong className="text-sm">Stok Saat Ini:</strong>
                  <p className="text-sm">
                    {selectedItem.currentStock} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <strong className="text-sm">Stok Minimum:</strong>
                  <p className="text-sm">
                    {selectedItem.minStock} {selectedItem.unit}
                  </p>
                </div>
                <div>
                  <strong className="text-sm">Lokasi:</strong>
                  <p className="text-sm">{selectedItem.location}</p>
                </div>
                <div>
                  <strong className="text-sm">Supplier:</strong>
                  <p className="text-sm">{suppliers.find((s) => s.id === selectedItem.supplierId)?.name || "N/A"}</p>
                </div>
                <div>
                  <strong className="text-sm">Harga:</strong>
                  <p className="text-sm">Rp {selectedItem.price.toLocaleString()}</p>
                </div>
                <div>
                  <strong className="text-sm">Status:</strong>
                  <Badge className="ml-2">{selectedItem.status}</Badge>
                </div>
                <div>
                  <strong className="text-sm">Tanggal Input:</strong>
                  <p className="text-sm">{selectedItem.createdAt}</p>
                </div>
                <div>
                  <strong className="text-sm">Terakhir Diperbarui:</strong>
                  <p className="text-sm">{selectedItem.updatedAt}</p>
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

// Settings Management Component
export function SettingsManagement({
  currentUser,
  refreshData,
}: {
  currentUser: User
  refreshData: () => void
}) {
  const [username, setUsername] = useState(currentUser.username)
  const [name, setName] = useState(currentUser.name)
  const [email, setEmail] = useState(currentUser.email)
  const [role, setRole] = useState(currentUser.role)
  const [status, setStatus] = useState(currentUser.status)
  const { toast } = useToast()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("id", currentUser.id.toString())
    formData.append("username", username)
    formData.append("name", name)
    formData.append("email", email)
    formData.append("role", role)
    formData.append("status", status)
    formData.append("lastLogin", currentUser.lastLogin)

    const result = await updateUser(formData)
    if (result.success && result.user) {
      toast({
        title: "Profil Diperbarui",
        description: "Informasi profil Anda berhasil diperbarui.",
      })
      await refreshData()
    } else {
      toast({
        title: "Gagal Memperbarui Profil",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold">Pengaturan Akun</h2>
        <p className="text-sm sm:text-base text-gray-600">Kelola informasi profil Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Profil</CardTitle>
          <CardDescription>Perbarui detail akun Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as User["role"])} disabled>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as User["status"])} disabled>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Application Component
export default function HotelInventorySystem() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // States for all main data
  const [users, setUsers] = useState<User[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [depreciations, setDepreciations] = useState<Depreciation[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [logEntries, setLogEntries] = useState<LogEntry[]>([
    {
      id: 1,
      date: "2024-07-15",
      itemId: 1,
      outQuantity: 5,
      inQuantity: 0,
      pendingQuantity: 2,
      returnedQuantity: 0,
    },
    {
      id: 2,
      date: "2024-07-15",
      itemId: 2,
      outQuantity: 3,
      inQuantity: 10,
      pendingQuantity: 0,
      returnedQuantity: 0,
    },
    {
      id: 3,
      date: "2024-07-16",
      itemId: 1,
      outQuantity: 3,
      inQuantity: 0,
      pendingQuantity: 1,
      returnedQuantity: 0,
    },
    {
      id: 4,
      date: "2024-07-16",
      itemId: 4,
      outQuantity: 2,
      inQuantity: 0,
      pendingQuantity: 5,
      returnedQuantity: 0,
    },
    {
      id: 5,
      date: "2024-07-17",
      itemId: 5,
      outQuantity: 4,
      inQuantity: 5,
      pendingQuantity: 0,
      returnedQuantity: 0,
    },
    {
      id: 6,
      date: "2024-07-17",
      itemId: 8,
      outQuantity: 6,
      inQuantity: 2,
      pendingQuantity: 1,
      returnedQuantity: 0,
    },
  ])
  const [notifications, setNotifications] = useState<
    Array<{
      id: number
      title: string
      message: string
      type: "info" | "warning" | "error" | "success"
      timestamp: string
      read: boolean
    }>
  >([])
  const [showNotifications, setShowNotifications] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  // Optimistic updates hooks
  const itemsOptimistic = useOptimisticUpdates<Item>()
  const usersOptimistic = useOptimisticUpdates<User>()
  const suppliersOptimistic = useOptimisticUpdates<Supplier>()
  const transactionsOptimistic = useOptimisticUpdates<Transaction>()
  const categoriesOptimistic = useOptimisticUpdates<Category>()

  // Check for stored user on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setCurrentUser(user)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("currentUser")
      }
    }
    setIsInitialized(true)
  }, [])

  // Function to refresh all data
  const refreshAllData = useCallback(async () => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      const [
        fetchedUsers,
        fetchedItems,
        fetchedSuppliers,
        fetchedTransactions,
        fetchedDepreciations,
        fetchedCategories,
      ] = await Promise.all([
        fetchUsers(),
        fetchItems(),
        fetchSuppliers(),
        fetchTransactions(),
        fetchDepreciations(),
        fetchCategories(),
      ])

      setUsers(fetchedUsers)
      setItems(fetchedItems)
      setSuppliers(fetchedSuppliers)
      setTransactions(fetchedTransactions)
      setDepreciations(fetchedDepreciations)
      setCategories(fetchedCategories)

      router.refresh()
    } catch (error) {
      console.error("Failed to load data:", error)
      toast({
        title: "Gagal Memuat Data",
        description: "Terjadi kesalahan saat memuat data. Mencoba lagi...",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, router, toast])

  // Data sync hook - DISABLED automatic sync
  useDataSync({
    refreshData: refreshAllData,
    intervalMs: 30000, // This won't be used since enabled is false
    enabled: false, // DISABLED automatic data sync
  })

  // Real-time subscriptions - DISABLED for all tables
  useRealtimeData({
    table: "categories",
    enabled: false, // DISABLED automatic real-time updates
    onInsert: (payload) => {
      const newCategory = payload.new as Category
      setCategories((prev) => [...prev, newCategory])
      toast({
        title: "Kategori Baru",
        description: `Kategori "${newCategory.name}" ditambahkan oleh pengguna lain.`,
      })
    },
    onUpdate: (payload) => {
      const updatedCategory = payload.new as Category
      setCategories((prev) => prev.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat)))
      toast({
        title: "Kategori Diperbarui",
        description: `Kategori "${updatedCategory.name}" diperbarui oleh pengguna lain.`,
      })
    },
    onDelete: (payload) => {
      const deletedCategory = payload.old as Category
      setCategories((prev) => prev.filter((cat) => cat.id !== deletedCategory.id))
      toast({
        title: "Kategori Dihapus",
        description: `Kategori "${deletedCategory.name}" dihapus oleh pengguna lain.`,
        variant: "destructive",
      })
    },
  })

  // Real-time subscriptions for suppliers - DISABLED
  useRealtimeData({
    table: "suppliers",
    enabled: false, // DISABLED automatic real-time updates
    onInsert: (payload) => {
      const newSupplier = payload.new as Supplier
      setSuppliers((prev) => [...prev, newSupplier])
      toast({
        title: "Supplier Baru",
        description: `Supplier "${newSupplier.name}" ditambahkan oleh pengguna lain.`,
      })
    },
    onUpdate: (payload) => {
      const updatedSupplier = payload.new as Supplier
      setSuppliers((prev) => prev.map((sup) => (sup.id === updatedSupplier.id ? updatedSupplier : sup)))
      toast({
        title: "Supplier Diperbarui",
        description: `Supplier "${updatedSupplier.name}" diperbarui oleh pengguna lain.`,
      })
    },
    onDelete: (payload) => {
      const deletedSupplier = payload.old as Supplier
      setSuppliers((prev) => prev.filter((sup) => sup.id !== deletedSupplier.id))
      toast({
        title: "Supplier Dihapus",
        description: `Supplier "${deletedSupplier.name}" dihapus oleh pengguna lain.`,
      })
    },
  })

  // Real-time subscriptions for transactions - DISABLED
  useRealtimeData({
    table: "transactions",
    enabled: false, // DISABLED automatic real-time updates
    onInsert: (payload) => {
      const newTransaction = payload.new as Transaction
      setTransactions((prev) => [...prev, newTransaction])
      toast({
        title: "Transaksi Baru",
        description: "Transaksi baru ditambahkan oleh pengguna lain.",
      })
      refreshAllData()
    },
    onUpdate: (payload) => {
      const updatedTransaction = payload.new as Transaction
      setTransactions((prev) => prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)))
      toast({
        title: "Transaksi Diperbarui",
        description: "Transaksi diperbarui oleh pengguna lain.",
      })
      refreshAllData()
    },
    onDelete: (payload) => {
      const deletedTransaction = payload.old as Transaction
      setTransactions((prev) => prev.filter((t) => t.id !== deletedTransaction.id))
      toast({
        title: "Transaksi Dihapus",
        description: "Transaksi dihapus oleh pengguna lain.",
        variant: "destructive",
      })
      refreshAllData()
    },
  })

  // Real-time subscriptions for users (admin only) - DISABLED
  useRealtimeData({
    table: "users",
    enabled: false, // DISABLED automatic real-time updates
    onInsert: (payload) => {
      const newUser = payload.new as User
      setUsers((prev) => [...prev, newUser])
      toast({
        title: "Pengguna Baru",
        description: `Pengguna "${newUser.name}" ditambahkan.`,
      })
    },
    onUpdate: (payload) => {
      const updatedUser = payload.new as User
      setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
      if (currentUser && updatedUser.id === currentUser.id) {
        setCurrentUser(updatedUser)
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      }
      toast({
        title: "Pengguna Diperbarui",
        description: `Pengguna "${updatedUser.name}" diperbarui.`,
      })
    },
    onDelete: (payload) => {
      const deletedUser = payload.old as User
      setUsers((prev) => prev.filter((user) => user.id !== deletedUser.id))
      toast({
        title: "Pengguna Dihapus",
        description: `Pengguna "${deletedUser.name}" dihapus.`,
        variant: "destructive",
      })
    },
  })

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "Koneksi Kembali",
        description: "Anda kembali online. Gunakan tombol refresh untuk memperbarui data.",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "Koneksi Terputus",
        description: "Anda sedang offline. Perubahan akan disimpan saat koneksi kembali.",
        variant: "destructive",
      })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  // Load initial data
  useEffect(() => {
    if (currentUser && isInitialized) {
      refreshAllData()
    }
  }, [currentUser, refreshAllData, isInitialized])

  // Generate notifications
  useEffect(() => {
    if (items.length > 0 && transactions.length > 0) {
      const newNotifications = []
      let notificationId = 1

      const lowStockItems = items.filter((item) => item.currentStock <= item.minStock)
      lowStockItems.forEach((item) => {
        newNotifications.push({
          id: notificationId++,
          title: "Stok Rendah",
          message: `${item.name} memiliki stok rendah (${item.currentStock} ${item.unit})`,
          type: "warning" as const,
          timestamp: new Date().toLocaleString(),
          read: false,
        })
      })

      const pendingTransactions = transactions.filter((t) => t.status === "pending")
      if (pendingTransactions.length > 0) {
        newNotifications.push({
          id: notificationId++,
          title: "Transaksi Pending",
          message: `Ada ${pendingTransactions.length} transaksi yang menunggu persetujuan`,
          type: "info" as const,
          timestamp: new Date().toLocaleString(),
          read: false,
        })
      }

      setNotifications(newNotifications)
    }
  }, [items, transactions])

  const markNotificationAsRead = (notificationId: number) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)))
  }

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showNotifications && !target.closest(".relative")) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showNotifications])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    setCurrentUser(null)
    setCurrentPage("dashboard")
    toast({
      title: "Logout Berhasil",
      description: "Anda telah keluar dari sistem.",
    })
  }

  // Show loading screen while checking for stored user
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#25282A] to-[#25282A]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginForm onLogin={setCurrentUser} />
  }

  const navigationItems = getNavigationItems(currentUser.role)

  // Apply optimistic updates to data
  const optimisticItems = itemsOptimistic.applyOptimisticUpdates(items)
  const optimisticUsers = usersOptimistic.applyOptimisticUpdates(users)
  const optimisticSuppliers = suppliersOptimistic.applyOptimisticUpdates(suppliers)
  const optimisticTransactions = transactionsOptimistic.applyOptimisticUpdates(transactions)
  const optimisticCategories = categoriesOptimistic.applyOptimisticUpdates(categories)

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            user={currentUser}
            items={optimisticItems}
            users={optimisticUsers}
            suppliers={optimisticSuppliers}
            transactions={optimisticTransactions}
            setCurrentPage={setCurrentPage}
            isOnline={isOnline}
            isLoading={isLoading}
          />
        )
      case "items":
        return (
          <ItemsManagement
            user={currentUser}
            items={optimisticItems}
            suppliers={optimisticSuppliers}
            refreshData={refreshAllData}
            categories={optimisticCategories}
            setCurrentPage={setCurrentPage}
            isLoading={isLoading}
          />
        )
      case "users":
        return (
          <UsersManagement
            currentUser={currentUser}
            users={optimisticUsers}
            refreshData={refreshAllData}
            isLoading={isLoading}
          />
        )
      case "categories":
        return (
          <CategoryManagement
            user={currentUser}
            categories={optimisticCategories}
            items={optimisticItems}
            refreshData={refreshAllData}
          />
        )
      case "loog-book":
        return (
          <LoogBookManagement
            user={currentUser}
            items={optimisticItems}
            logEntries={logEntries}
            setLogEntries={setLogEntries}
          />
        )
      case "cost-control":
        return <CostControlManagement user={currentUser} logBookEntries={logEntries} />
      case "invoice":
        return <InvoiceManagement user={currentUser} logEntries={logEntries} items={optimisticItems} />
      case "guest-laundry":
        return <GuestLaundryManagement user={currentUser} />
      case "items-in":
        return (
          <ItemsInManagement
            user={currentUser}
            items={optimisticItems}
            suppliers={optimisticSuppliers}
            transactions={optimisticTransactions}
            refreshData={refreshAllData}
          />
        )
      case "items-out":
        return (
          <ItemsOutManagement
            user={currentUser}
            items={optimisticItems}
            suppliers={optimisticSuppliers}
            transactions={optimisticTransactions}
            refreshData={refreshAllData}
          />
        )
      case "locations":
        return <LocationManagement user={currentUser} items={optimisticItems} refreshData={refreshAllData} />
      case "reports":
        return (
          <ReportsManagement
            user={currentUser}
            items={optimisticItems}
            transactions={optimisticTransactions}
            suppliers={optimisticSuppliers}
            categories={optimisticCategories}
          />
        )
      case "settings":
        return <SettingsManagement currentUser={currentUser} refreshData={refreshAllData} />
      case "depreciation":
        return (
          <DepreciationManagement
            user={currentUser}
            items={optimisticItems}
            depreciations={depreciations}
            refreshData={refreshAllData}
            isLoading={isLoading}
          />
        )
      default:
        return (
          <Dashboard
            user={currentUser}
            items={optimisticItems}
            users={optimisticUsers}
            suppliers={optimisticSuppliers}
            transactions={optimisticTransactions}
            setCurrentPage={setCurrentPage}
            isOnline={isOnline}
            isLoading={isLoading}
          />
        )
    }
  }

  // Helper function to render navigation items recursively
  const renderNavigationItems = (items: ReturnType<typeof getNavigationItems>) => {
    return (
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.key}>
            {item.children ? (
              <Collapsible defaultOpen={currentPage.startsWith(item.key)} className="group/collapsible">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton isActive={currentPage.startsWith(item.key)}>
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                    <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.children.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.key}>
                        {subItem.children ? (
                          <Collapsible defaultOpen={currentPage.startsWith(subItem.key)} className="group/collapsible">
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton isActive={currentPage.startsWith(subItem.key)}>
                                {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                                <span className="truncate">{subItem.title}</span>
                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {subItem.children.map((nestedSubItem) => (
                                  <SidebarMenuSubItem key={nestedSubItem.key}>
                                    <SidebarMenuSubButton
                                      onClick={() => setCurrentPage(nestedSubItem.key)}
                                      isActive={currentPage === nestedSubItem.key}
                                    >
                                      {nestedSubItem.icon && <nestedSubItem.icon className="w-4 h-4 mr-2" />}
                                      <span className="truncate">{nestedSubItem.title}</span>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <SidebarMenuSubButton
                            onClick={() => setCurrentPage(subItem.key)}
                            isActive={currentPage === subItem.key}
                          >
                            {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                            <span className="truncate">{subItem.title}</span>
                          </SidebarMenuSubButton>
                        )}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <SidebarMenuButton onClick={() => setCurrentPage(item.key)} isActive={currentPage === item.key}>
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <Sidebar collapsible="offcanvas" side="left" className="bg-gradient-to-b from-[#25282A] to-[#25282A]">
          <SidebarHeader>
            <div className="flex items-center space-x-3 w-full p-2">
              <div className="w-28 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden p-2 flex-shrink-0">
                <img
                  src="/images/ramayana-logo-new.png"
                  alt="Ramayana Hotel Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white flex-1 leading-tight">
                INVENTARIS
                <br />
                HOUSEKEEPING
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>{renderNavigationItems(navigationItems)}</SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-blue-600 text-white font-semibold">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                  <p className="text-xs text-gray-400">{currentUser.role.toUpperCase()}</p>
                  {isOnline ? (
                    <Wifi className="w-3 h-3 text-green-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-500" />
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-[#F0D58D] hover:text-[#25282A]"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              LOGOUT
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content wrapped in SidebarInset */}
        <SidebarInset>
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="lg:hidden" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate max-w-xs sm:max-w-none">
                      {navigationItems.find((i) => i.key === currentPage)?.title || "Dashboard"}
                    </h1>
                    {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Hotel Management System</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search..." className="pl-10 w-40 lg:w-64" />
                </div>

                {/* Manual Refresh Button */}
                <Button variant="ghost" size="icon" onClick={refreshAllData} disabled={isLoading} title="Refresh Data">
                  <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                </Button>

                {/* Notification Dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.filter((n) => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.filter((n) => !n.read).length}
                      </span>
                    )}
                  </Button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                        {notifications.filter((n) => !n.read).length > 0 && (
                          <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead} className="text-xs">
                            Tandai Semua Dibaca
                          </Button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>Tidak ada notifikasi</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                                !notification.read ? "bg-blue-50" : ""
                              }`}
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    notification.type === "error"
                                      ? "bg-red-500"
                                      : notification.type === "warning"
                                        ? "bg-yellow-500"
                                        : notification.type === "success"
                                          ? "bg-green-500"
                                          : "bg-blue-500"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p
                                      className={`text-sm font-medium ${
                                        !notification.read ? "text-gray-900" : "text-gray-600"
                                      }`}
                                    >
                                      {notification.title}
                                    </p>
                                    <p
                                      className={`text-sm mt-1 ${!notification.read ? "text-gray-700" : "text-gray-500"}`}
                                    >
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{notification.timestamp}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => setShowNotifications(false)}
                          >
                            Tutup Notifikasi
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Badge variant="secondary" className="hidden sm:inline-flex bg-green-100 text-green-800">
                  {currentUser.role.toUpperCase()}
                </Badge>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 sm:p-6">{renderCurrentPage()}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
