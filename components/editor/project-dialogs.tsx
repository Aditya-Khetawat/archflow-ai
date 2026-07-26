"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { useProjectDialogs } from "@/hooks/use-project-dialogs"

type ProjectDialogsProps = ReturnType<typeof useProjectDialogs>

export function ProjectDialogs({
  dialogType,
  activeProject,
  name,
  slug,
  loading,
  close,
  handleNameChange,
  submit,
}: ProjectDialogsProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) close()
  }

  return (
    <>
      <Dialog open={dialogType === "create"} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Give your project a name to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Input
              placeholder="Project name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              autoFocus
            />
            <p className="min-h-4 text-xs text-muted-foreground font-mono">
              {slug ? slug : ""}
            </p>
          </div>

          <DialogFooter showCloseButton>
            <Button onClick={submit} disabled={!name.trim() || loading}>
              {loading ? "Creating…" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "rename"} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Renaming &ldquo;{activeProject?.name}&rdquo;
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Project name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) submit()
            }}
            autoFocus
          />

          <DialogFooter showCloseButton>
            <Button onClick={submit} disabled={!name.trim() || loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === "delete"} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{activeProject?.name}&rdquo;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter showCloseButton>
            <Button variant="destructive" onClick={submit} disabled={loading}>
              {loading ? "Deleting…" : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
