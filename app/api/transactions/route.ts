import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false })

    if (error) {
      console.error("Error fetching transactions:", error)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    // Transform data to match frontend format
    const transformedData =
      data?.map((transaction: any) => ({
        id: transaction.id,
        type: transaction.type,
        itemId: transaction.item_id,
        quantity: transaction.quantity,
        userId: transaction.user_id,
        supplierId: transaction.supplier_id,
        borrowerId: transaction.borrower_id,
        notes: transaction.notes || "",
        status: transaction.status,
        date: transaction.date || transaction.created_at,
        dueDate: transaction.due_date,
        returnDate: transaction.return_date,
      })) || []

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
