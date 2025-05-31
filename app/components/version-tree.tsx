"use client"

import { useState } from "react"
import { format } from "date-fns"
import { GitBranch, GitMerge, MoreHorizontal, ChevronDown, ChevronUp, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Prompt, PromptVersion, TestResult } from "./main-app"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface VersionTreeProps {
  prompt: Prompt | null
  selectedVersion: PromptVersion | null
  onSelectVersion: (version: PromptVersion) => void
  onCreateBranch: (fromVersion: PromptVersion, branchName: string, commitMessage: string) => void
  onMergeBranch: (fromBranch: string, toBranch: string, commitMessage: string) => void
  onDeleteBranch: (branchName: string) => void
}

export function VersionTree({
  prompt,
  selectedVersion,
  onSelectVersion,
  onCreateBranch,
  onMergeBranch,
  onDeleteBranch,
}: VersionTreeProps) {
  const [branchName, setBranchName] = useState("")
  const [commitMessage, setCommitMessage] = useState("")
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false)
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBranchForMerge, setSelectedBranchForMerge] = useState("")
  const [selectedBranchForDelete, setSelectedBranchForDelete] = useState("")
  const [expandedTestResults, setExpandedTestResults] = useState<Set<string>>(new Set())

  if (!prompt) {
    return (
      <div className="p-4 text-center flex flex-col items-center justify-center text-muted-foreground h-full">
        <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Select a prompt to view its version tree</p>
        <div className="h-60"></div>
      </div>
    )
  }

  // Group versions by branch
  const branches = prompt.versions.reduce(
    (acc, version) => {
      if (!acc[version.branch]) {
        acc[version.branch] = []
      }
      acc[version.branch].push(version)
      return acc
    },
    {} as Record<string, PromptVersion[]>,
  )

  // Sort versions within each branch by timestamp
  Object.keys(branches).forEach((branch) => {
    branches[branch].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  })

  const handleCreateBranch = () => {
    if (selectedVersion && branchName.trim() && commitMessage.trim()) {
      onCreateBranch(selectedVersion, branchName.trim(), commitMessage.trim())
      setBranchName("")
      setCommitMessage("")
      setIsBranchDialogOpen(false)
    }
  }

  const handleMergeBranch = () => {
    if (selectedBranchForMerge && commitMessage.trim()) {
      onMergeBranch(selectedBranchForMerge, "main", commitMessage.trim())
      setSelectedBranchForMerge("")
      setCommitMessage("")
      setIsMergeDialogOpen(false)
    }
  }

  const handleDeleteBranch = () => {
    if (selectedBranchForDelete) {
      onDeleteBranch(selectedBranchForDelete)
      setSelectedBranchForDelete("")
      setIsDeleteDialogOpen(false)
    }
  }

  const availableBranches = Object.keys(branches).filter((branch) => branch !== "main")

  const toggleTestResults = (versionId: string) => {
    const newExpanded = new Set(expandedTestResults)
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId)
    } else {
      newExpanded.add(versionId)
    }
    setExpandedTestResults(newExpanded)
  }

  const getTestResultsStats = (testResults: TestResult[]) => {
    const total = testResults.length
    const passed = testResults.filter(result => result.rating === "pass").length
    const failed = testResults.filter(result => result.rating === "fail").length
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0
    
    return { total, passed, failed, successRate }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Version Tree</h3>
          <div className="flex gap-1">
            <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={!selectedVersion}>
                  <GitBranch className="h-3 w-3 mr-1" />
                  Branch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Branch</DialogTitle>
                  <DialogDescription>
                    Create a new branch from the selected version to experiment with changes.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch-name">Branch Name</Label>
                    <Input
                      id="branch-name"
                      placeholder="e.g., feature/improve-tone"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commit-message">Commit Message</Label>
                    <Textarea
                      id="commit-message"
                      placeholder="Describe what you're planning to change..."
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBranchDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBranch} disabled={!branchName.trim() || !commitMessage.trim()}>
                    Create Branch
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {availableBranches.length > 0 && (
              <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <GitMerge className="h-3 w-3 mr-1" />
                    Merge
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Merge Branch</DialogTitle>
                    <DialogDescription>Merge a branch into main after comparing outputs.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Select Branch to Merge</Label>
                      <div className="space-y-2">
                        {availableBranches.map((branch) => (
                          <Button
                            key={branch}
                            variant={selectedBranchForMerge === branch ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedBranchForMerge(branch)}
                            className="w-full justify-start"
                          >
                            <GitBranch className="h-3 w-3 mr-2" />
                            {branch}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="merge-message">Merge Message</Label>
                      <Textarea
                        id="merge-message"
                        placeholder="Describe why this branch is better..."
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsMergeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleMergeBranch} disabled={!selectedBranchForMerge || !commitMessage.trim()}>
                      Merge to Main
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {availableBranches.length > 0 && (
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Branch</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this branch? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleDeleteBranch} disabled={!selectedBranchForDelete}>
                      Delete Branch
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {Object.keys(branches).length} branch{Object.keys(branches).length !== 1 ? "es" : ""},{" "}
          {prompt.versions.length} commit{prompt.versions.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {Object.entries(branches).map(([branchName, versions]) => (
            <div key={branchName} className="space-y-2">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <span className="font-medium">{branchName}</span>
                {branchName === prompt.currentBranch && (
                  <Badge variant="secondary" className="text-xs">
                    current
                  </Badge>
                )}
                <div className="flex-1" />
                {branchName !== "main" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setSelectedBranchForDelete(branchName)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="ml-6 space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedVersion?.id === version.id ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted/50"
                    }`}
                    onClick={() => onSelectVersion(version)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-words">{version.commitMessage}</p>
                        <p className="text-xs text-muted-foreground my-2">{format(version.timestamp, "MMM d, HH:mm")}</p>
                        {version.testResults && version.testResults.length > 0 && (
                          <Collapsible 
                            open={expandedTestResults.has(version.id)} 
                            onOpenChange={() => toggleTestResults(version.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between mt-1 cursor-pointer rounded py-0.5">
                                <span className="text-xs text-muted-foreground">
                                  Success Rate: {getTestResultsStats(version.testResults).successRate}%
                                </span>
                                {expandedTestResults.has(version.id) ? (
                                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              {(() => {
                                const stats = getTestResultsStats(version.testResults)
                                return (
                                  <div className="space-y-2 rounded text-xs">
                                    <div className="flex justify-between items-center">
                                      <span>Total Tests: {stats.total}</span>
                                      <span className={`font-medium ${getScoreColor(stats.successRate)}`}>
                                        {stats.successRate}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-green-600">Passed: {stats.passed}</span>
                                      <span className="text-red-600">Failed: {stats.failed}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <Progress 
                                        value={stats.successRate} 
                                        className="h-2"
                                      />
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>0%</span>
                                        <span>100%</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSelectVersion(version)}>
                            Switch to this version
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              onSelectVersion(version)
                              setIsBranchDialogOpen(true)
                            }}
                          >
                            Create branch from here
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
