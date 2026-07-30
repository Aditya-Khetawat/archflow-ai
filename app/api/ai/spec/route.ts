import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk/v3"
import { getCurrentProjectIdentity, getAccessibleProject } from "@/lib/project-access"
import type { generateSpec } from "@/trigger/generate-spec"

export async function POST(request: Request) {
  console.log("[Backend] Request received for spec generation");
  const identity = await getCurrentProjectIdentity()
  if (!identity.userId) {
    console.warn("[Backend] Unauthorized spec generation request");
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => ({}))
  const b = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}

  const roomId = typeof b.roomId === "string" ? b.roomId.trim() : ""
  const chatHistory = Array.isArray(b.chatHistory) ? b.chatHistory : []
  const nodes = Array.isArray(b.nodes) ? b.nodes : []
  const edges = Array.isArray(b.edges) ? b.edges : []

  if (!roomId) {
    console.warn("[Backend] Missing roomId in spec generation request");
    return Response.json({ error: "Missing roomId" }, { status: 400 })
  }

  const project = await getAccessibleProject(roomId, identity)
  if (!project) {
    console.warn("[Backend] Project not found or inaccessible for roomId:", roomId);
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  console.log("[Backend] Triggering generate-spec task...");
  const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
    projectId: project.id,
    roomId,
    chatHistory,
    nodes,
    edges,
  })
  console.log("[Backend] Task triggered successfully, runId:", handle.id);

  await prisma.taskRun.create({
    data: { runId: handle.id, projectId: project.id, userId: identity.userId },
  })

  return Response.json({ runId: handle.id }, { status: 201 })
}
