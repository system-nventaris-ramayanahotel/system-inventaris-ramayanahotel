"use client"

import { useEffect, useRef } from "react"

interface DataSyncOptions {
  refreshData: () => Promise<void>
  intervalMs: number
  enabled: boolean
}

export function useDataSync({ refreshData, intervalMs, enabled }: DataSyncOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Disable automatic sync - only manual refresh will work
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Only sync when tab becomes visible (manual trigger)
    const handleVisibilityChange = () => {
      if (!document.hidden && enabled) {
        refreshData().catch(console.error)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshData, intervalMs, enabled])
}
