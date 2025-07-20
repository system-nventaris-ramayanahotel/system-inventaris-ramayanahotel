// Mock database functions for development
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

export interface Category {
  id: number
  code: string
  name: string
  description: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

// Mock data
const mockUsers: User[] = [
  {
    id: 1,
    username: "Bas",
    name: "Bas",
    email: "bas@example.com",
    role: "admin",
    status: "active",
    lastLogin: "2024-01-20",
  },
  {
    id: 2,
    username: "Kiswanto",
    name: "Kiswanto",
    email: "kiswanto@example.com",
    role: "manager",
    status: "active",
    lastLogin: "2024-01-19",
  },
  {
    id: 3,
    username: "hkcrew",
    name: "HK Crew",
    email: "hkcrew@example.com",
    role: "staff",
    status: "active",
    lastLogin: "2024-01-18",
  },
]

const mockItems: Item[] = [
  {
    id: 1,
    code: "ITM001",
    name: "Bed Sheet Queen",
    category: "Linen",
    description: "White cotton bed sheet for queen size bed",
    unit: "pcs",
    minStock: 10,
    currentStock: 25,
    location: "Warehouse A",
    supplierId: 1,
    price: 150000,
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 2,
    code: "ITM002",
    name: "Bath Towel",
    category: "Linen",
    description: "White cotton bath towel",
    unit: "pcs",
    minStock: 20,
    currentStock: 45,
    location: "Warehouse A",
    supplierId: 1,
    price: 75000,
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 3,
    code: "ITM003",
    name: "All Purpose Cleaner",
    category: "Cleaning Supplies",
    description: "Multi-surface cleaning solution",
    unit: "bottle",
    minStock: 5,
    currentStock: 3,
    location: "Storage Room",
    supplierId: 2,
    price: 25000,
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 4,
    code: "ITM004",
    name: "Shampoo",
    category: "Amenities",
    description: "Guest room shampoo bottles",
    unit: "bottle",
    minStock: 50,
    currentStock: 75,
    location: "Amenities Storage",
    supplierId: 1,
    price: 15000,
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 5,
    code: "ITM005",
    name: "Pillow Case",
    category: "Linen",
    description: "White cotton pillow case",
    unit: "pcs",
    minStock: 30,
    currentStock: 60,
    location: "Warehouse A",
    supplierId: 1,
    price: 35000,
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 6,
    code: "ITM006",
    name: "Hand Towel",
    category: "Linen",
    description: "Small white cotton hand towel",
    unit: "pcs",
    minStock: 25,
    currentStock: 40,
    location: "Warehouse A",
    supplierId: 1,
    price: 45000,
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 7,
    code: "ITM007",
    name: "Toilet Paper",
    category: "Amenities",
    description: "2-ply toilet paper rolls",
    unit: "roll",
    minStock: 100,
    currentStock: 150,
    location: "Amenities Storage",
    supplierId: 2,
    price: 8000,
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 8,
    code: "ITM008",
    name: "Laundry Detergent",
    category: "Cleaning Supplies",
    description: "Industrial laundry detergent powder",
    unit: "kg",
    minStock: 10,
    currentStock: 25,
    location: "Laundry Room",
    supplierId: 2,
    price: 45000,
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
]

const mockCategories: Category[] = [
  {
    id: 1,
    code: "LIN",
    name: "Linen",
    description: "Bed sheets, towels, and other linens",
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 2,
    code: "CLN",
    name: "Cleaning Supplies",
    description: "Detergents, soaps, and cleaning equipment",
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 3,
    code: "AMN",
    name: "Amenities",
    description: "Guest amenities and toiletries",
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
]

// Export functions
export async function dbFetchUsers(): Promise<User[]> {
  return mockUsers
}

export async function dbFetchItems(): Promise<Item[]> {
  return mockItems
}

export async function dbFetchCategories(): Promise<Category[]> {
  return mockCategories
}
