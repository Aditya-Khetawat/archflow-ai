import { get, put } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { getCurrentProjectIdentity, userHasProjectAccess } from "@/lib/project-access"
import type { NextRequest } from "next/server"

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">
) {
  try {
    const identity = await getCurrentProjectIdentity()
    if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { projectId } = await ctx.params
    const hasAccess = await userHasProjectAccess(projectId, identity)
    if (!hasAccess) return Response.json({ error: "Not found" }, { status: 404 })

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { canvasBlobUrl: true },
    })

    if (!project?.canvasBlobUrl) return Response.json({ canvas: null })

    const result = await get(project.canvasBlobUrl, { access: "private" })
    if (!result || result.statusCode !== 200 || !result.stream) return Response.json({ canvas: null })

    const canvas: unknown = await new Response(result.stream).json()
    return Response.json({ canvas })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[canvas GET]", message)
    return Response.json({ error: "Failed to load canvas", detail: message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">
) {
  try {
    const identity = await getCurrentProjectIdentity()
    if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { projectId } = await ctx.params
    const hasAccess = await userHasProjectAccess(projectId, identity)
    if (!hasAccess) return Response.json({ error: "Not found" }, { status: 404 })

    const body: unknown = await request.json().catch(() => ({}))
    const blob = await put(`canvas/${projectId}.json`, JSON.stringify(body), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasBlobUrl: blob.url },
    })

    return Response.json({ url: blob.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[canvas PUT]", message)
    return Response.json({ error: "Failed to save canvas", detail: message }, { status: 500 })
  }
}
