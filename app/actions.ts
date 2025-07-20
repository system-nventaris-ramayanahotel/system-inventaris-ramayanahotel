"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase"

// Types
interface User {
  id: number
  username: string
  name: string
  email: string
  role: "admin" | "manager" | "staff"
  status: "active" | "inactive"
  lastLogin: string
  avatarUrl?: string
}

interface Item {
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

interface Supplier {
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

interface Transaction {
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

interface Depreciation {
  id: number
  itemId: number
  quantity: number
  date: string
  reason: string
  userId: number
  status: "completed" | "pending"
}

interface Category {
  id: number
  code: string
  name: string
  description: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

// Helper function to transform database row to frontend format
function transformUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    lastLogin: row.last_login || new Date().toISOString().split("T")[0],
    avatarUrl: row.avatar_url,
  }
}

function transformItem(row: any): Item {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.categories?.name || row.category || "Unknown",
    description: row.description || "",
    unit: row.unit,
    minStock: row.min_stock,
    currentStock: row.current_stock,
    location: row.location,
    supplierId: row.supplier_id,
    price: Number.parseFloat(row.price) || 0,
    status: row.status,
    createdAt: row.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    updatedAt: row.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    imageUrl: row.image_url,
  }
}

function transformSupplier(row: any): Supplier {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    contact: row.contact || "",
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || "",
    status: row.status,
    createdAt: row.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
  }
}

function transformTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type,
    itemId: row.item_id,
    quantity: row.quantity,
    userId: row.user_id,
    supplierId: row.supplier_id,
    borrowerId: row.borrower_id,
    notes: row.notes || "",
    status: row.status,
    date: row.date || row.created_at,
    dueDate: row.due_date,
    returnDate: row.return_date,
  }
}

function transformDepreciation(row: any): Depreciation {
  return {
    id: row.id,
    itemId: row.item_id,
    quantity: row.quantity,
    date: row.date || row.created_at,
    reason: row.reason || "",
    userId: row.user_id,
    status: row.status,
  }
}

function transformCategory(row: any): Category {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || "",
    status: row.status,
    createdAt: row.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    updatedAt: row.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
  }
}

// User Actions
export async function fetchUsers(): Promise<User[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("users").select("*").order("id", { ascending: true })

    if (error) {
      console.error("Error fetching users:", error)
      return []
    }

    return data?.map(transformUser) || []
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function createUser(formData: FormData) {
  try {
    const supabase = createServerClient()
    const username = formData.get("username") as string
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as "admin" | "manager" | "staff"

    // Basic validation
    if (!username || !name || !email || !role) {
      return { success: false, message: "Semua field harus diisi" }
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        username,
        name,
        email,
        role,
        status: "active",
        last_login: new Date().toISOString().split("T")[0],
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating user:", error)
      if (error.code === "23505") {
        return { success: false, message: "Username atau email sudah digunakan" }
      }
      return { success: false, message: "Gagal menambahkan pengguna" }
    }

    revalidatePath("/")
    return { success: true, message: "Pengguna berhasil ditambahkan", user: transformUser(data) }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, message: "Gagal menambahkan pengguna" }
  }
}

export async function updateUser(formData: FormData) {
  try {
    const supabase = createServerClient()
    const id = Number.parseInt(formData.get("id") as string)
    const username = formData.get("username") as string
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as "admin" | "manager" | "staff"
    const status = formData.get("status") as "active" | "inactive"

    const { data, error } = await supabase
      .from("users")
      .update({
        username,
        name,
        email,
        role,
        status,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      if (error.code === "23505") {
        return { success: false, message: "Username atau email sudah digunakan" }
      }
      return { success: false, message: "Gagal memperbarui pengguna" }
    }

    revalidatePath("/")
    return { success: true, message: "Pengguna berhasil diperbarui", user: transformUser(data) }
  } catch (error) {
    console.error("Error updating user:", error)
    return { success: false, message: "Gagal memperbarui pengguna" }
  }
}

export async function deleteUser(id: number) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      console.error("Error deleting user:", error)
      return { success: false, message: "Gagal menghapus pengguna" }
    }

    revalidatePath("/")
    return { success: true, message: "Pengguna berhasil dihapus" }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, message: "Gagal menghapus pengguna" }
  }
}

// Item Actions
export async function fetchItems(): Promise<Item[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("items")
      .select(`
        *,
        categories (
          id,
          name,
          code
        )
      `)
      .order("id", { ascending: true })

    if (error) {
      console.error("Error fetching items:", error)
      return []
    }

    return data?.map(transformItem) || []
  } catch (error) {
    console.error("Error fetching items:", error)
    return []
  }
}

export async function createItem(formData: FormData, imageUrl?: string) {
  try {
    const supabase = createServerClient()
    const code = formData.get("code") as string
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const unit = formData.get("unit") as string
    const minStock = Number.parseInt(formData.get("minStock") as string)
    const currentStock = Number.parseInt(formData.get("currentStock") as string)
    const location = formData.get("location") as string
    const supplierId = Number.parseInt(formData.get("supplierId") as string)
    const price = Number.parseInt(formData.get("price") as string)

    if (
      !code ||
      !name ||
      !category ||
      !unit ||
      isNaN(minStock) ||
      isNaN(currentStock) ||
      !location ||
      isNaN(supplierId) ||
      isNaN(price)
    ) {
      return { success: false, message: "Semua field harus diisi dengan benar" }
    }

    // Get category ID
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", category)
      .single()

    if (categoryError || !categoryData) {
      return { success: false, message: "Kategori tidak ditemukan" }
    }

    const { data, error } = await supabase
      .from("items")
      .insert({
        code,
        name,
        category_id: categoryData.id,
        description: description || "",
        unit,
        min_stock: minStock,
        current_stock: currentStock,
        location,
        supplier_id: supplierId,
        price,
        status: "active",
        image_url: imageUrl,
      })
      .select(`
        *,
        categories (
          id,
          name,
          code
        )
      `)
      .single()

    if (error) {
      console.error("Error creating item:", error)
      if (error.code === "23505") {
        return { success: false, message: "Kode barang sudah digunakan" }
      }
      return { success: false, message: "Gagal menambahkan barang" }
    }

    revalidatePath("/")
    return { success: true, message: "Barang berhasil ditambahkan", item: transformItem(data) }
  } catch (error) {
    console.error("Error creating item:", error)
    return { success: false, message: "Gagal menambahkan barang" }
  }
}

export async function updateItem(formData: FormData, imageUrl?: string) {
  try {
    const supabase = createServerClient()
    const id = Number.parseInt(formData.get("id") as string)
    const code = formData.get("code") as string
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const description = formData.get("description") as string
    const unit = formData.get("unit") as string
    const minStock = Number.parseInt(formData.get("minStock") as string)
    const currentStock = Number.parseInt(formData.get("currentStock") as string)
    const location = formData.get("location") as string
    const supplierId = Number.parseInt(formData.get("supplierId") as string)
    const price = Number.parseInt(formData.get("price") as string)
    const status = formData.get("status") as "active" | "inactive"

    // Get category ID
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", category)
      .single()

    if (categoryError || !categoryData) {
      return { success: false, message: "Kategori tidak ditemukan" }
    }

    const updateData: any = {
      code,
      name,
      category_id: categoryData.id,
      description: description || "",
      unit,
      min_stock: minStock,
      current_stock: currentStock,
      location,
      supplier_id: supplierId,
      price,
      status,
    }

    if (imageUrl) {
      updateData.image_url = imageUrl
    }

    const { data, error } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        categories (
          id,
          name,
          code
        )
      `)
      .single()

    if (error) {
      console.error("Error updating item:", error)
      if (error.code === "23505") {
        return { success: false, message: "Kode barang sudah digunakan" }
      }
      return { success: false, message: "Gagal memperbarui barang" }
    }

    revalidatePath("/")
    return { success: true, message: "Barang berhasil diperbarui", item: transformItem(data) }
  } catch (error) {
    console.error("Error updating item:", error)
    return { success: false, message: "Gagal memperbarui barang" }
  }
}

export async function deleteItem(id: number) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase.from("items").delete().eq("id", id)

    if (error) {
      console.error("Error deleting item:", error)
      return { success: false, message: "Gagal menghapus barang" }
    }

    revalidatePath("/")
    return { success: true, message: "Barang berhasil dihapus" }
  } catch (error) {
    console.error("Error deleting item:", error)
    return { success: false, message: "Gagal menghapus barang" }
  }
}

// Supplier Actions
export async function fetchSuppliers(): Promise<Supplier[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("suppliers").select("*").order("id", { ascending: true })

    if (error) {
      console.error("Error fetching suppliers:", error)
      return []
    }

    return data?.map(transformSupplier) || []
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return []
  }
}

// Transaction Actions
export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false })

    if (error) {
      console.error("Error fetching transactions:", error)
      return []
    }

    return data?.map(transformTransaction) || []
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return []
  }
}

export async function createTransaction(formData: FormData, userId: number) {
  try {
    const supabase = createServerClient()
    const type = formData.get("type") as "in" | "out" | "borrow" | "return"
    const itemId = Number(formData.get("itemId"))
    const quantity = Number(formData.get("quantity"))
    const supplierId = formData.get("supplierId") ? Number(formData.get("supplierId")) : undefined
    const borrowerId = formData.get("borrowerId") as string | undefined
    const notes = (formData.get("notes") as string) ?? ""

    if (!itemId || isNaN(quantity) || quantity <= 0 || !type) {
      return { success: false, message: "Data transaksi tidak valid." }
    }

    // Start transaction
    const { data: transactionData, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        type,
        item_id: itemId,
        quantity,
        user_id: userId,
        supplier_id: supplierId,
        borrower_id: borrowerId,
        notes,
        status: "completed",
        date: new Date().toISOString(),
      })
      .select()
      .single()

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      return { success: false, message: "Gagal menambahkan transaksi." }
    }

    // Update item stock
    const stockChange = type === "in" || type === "return" ? quantity : -quantity
    const { error: stockError } = await supabase.rpc("update_item_stock", {
      item_id: itemId,
      stock_change: stockChange,
    })

    if (stockError) {
      console.error("Error updating stock:", stockError)
      // If stock update fails, we should rollback the transaction
      await supabase.from("transactions").delete().eq("id", transactionData.id)
      return { success: false, message: "Gagal memperbarui stok barang." }
    }

    revalidatePath("/")
    return {
      success: true,
      transaction: transformTransaction(transactionData),
      message: "Transaksi berhasil ditambahkan.",
    }
  } catch (error) {
    console.error("Error creating transaction:", error)
    return { success: false, message: "Gagal menambahkan transaksi." }
  }
}

export async function updateTransaction(formData: FormData) {
  try {
    const supabase = createServerClient()
    const id = Number(formData.get("id"))
    const type = formData.get("type") as "in" | "out" | "borrow" | "return"
    const itemId = Number(formData.get("itemId"))
    const quantity = Number(formData.get("quantity"))
    const supplierId = formData.get("supplierId") ? Number(formData.get("supplierId")) : undefined
    const borrowerId = formData.get("borrowerId") as string | undefined
    const notes = (formData.get("notes") as string) ?? ""
    const status = formData.get("status") as "pending" | "approved" | "completed" | "cancelled"

    // Get old transaction to revert stock changes
    const { data: oldTransaction, error: oldError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single()

    if (oldError || !oldTransaction) {
      return { success: false, message: "Transaksi tidak ditemukan." }
    }

    // Revert old stock change
    const oldStockChange =
      oldTransaction.type === "in" || oldTransaction.type === "return"
        ? -oldTransaction.quantity
        : oldTransaction.quantity

    await supabase.rpc("update_item_stock", {
      item_id: oldTransaction.item_id,
      stock_change: oldStockChange,
    })

    // Update transaction
    const { data, error } = await supabase
      .from("transactions")
      .update({
        type,
        item_id: itemId,
        quantity,
        supplier_id: supplierId,
        borrower_id: borrowerId,
        notes,
        status,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating transaction:", error)
      return { success: false, message: "Gagal memperbarui transaksi." }
    }

    // Apply new stock change
    const newStockChange = type === "in" || type === "return" ? quantity : -quantity
    await supabase.rpc("update_item_stock", {
      item_id: itemId,
      stock_change: newStockChange,
    })

    revalidatePath("/")
    return {
      success: true,
      transaction: transformTransaction(data),
      message: "Transaksi berhasil diperbarui.",
    }
  } catch (error) {
    console.error("Error updating transaction:", error)
    return { success: false, message: "Gagal memperbarui transaksi." }
  }
}

export async function deleteTransaction(id: number) {
  try {
    const supabase = createServerClient()

    // Get transaction to revert stock changes
    const { data: transaction, error: getError } = await supabase.from("transactions").select("*").eq("id", id).single()

    if (getError || !transaction) {
      return { success: false, message: "Transaksi tidak ditemukan." }
    }

    // Revert stock change
    const stockChange =
      transaction.type === "in" || transaction.type === "return" ? -transaction.quantity : transaction.quantity

    await supabase.rpc("update_item_stock", {
      item_id: transaction.item_id,
      stock_change: stockChange,
    })

    // Delete transaction
    const { error } = await supabase.from("transactions").delete().eq("id", id)

    if (error) {
      console.error("Error deleting transaction:", error)
      return { success: false, message: "Gagal menghapus transaksi." }
    }

    revalidatePath("/")
    return { success: true, message: "Transaksi berhasil dihapus." }
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return { success: false, message: "Gagal menghapus transaksi." }
  }
}

// Depreciation Actions
export async function fetchDepreciations(): Promise<Depreciation[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("depreciations").select("*").order("date", { ascending: false })

    if (error) {
      console.error("Error fetching depreciations:", error)
      return []
    }

    return data?.map(transformDepreciation) || []
  } catch (error) {
    console.error("Error fetching depreciations:", error)
    return []
  }
}

export async function createDepreciation(formData: FormData, userId: number) {
  try {
    const supabase = createServerClient()
    const itemId = Number(formData.get("itemId"))
    const quantity = Number(formData.get("quantity"))
    const reason = (formData.get("reason") as string) ?? ""

    if (!itemId || isNaN(quantity) || quantity <= 0) {
      return { success: false, message: "Data penyusutan tidak valid." }
    }

    // Check current stock
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("current_stock")
      .eq("id", itemId)
      .single()

    if (itemError || !item) {
      return { success: false, message: "Barang tidak ditemukan." }
    }

    if (item.current_stock < quantity) {
      return { success: false, message: "Stok tidak mencukupi." }
    }

    // Create depreciation record
    const { data, error } = await supabase
      .from("depreciations")
      .insert({
        item_id: itemId,
        quantity,
        reason,
        user_id: userId,
        status: "completed",
        date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating depreciation:", error)
      return { success: false, message: "Gagal menambahkan penyusutan." }
    }

    // Update item stock
    await supabase.rpc("update_item_stock", {
      item_id: itemId,
      stock_change: -quantity,
    })

    revalidatePath("/")
    return {
      success: true,
      depreciation: transformDepreciation(data),
      message: "Penyusutan berhasil ditambahkan.",
    }
  } catch (error) {
    console.error("Error creating depreciation:", error)
    return { success: false, message: "Gagal menambahkan penyusutan." }
  }
}

export async function updateDepreciation(formData: FormData) {
  try {
    const supabase = createServerClient()
    const id = Number(formData.get("id"))
    const itemId = Number(formData.get("itemId"))
    const quantity = Number(formData.get("quantity"))
    const reason = (formData.get("reason") as string) ?? ""
    const status = (formData.get("status") as "completed" | "pending") ?? "completed"

    // Get old depreciation to revert stock changes
    const { data: oldDepreciation, error: oldError } = await supabase
      .from("depreciations")
      .select("*")
      .eq("id", id)
      .single()

    if (oldError || !oldDepreciation) {
      return { success: false, message: "Penyusutan tidak ditemukan." }
    }

    // Revert old stock change
    await supabase.rpc("update_item_stock", {
      item_id: oldDepreciation.item_id,
      stock_change: oldDepreciation.quantity,
    })

    // Update depreciation
    const { data, error } = await supabase
      .from("depreciations")
      .update({
        item_id: itemId,
        quantity,
        reason,
        status,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating depreciation:", error)
      return { success: false, message: "Gagal memperbarui penyusutan." }
    }

    // Apply new stock change
    await supabase.rpc("update_item_stock", {
      item_id: itemId,
      stock_change: -quantity,
    })

    revalidatePath("/")
    return {
      success: true,
      depreciation: transformDepreciation(data),
      message: "Penyusutan berhasil diperbarui.",
    }
  } catch (error) {
    console.error("Error updating depreciation:", error)
    return { success: false, message: "Gagal memperbarui penyusutan." }
  }
}

export async function deleteDepreciation(id: number) {
  try {
    const supabase = createServerClient()

    // Get depreciation to revert stock changes
    const { data: depreciation, error: getError } = await supabase
      .from("depreciations")
      .select("*")
      .eq("id", id)
      .single()

    if (getError || !depreciation) {
      return { success: false, message: "Penyusutan tidak ditemukan." }
    }

    // Revert stock change
    await supabase.rpc("update_item_stock", {
      item_id: depreciation.item_id,
      stock_change: depreciation.quantity,
    })

    // Delete depreciation
    const { error } = await supabase.from("depreciations").delete().eq("id", id)

    if (error) {
      console.error("Error deleting depreciation:", error)
      return { success: false, message: "Gagal menghapus penyusutan." }
    }

    revalidatePath("/")
    return { success: true, message: "Penyusutan berhasil dihapus." }
  } catch (error) {
    console.error("Error deleting depreciation:", error)
    return { success: false, message: "Gagal menghapus penyusutan." }
  }
}

// Category Actions
export async function fetchCategories(): Promise<Category[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("categories").select("*").order("id", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    return data?.map(transformCategory) || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function createCategory(formData: FormData) {
  try {
    const supabase = createServerClient()
    const code = (formData.get("code") as string)?.trim().toUpperCase()
    const name = (formData.get("name") as string)?.trim()
    const description = (formData.get("description") as string | null)?.trim() ?? ""

    if (!code || !name) {
      return { success: false, message: "Kode dan nama kategori wajib diisi." }
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        code,
        name,
        description,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating category:", error)
      if (error.code === "23505") {
        return { success: false, message: "Kode atau nama kategori sudah digunakan." }
      }
      return { success: false, message: "Gagal menambahkan kategori." }
    }

    revalidatePath("/")
    return { success: true, message: "Kategori berhasil ditambahkan.", category: transformCategory(data) }
  } catch (error) {
    console.error("Error creating category:", error)
    return { success: false, message: "Gagal menambahkan kategori." }
  }
}

export async function updateCategory(formData: FormData) {
  try {
    const supabase = createServerClient()
    const id = Number(formData.get("id"))
    const code = (formData.get("code") as string)?.trim().toUpperCase()
    const name = (formData.get("name") as string)?.trim()
    const description = (formData.get("description") as string | null)?.trim() ?? ""
    const status = (formData.get("status") as "active" | "inactive") ?? "active"

    const { data, error } = await supabase
      .from("categories")
      .update({
        code,
        name,
        description,
        status,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating category:", error)
      if (error.code === "23505") {
        return { success: false, message: "Kode atau nama kategori sudah digunakan." }
      }
      return { success: false, message: "Gagal memperbarui kategori." }
    }

    revalidatePath("/")
    return { success: true, message: "Kategori berhasil diperbarui.", category: transformCategory(data) }
  } catch (error) {
    console.error("Error updating category:", error)
    return { success: false, message: "Gagal memperbarui kategori." }
  }
}

export async function deleteCategory(id: number) {
  try {
    const supabase = createServerClient()

    // Check if category is used by any items
    const { data: items, error: itemsError } = await supabase.from("items").select("id").eq("category_id", id).limit(1)

    if (itemsError) {
      console.error("Error checking category usage:", itemsError)
      return { success: false, message: "Gagal memeriksa penggunaan kategori." }
    }

    if (items && items.length > 0) {
      return {
        success: false,
        message: "Tidak dapat menghapus kategori yang masih dipakai oleh barang.",
      }
    }

    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      console.error("Error deleting category:", error)
      return { success: false, message: "Gagal menghapus kategori." }
    }

    revalidatePath("/")
    return { success: true, message: "Kategori berhasil dihapus." }
  } catch (error) {
    console.error("Error deleting category:", error)
    return { success: false, message: "Gagal menghapus kategori." }
  }
}
