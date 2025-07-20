import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("depreciations").select("*").order("date", { ascending: false })

    if (error) {
      console.error("Error fetching depreciations:", error)
      return NextResponse.json({ error: "Failed to fetch depreciations" }, { status: 500 })
    }

    // Transform data to match frontend format
    const transformedData =
      data?.map((depreciation: any) => ({
        id: depreciation.id,
        itemId: depreciation.item_id,
        quantity: depreciation.quantity,
        date: depreciation.date || depreciation.created_at,
        reason: depreciation.reason || "",
        userId: depreciation.user_id,
        status: depreciation.status,
      })) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error fetching depreciations:", error)
    return NextResponse.json({ error: "Failed to fetch depreciations" }, { status: 500 })
  }
}
