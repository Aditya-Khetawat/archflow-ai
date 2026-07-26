"use client"

import { useCallback, useRef } from "react"
import { ReactFlow, Background, BackgroundVariant, MiniMap, ConnectionMode } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useReactFlow } from "@xyflow/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useMutation } from "@liveblocks/react"
import { LiveObject } from "@liveblocks/client"
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas"
import { NODE_COLORS } from "@/types/canvas"
import { CanvasNodeComponent } from "@/components/editor/canvas/canvas-node"
import { ShapePanel } from "@/components/editor/canvas/shape-panel"
import type { LiveblocksNode } from "@liveblocks/react-flow"

const nodeTypes = { canvasNode: CanvasNodeComponent }
const edgeTypes = {}

let nodeCounter = 0

function generateNodeId(shape: string): string {
  return `${shape}-${Date.now()}-${++nodeCounter}`
}

export function CanvasEditor() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true })

  const { screenToFlowPosition } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const addNode = useMutation(({ storage }, newNode: CanvasNode) => {
    const liveNode = new LiveObject({
      id: newNode.id,
      type: newNode.type,
      position: newNode.position,
      data: new LiveObject({
        label: newNode.data.label,
        color: newNode.data.color,
        shape: newNode.data.shape,
      }),
      width: newNode.width,
      height: newNode.height,
    })
    storage.get("nodes").set(newNode.id, liveNode as unknown as LiveblocksNode<CanvasNode>)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const raw = event.dataTransfer.getData("application/ghost-shape")
      if (!raw) return

      let payload: { shape: NodeShape; size: { width: number; height: number } }
      try {
        payload = JSON.parse(raw)
      } catch {
        return
      }

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })

      const id = generateNodeId(payload.shape)
      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position,
        data: { label: "", color: NODE_COLORS[0].fill, shape: payload.shape },
        width: payload.size.width,
        height: payload.size.height,
      }

      addNode(newNode)
    },
    [screenToFlowPosition, addNode]
  )

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-bg-base"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="var(--color-border-subtle)"
        />
        <MiniMap
          className="bg-bg-surface! border! border-border-subtle! rounded-xl!"
          maskColor="var(--color-bg-base)"
          nodeColor="var(--color-accent-primary)"
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  )
}
