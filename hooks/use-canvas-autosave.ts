"use client"

import { useEffect, useRef, useState } from "react"
import type { CanvasNode, CanvasEdge } from "@/types/canvas"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

export function useCanvasAutosave(
  projectId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)
  const hasMountedRef = useRef(false)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    // Skip saving on the initial render before any user/collaboration changes.
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return
      setStatus("saving")
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        })
        if (!isMountedRef.current) return
        setStatus(res.ok ? "saved" : "error")
      } catch {
        if (isMountedRef.current) setStatus("error")
      }
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges])

  return status
}
