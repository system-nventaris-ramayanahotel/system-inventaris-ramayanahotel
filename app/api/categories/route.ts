import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("categories").select("*").order("id", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    // Transform data to match frontend format
    const transformedData =
      data?.map((category: any) => ({
        id: category.id,
        code: category.code,
        name: category.name,
        description: category.description || "",
        status: category.status,
        createdAt: category.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        updatedAt: category.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      })) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Basic validation
    if (!body.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        code: body.code || body.name.substring(0, 3).toUpperCase(),
        name: body.name,
        description: body.description || "",
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating category:", error)
      if (error.code === "23505") {
        return NextResponse.json({ error: "Category code or name already exists" }, { status: 400 })
      }
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
    }

    // Transform response to match frontend format
    const transformedData = {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description || "",
      status: data.status,
      createdAt: data.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      updatedAt: data.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    }

    return NextResponse.json(transformedData, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
