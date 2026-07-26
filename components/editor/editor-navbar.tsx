"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EditorNavbarProps {
  isOpen: boolean
  onToggle: () => void
}

export function EditorNavbar({ isOpen, onToggle }: EditorNavbarProps) {
  return (
    <header className="h-12 shrink-0 flex items-center justify-between px-3 bg-bg-surface border-b border-border-default">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onToggle}>
          {isOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>
      <div className="flex-1" />
      <div className="flex items-center" />
    </header>
  )
}
