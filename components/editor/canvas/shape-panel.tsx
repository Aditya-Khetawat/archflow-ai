"use client"

import { Panel } from "@xyflow/react"
import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { NODE_SHAPES, SHAPE_DEFAULTS, type NodeShape } from "@/types/canvas"

const SHAPE_ICONS: Record<NodeShape, LucideIcon> = {
  rectangle: RectangleHorizontal,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Cylinder,
  hexagon: Hexagon,
}

export function ShapePanel() {
  function handleDragStart(event: React.DragEvent, shape: NodeShape) {
    const payload = JSON.stringify({ shape, size: SHAPE_DEFAULTS[shape] })
    event.dataTransfer.setData("application/ghost-shape", payload)
    event.dataTransfer.effectAllowed = "copy"
  }

  return (
    <Panel position="bottom-center" className="mb-4">
      <div className="flex items-center gap-1 rounded-full border border-border-default bg-bg-surface/95 px-3 py-2 shadow-xl backdrop-blur-xl">
        {NODE_SHAPES.map((shape) => {
          const Icon = SHAPE_ICONS[shape]
          return (
            <button
              key={shape}
              draggable
              onDragStart={(e) => handleDragStart(e, shape)}
              title={shape}
              className="flex h-8 w-8 cursor-grab items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary active:cursor-grabbing"
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
