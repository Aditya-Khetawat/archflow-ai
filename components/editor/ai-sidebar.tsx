"use client"

import { useState, useRef, useCallback } from "react"
import { Bot, X, Send, FileText, Download } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = "72px"
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ])
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "72px"
    }
  }, [input])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleChip = useCallback((chip: string) => {
    setInput(chip)
    if (textareaRef.current) {
      textareaRef.current.style.height = "72px"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
      textareaRef.current.focus()
    }
  }, [])

  return (
    <aside
      className={cn(
        "fixed inset-y-3 right-3 top-[3.75rem] z-40 hidden w-[21rem] flex-col rounded-3xl border border-border-subtle bg-bg-surface/95 backdrop-blur-xl transition-transform duration-200 md:flex",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border-default px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-ai/15">
          <Bot className="h-4 w-4 text-accent-ai-text" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">AI Workspace</p>
          <p className="text-xs text-text-muted">Collaborate with Ghost AI</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-subtle hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="architect" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 h-auto shrink-0 grid-cols-2 rounded-xl bg-bg-subtle p-1">
          <TabsTrigger
            value="architect"
            className="rounded-lg px-3 py-1.5 text-xs font-medium data-active:bg-accent-ai data-active:text-white data-active:shadow-none"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="rounded-lg px-3 py-1.5 text-xs font-medium data-active:bg-accent-ai data-active:text-white data-active:shadow-none"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        {/* AI Architect Tab */}
        <TabsContent value="architect" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <ScrollArea className="flex-1">
              <div className="px-4 pt-3 pb-2">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center gap-5 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-ai/15">
                      <Bot className="h-6 w-6 text-accent-ai-text" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Ghost AI Architect
                      </p>
                      <p className="mt-1 text-xs leading-5 text-text-muted">
                        Describe your system and I&apos;ll help you design the architecture.
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-2">
                      {STARTER_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleChip(chip)}
                          className="w-full rounded-full bg-bg-subtle px-4 py-2 text-left text-xs text-accent-ai-text transition-colors hover:bg-border-default"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pb-2">
                    {messages.map((msg) =>
                      msg.role === "user" ? (
                        <div key={msg.id} className="flex justify-end">
                          <div className="max-w-[85%] rounded-2xl rounded-br-sm border-2 border-accent-primary/50 bg-accent-primary-dim px-4 py-2.5 text-sm text-text-primary">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div key={msg.id} className="flex justify-start">
                          <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border-subtle bg-bg-elevated px-4 py-2.5 text-sm text-accent-ai-text">
                            {msg.content}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="shrink-0 border-t border-border-default p-3">
              <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-bg-elevated p-3">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your system…"
                  style={{ height: "72px", maxHeight: "160px" }}
                  className="resize-none overflow-y-auto border-0 bg-transparent p-0 text-sm text-text-primary shadow-none placeholder:text-text-faint focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-faint">Shift+Enter for newline</span>
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="h-7 gap-1.5 rounded-lg bg-accent-ai px-3 text-xs text-white hover:bg-accent-ai/80 disabled:opacity-40"
                  >
                    <Send className="h-3 w-3" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent value="specs" className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col gap-4 p-4">
            <Button className="w-full rounded-xl bg-accent-ai text-white hover:bg-accent-ai/80">
              Generate Spec
            </Button>

            {/* Demo spec card */}
            <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
                  <FileText className="h-4 w-4 text-text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">System Architecture v1</p>
                  <p className="mt-1 text-xs leading-5 text-text-muted line-clamp-3">
                    Microservices design with API gateway, authentication service, and event-driven
                    communication between bounded contexts.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  disabled
                  variant="outline"
                  className="h-7 gap-1.5 rounded-lg border-border-subtle px-3 text-xs text-text-faint"
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
