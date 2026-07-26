"use client"

import { useState } from "react"
import { Bot, Compass, Sparkles } from "lucide-react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectShareDialog } from "@/components/editor/project-share-dialog"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useProjectActions, type ProjectRow } from "@/hooks/use-project-actions"
import { cn } from "@/lib/utils"

interface EditorWorkspaceClientProps {
  currentProject: ProjectRow
  ownedProjects: ProjectRow[]
  sharedProjects: ProjectRow[]
}

export function EditorWorkspaceClient({
  currentProject,
  ownedProjects,
  sharedProjects,
}: EditorWorkspaceClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
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
      />

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

      <main
        className={cn(
          "min-h-0 flex-1 px-3 pb-3 pt-3 transition-[padding] duration-200",
          sidebarOpen ? "md:pl-[19.5rem]" : "md:pl-3",
          aiSidebarOpen ? "md:pr-[22rem]" : "md:pr-3"
        )}
      >
        <div className="grid h-full min-h-0 gap-3">
          <section className="relative flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-accent-primary-dim),transparent_38%)]" />
            <div className="pointer-events-none absolute bottom-[-3rem] right-[-2rem] h-56 w-56 rounded-full bg-accent-ai/12 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,var(--color-border-default)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-default)_1px,transparent_1px)] [background-size:56px_56px]" />
            <div className="relative flex flex-1 items-center justify-center px-6">
              <div className="flex max-w-lg flex-col items-center text-center">
                <div className="mb-5 rounded-2xl border border-border-subtle bg-bg-elevated p-4">
                  <Compass className="h-8 w-8 text-accent-primary" />
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-text-faint">
                  Workspace Shell
                </p>
                <h1 className="mt-3 text-2xl font-medium text-text-primary">
                  Canvas and collaboration tooling land here next.
                </h1>
                <p className="mt-3 text-sm leading-6 text-text-muted">
                  This room is ready for the shared architecture canvas, durable AI
                  workflows, and real-time presence. For now, the shell is wired with
                  project context and navigation only.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

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
    </div>
  )
}
