"use client"

import { useState } from "react"
import { Bot, Sparkles } from "lucide-react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectShareDialog } from "@/components/editor/project-share-dialog"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { CanvasRoom } from "@/components/editor/canvas/canvas-room"
import { useProjectActions, type ProjectRow } from "@/hooks/use-project-actions"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { cn } from "@/lib/utils"

interface EditorWorkspaceClientProps {
  currentProject: ProjectRow
  ownedProjects: ProjectRow[]
  sharedProjects: ProjectRow[]
  roomId: string
}

export function EditorWorkspaceClient({
  currentProject,
  ownedProjects,
  sharedProjects,
  roomId,
}: EditorWorkspaceClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<CanvasTemplate | null>(null)
  const actions = useProjectActions()

  return (
    <div className="flex h-screen flex-col bg-bg-base">
      <EditorNavbar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        projectName={currentProject.name}
        isAiSidebarOpen={aiSidebarOpen}
        onToggleAiSidebar={() => setAiSidebarOpen((prev) => !prev)}
        onOpenShareDialog={() => setShareDialogOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
      />

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <CanvasRoom
          roomId={roomId}
          pendingTemplate={pendingTemplate}
          onTemplateImported={() => setPendingTemplate(null)}
        />
      </main>

      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onNewProject={actions.openCreate}
        onRename={actions.openRename}
        onDelete={actions.openDelete}
        activeProjectId={currentProject.id}
      />

      <aside
        className={cn(
          "fixed inset-y-3 right-3 top-[3.75rem] z-40 hidden w-[21rem] flex-col rounded-3xl border border-border-subtle bg-bg-surface/95 backdrop-blur-xl transition-transform duration-200 md:flex",
          aiSidebarOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
        )}
      >
        <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
          <div>
            <p className="text-sm font-medium text-text-primary">AI Copilot</p>
            <p className="text-xs text-text-faint">Placeholder panel</p>
          </div>
          <Sparkles className="h-4 w-4 text-[var(--color-accent-ai-text)]" />
        </div>

        <div className="flex flex-1 flex-col justify-between p-5">
          <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-xl bg-accent-ai/14 p-2">
                <Bot className="h-4 w-4 text-[var(--color-accent-ai-text)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Chat surface pending</p>
                <p className="text-xs text-text-muted">
                  The toggle is wired. Messaging and generation are intentionally out of scope here.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-base/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-faint">
              Future hooks
            </p>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Prompt composer, run status, and architecture guidance will attach to this sidebar.
            </p>
          </div>
        </div>
      </aside>

      <ProjectDialogs {...actions} />
      <ProjectShareDialog
        projectId={currentProject.id}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
      <StarterTemplatesModal
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onImport={(template) => setPendingTemplate(template)}
      />
    </div>
  )
}
