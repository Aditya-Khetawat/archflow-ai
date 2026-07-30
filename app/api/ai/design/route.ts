import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk/v3"
import type { designAgent } from "@/trigger/design-agent"
import { getLiveblocks } from "@/lib/liveblocks"
import { LiveObject } from "@liveblocks/client"

export async function POST(request: Request) {
  console.log("[Backend] Request received for design agent");
  const { userId } = await auth()
  if (!userId) {
    console.warn("[Backend] Unauthorized design agent request");
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => ({}))
  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}
  const prompt = typeof b.prompt === "string" ? b.prompt.trim() : ""
  const roomId = typeof b.roomId === "string" ? b.roomId.trim() : ""
  const projectId = typeof b.projectId === "string" ? b.projectId.trim() : ""

  if (!prompt || !roomId || !projectId) {
    console.warn("[Backend] Missing required fields for design agent request", { prompt: !!prompt, roomId: !!roomId, projectId: !!projectId });
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Check for Bypass Mode
  if (prompt.toLowerCase() === "/bypass" || process.env.BYPASS_AI === "true") {
    console.log("[Backend] [Bypass] Bypassing AI task and writing directly to Liveblocks storage...");
    try {
      const lb = getLiveblocks()
      
      await lb.mutateStorage(roomId, ({ root }) => {
        const flow = root.get("flow") as any
        if (!flow) return
        const nodes = flow.get("nodes")
        const edges = flow.get("edges")
        if (!nodes || !edges) return

        // Clear any existing nodes/edges to ensure clean render
        const nodeKeys: string[] = [];
        nodes.forEach((_: any, key: string) => {
          nodeKeys.push(key);
        });
        nodeKeys.forEach((key) => nodes.delete(key));

        const edgeKeys: string[] = [];
        edges.forEach((_: any, key: string) => {
          edgeKeys.push(key);
        });
        edgeKeys.forEach((key) => edges.delete(key));

        // Fallback node 1: API Gateway
        nodes.set(
          "bypass-api",
          LiveObject.from({
            id: "bypass-api",
            type: "canvasNode",
            position: { x: 150, y: 100 },
            data: { label: "API Gateway", color: "#10233D", textColor: "#52A8FF", shape: "rectangle" },
            width: 150,
            height: 80,
          })
        )

        // Fallback node 2: Users DB
        nodes.set(
          "bypass-db",
          LiveObject.from({
            id: "bypass-db",
            type: "canvasNode",
            position: { x: 450, y: 100 },
            data: { label: "Users DB", color: "#062822", textColor: "#0AC7B4", shape: "cylinder" },
            width: 120,
            height: 100,
          })
        )

        // Fallback edge
        edges.set(
          "edge-bypass",
          LiveObject.from({
            id: "edge-bypass",
            type: "canvasEdge",
            source: "bypass-api",
            target: "bypass-db",
            sourceHandle: null,
            targetHandle: null,
            data: { label: "connects" },
            markerEnd: {
              type: "arrowclosed",
              color: "rgba(255,255,255,0.4)",
              width: 16,
              height: 16,
            },
          })
        )
      })

      // Broadcast complete status event so collaborators' cursors or feeds update
      await lb.broadcastEvent(roomId, {
        type: "ai-status",
        message: "Bypassed AI call, loaded mock architecture directly.",
        status: "complete",
      }).catch(() => {})

      console.log("[Backend] [Bypass] Bypassed AI task tracker successfully, written direct to storage.")
      return Response.json({ runId: "bypass" }, { status: 201 })
    } catch (err: any) {
      console.error("[Backend] [Bypass] Failed to write directly to Liveblocks storage:", err.message || err);
      // Let it fall back to standard trigger task if direct write fails
    }
  }

  console.log("[Backend] Triggering design-agent task...");
  const handle = await tasks.trigger<typeof designAgent>("design-agent", { prompt, roomId, userId })
  console.log("[Backend] Task triggered successfully, runId:", handle.id);

  await prisma.taskRun.create({
    data: { runId: handle.id, projectId, userId },
  })

  return Response.json({ runId: handle.id }, { status: 201 })
}
