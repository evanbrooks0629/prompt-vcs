"use client"

import { useState } from "react"
import { Plus, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { Prompt } from "./main-app"

interface TopBarProps {
  selectedPrompt: Prompt | null
  onCreatePrompt: (name: string) => void
  onDeletePrompt: (name: string) => void
}

export function TopBar({ selectedPrompt, onCreatePrompt, onDeletePrompt }: TopBarProps) {
  const [newPromptName, setNewPromptName] = useState("")
  const [deletePromptName, setDeletePromptName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleCreatePrompt = () => {
    if (newPromptName.trim()) {
      onCreatePrompt(newPromptName.trim())
      setNewPromptName("")
      setIsDialogOpen(false)
    }
  }

  const handleDeletePrompt = () => {
    if (deletePromptName.trim()) {
      onDeletePrompt(deletePromptName.trim())
      setDeletePromptName("")
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="border-b bg-background/95 backdrop-blur ">
      <div className="flex h-18 items-center px-4 gap-4">
        <SidebarTrigger />

        <div className="flex-1">
          <h1 className="text-lg font-semibold">{selectedPrompt ? selectedPrompt.name : "PromptVCS"}</h1>
          {selectedPrompt && (
            <p className="text-sm text-muted-foreground">Current branch: {selectedPrompt.currentBranch}</p>
          )}
        </div>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <Trash className="h-4 w-4 mr-2" />
              Delete Prompt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Prompt</DialogTitle>
              <DialogDescription>Are you sure you want to delete this prompt? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Enter the prompt name to delete</Label>
                <Input
                  id="name"
                  placeholder="e.g., Email Generator, Code Reviewer..."
                  value={deletePromptName}
                  onChange={(e) => setDeletePromptName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDeletePrompt()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeletePrompt} disabled={!(deletePromptName.trim() === selectedPrompt?.name)}>
                Delete Prompt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Prompt</DialogTitle>
              <DialogDescription>Give your new prompt a descriptive name.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Prompt Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Email Generator, Code Reviewer..."
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePrompt()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePrompt} disabled={!newPromptName.trim()}>
                Create Prompt
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
