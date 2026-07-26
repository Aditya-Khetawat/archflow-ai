"use client"

import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-full w-72 z-50 flex flex-col bg-bg-surface border-r border-border-default transition-transform duration-200 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-border-default">
        <span className="text-sm font-medium text-text-primary">Projects</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden p-3">
        <Tabs defaultValue="my-projects" className="flex-1 flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="my-projects"
            className="flex-1 flex items-center justify-center"
          >
            <p className="text-sm text-text-muted">No projects yet.</p>
          </TabsContent>

          <TabsContent
            value="shared"
            className="flex-1 flex items-center justify-center"
          >
            <p className="text-sm text-text-muted">No shared projects.</p>
          </TabsContent>
        </Tabs>
      </div>

      <div className="shrink-0 p-3 border-t border-border-default">
        <Button variant="default" size="default" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  )
}
