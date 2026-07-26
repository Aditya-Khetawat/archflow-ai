"use client"

import { LiveObject, LiveMap } from "@liveblocks/client"
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react"
import { ReactFlowProvider } from "@xyflow/react"
import { CanvasEditor } from "@/components/editor/canvas/canvas-editor"
import type { CanvasTemplate } from "@/components/editor/starter-templates"

interface CanvasRoomProps {
  roomId: string
  pendingTemplate?: CanvasTemplate | null
  onTemplateImported?: () => void
}

export function CanvasRoom({ roomId, pendingTemplate, onTemplateImported }: CanvasRoomProps) {
  return (
    <div className="h-full w-full">
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, isThinking: false }}
          initialStorage={new LiveObject({
            flow: new LiveObject({ nodes: new LiveMap(), edges: new LiveMap() }),
          })}
        >
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <ReactFlowProvider>
              <CanvasEditor
                pendingTemplate={pendingTemplate}
                onTemplateImported={onTemplateImported}
              />
            </ReactFlowProvider>
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </div>
  )
}

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <p className="text-sm text-text-faint">Connecting to room…</p>
    </div>
  )
}
