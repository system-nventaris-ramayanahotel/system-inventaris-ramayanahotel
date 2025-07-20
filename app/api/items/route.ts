import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
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
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
    }

    // Transform data to match frontend format
    const transformedData =
      data?.map((item: any) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        category: item.categories?.name || "Unknown",
        description: item.description || "",
        unit: item.unit,
        minStock: item.min_stock,
        currentStock: item.current_stock,
        location: item.location,
        supplierId: item.supplier_id,
        price: Number.parseFloat(item.price) || 0,
        status: item.status,
        createdAt: item.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        updatedAt: item.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        imageUrl: item.image_url,
      })) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}
