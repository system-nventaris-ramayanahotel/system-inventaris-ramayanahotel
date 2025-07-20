"use client"

import { useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"

interface UseRealtimeDataProps {
  table: string
  enabled: boolean
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
}

export function useRealtimeData({ table, enabled, onInsert, onUpdate, onDelete }: UseRealtimeDataProps) {
  useEffect(() => {
    if (!enabled) return

    const supabase = getSupabaseClient()

    // Check if we have a real Supabase connection
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("fallback")) {
      console.log(`Real-time disabled for table: ${table} (no Supabase connection)`)
      return
    }

    console.log(`Setting up real-time subscription for table: ${table}`)

    const channel = supabase
      .channel(`public:${table}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: table,
        },
        (payload) => {
          console.log(`Insert received for ${table}:`, payload)
          onInsert?.(payload)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: table,
        },
        (payload) => {
          console.log(`Update received for ${table}:`, payload)
          onUpdate?.(payload)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: table,
        },
        (payload) => {
          console.log(`Delete received for ${table}:`, payload)
          onDelete?.(payload)
        },
      )
      .subscribe()

    // Cleanup function
    return () => {
      console.log(`Cleaning up real-time subscription for table: ${table}`)
      supabase.removeChannel(channel)
    }
  }, [table, enabled, onInsert, onUpdate, onDelete])
}
