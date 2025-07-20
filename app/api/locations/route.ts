import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("locations").select("*").order("id", { ascending: true })

    if (error) {
      console.error("Error fetching locations:", error)
      return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Basic validation
    if (!body.name) {
      return NextResponse.json({ error: "Location name is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("locations")
      .insert({
        name: body.name,
        description: body.description || "",
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating location:", error)
      if (error.code === "23505") {
        return NextResponse.json({ error: "Location name already exists" }, { status: 400 })
      }
      return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
