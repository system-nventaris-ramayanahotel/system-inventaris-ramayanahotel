import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("suppliers").select("*").order("id", { ascending: true })

    if (error) {
      console.error("Error fetching suppliers:", error)
      return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 })
    }

    // Transform data to match frontend format
    const transformedData =
      data?.map((supplier: any) => ({
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        contact: supplier.contact || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        status: supplier.status,
        createdAt: supplier.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      })) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 })
  }
}
