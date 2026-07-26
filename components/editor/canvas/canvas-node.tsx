"use client"

import { Handle, Position } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"
import type { CanvasNode } from "@/types/canvas"
import { NODE_COLORS } from "@/types/canvas"

const DEFAULT_FILL = NODE_COLORS[0].fill
const DEFAULT_TEXT = NODE_COLORS[0].text

export function CanvasNodeComponent({ data, selected }: NodeProps<CanvasNode>) {
  const fill = data.color ?? DEFAULT_FILL
  const textColor = DEFAULT_TEXT

  return (
    <div
      style={{ background: fill, color: textColor, width: "100%", height: "100%" }}
      className="flex items-center justify-center rounded-xl border border-white/10 text-sm font-medium"
      data-selected={selected}
    >
      <span className="truncate px-3">{data.label}</span>

      <Handle type="target" position={Position.Top} className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-bg-base !bg-white opacity-0 transition-opacity group-hover/node:opacity-100" />
      <Handle type="source" position={Position.Bottom} className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-bg-base !bg-white opacity-0 transition-opacity group-hover/node:opacity-100" />
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-bg-base !bg-white opacity-0 transition-opacity group-hover/node:opacity-100" />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-bg-base !bg-white opacity-0 transition-opacity group-hover/node:opacity-100" />
    </div>
  )
}
