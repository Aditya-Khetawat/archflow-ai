"use client"

import { useState } from "react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { ProjectShareDialog } from "@/components/editor/project-share-dialog"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { AiSidebar } from "@/components/editor/ai-sidebar"
import { CanvasRoom } from "@/components/editor/canvas/canvas-room"
import { useProjectActions, type ProjectRow } from "@/hooks/use-project-actions"
import type { CanvasTemplate } from "@/components/editor/starter-templates"

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
          projectId={currentProject.id}
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

      <AiSidebar isOpen={aiSidebarOpen} onClose={() => setAiSidebarOpen(false)} />

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
