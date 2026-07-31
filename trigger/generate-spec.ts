import { schemaTask, metadata, logger } from "@trigger.dev/sdk/v3"
import { generateText } from "ai"
import { z } from "zod"
import { put } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { google, GEMINI_MODEL, withRetry, initializeGemini } from "@/lib/gemini"


const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
})

const nodeDataSchema = z
  .object({
    label: z.string().optional(),
    shape: z.string().optional(),
    color: z.string().optional(),
  })
  .passthrough()

const nodeSchema = z
  .object({
    id: z.string(),
    type: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    data: nodeDataSchema.optional(),
  })
  .passthrough()

const edgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    data: z.object({ label: z.string().optional() }).passthrough().optional(),
  })
  .passthrough()

const payloadSchema = z.object({
  projectId: z.string(),
  roomId: z.string(),
  chatHistory: z.array(chatMessageSchema),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
})

type Node = z.infer<typeof nodeSchema>
type Edge = z.infer<typeof edgeSchema>
type ChatMessage = z.infer<typeof chatMessageSchema>

function buildContext(nodes: Node[], edges: Edge[], chatHistory: ChatMessage[]): string {
  const nodeLines = nodes
    .map((n) => {
      const label = n.data?.label ?? n.id
      const shape = n.data?.shape ?? "rectangle"
      const pos = n.position ? ` at (${Math.round(n.position.x)}, ${Math.round(n.position.y)})` : ""
      return `- ${label} (id: ${n.id}, shape: ${shape}${pos})`
    })
    .join("\n")

  const edgeLines = edges
    .map((e) => {
      const label = e.data?.label ? ` [${e.data.label}]` : ""
      return `- ${e.source} → ${e.target}${label}`
    })
    .join("\n")

  const chatLines = chatHistory
    .map((m) => `${m.role === "user" ? "User" : "ArchFlow AI"}: ${m.content}`)
    .join("\n")

  return [
    "## Canvas Nodes",
    nodeLines || "(none)",
    "",
    "## Canvas Connections",
    edgeLines || "(none)",
    "",
    "## Chat History",
    chatLines || "(none)",
  ].join("\n")
}

const SYSTEM_PROMPT = `You are ArchFlow AI, a senior technical architect. Generate a comprehensive Markdown technical specification document based on the provided architecture canvas and conversation context.

Structure the spec as follows:
1. **Overview** — What the system does and its key goals
2. **Architecture** — High-level architecture description based on the canvas
3. **Components** — Each node/service with its role and responsibilities
4. **Data Flow** — How data and requests move through the system
5. **Technology Choices** — Suggested technologies that fit the architecture
6. **Key Considerations** — Scalability, security, and performance notes

Write in clear, professional technical language. Use Markdown headers, bullet points, and code blocks where appropriate. Be specific and actionable.`

export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: payloadSchema,
  retry: { maxAttempts: 2, minTimeoutInMs: 1000, maxTimeoutInMs: 10000, factor: 2 },
  run: async (payload) => {
    try {
      logger.info("=== generate-spec task started ===", {
        projectId: payload.projectId,
        nodeCount: payload.nodes.length,
        edgeCount: payload.edges.length,
      })

      // Step 1: Init Gemini
      logger.info("Step 1: Initializing Gemini...")
      try {
        await initializeGemini(false)
        logger.info("Step 1: Gemini initialized OK, model:", { model: GEMINI_MODEL })
      } catch (err: any) {
        logger.error("Step 1 FAILED: Gemini init error", { error: err.message || String(err) })
        throw err
      }

      metadata.set("status", "generating")

      // Step 2: Build context
      logger.info("Step 2: Building context...")
      const context = buildContext(payload.nodes, payload.edges, payload.chatHistory)
      logger.info("Step 2: Context built", { contextLength: context.length })

      // Step 3: Gemini call
      logger.info(`Step 3: Calling Gemini model "${GEMINI_MODEL}"...`)
      let spec: string
      try {
        const result = await withRetry(async () => {
          return await generateText({
            model: google(GEMINI_MODEL),
            system: SYSTEM_PROMPT,
            prompt: context,
            abortSignal: AbortSignal.timeout(60000),
          })
        }, { maxRetries: 1 })
        spec = result.text
        logger.info("Step 3: Gemini response received", { specLength: spec.length })
      } catch (err: any) {
        logger.error("Step 3 FAILED: Gemini call error", {
          error: err.message || String(err),
          status: err?.status,
          cause: err?.cause?.message,
        })
        throw err
      }

      metadata.set("status", "uploading")

      // Step 4: Upload to Vercel Blob
      logger.info("Step 4: Uploading spec to Vercel Blob...")
      let blob: Awaited<ReturnType<typeof put>>
      try {
        blob = await put(
          `specs/${payload.projectId}/${Date.now()}.md`,
          spec,
          {
            access: "private",
            contentType: "text/markdown",
            addRandomSuffix: false,
            allowOverwrite: true,
          }
        )
        logger.info("Step 4: Blob uploaded OK", { url: blob.url })
      } catch (err: any) {
        logger.error("Step 4 FAILED: Blob upload error", { error: err.message || String(err) })
        throw err
      }

      // Step 5: Save to DB
      logger.info("Step 5: Saving spec record to DB...")
      let record: { id: string }
      try {
        record = await prisma.projectSpec.create({
          data: {
            projectId: payload.projectId,
            filePath: blob.url,
          },
        })
        logger.info("Step 5: DB record created", { specId: record.id })
      } catch (err: any) {
        logger.error("Step 5 FAILED: DB write error", { error: err.message || String(err) })
        throw err
      }

      metadata.set("status", "complete")
      metadata.set("specLength", spec.length)
      metadata.set("specId", record.id)
      logger.info("=== generate-spec task COMPLETED ===", { specId: record.id })

      return { spec, specId: record.id }
    } catch (err: any) {
      logger.error("=== generate-spec task FAILED ===", {
        error: err.message || String(err),
        stack: err.stack?.slice(0, 500),
      })
      throw err
    }
  },
})
