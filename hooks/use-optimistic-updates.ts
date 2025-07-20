"use client"

import { useState, useCallback } from "react"

export function useOptimisticUpdates<T extends { id: number }>() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<number, T>>(new Map())

  const addOptimisticUpdate = useCallback((item: T) => {
    setOptimisticUpdates((prev) => new Map(prev).set(item.id, item))
  }, [])

  const removeOptimisticUpdate = useCallback((id: number) => {
    setOptimisticUpdates((prev) => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }, [])

  const applyOptimisticUpdates = useCallback(
    (items: T[]): T[] => {
      if (optimisticUpdates.size === 0) return items

      return items.map((item) => {
        const optimisticUpdate = optimisticUpdates.get(item.id)
        return optimisticUpdate || item
      })
    },
    [optimisticUpdates],
  )

  return {
    addOptimisticUpdate,
    removeOptimisticUpdate,
    applyOptimisticUpdates,
  }
}
