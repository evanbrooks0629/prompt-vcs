"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronUp, ChevronDown, Plus, Trash2, Edit } from "lucide-react"
import { Prompt } from "./main-app"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface TestCase {
  id: string
  name: string
  input: string
}

interface TestCasePanelProps {
  prompt: Prompt | null
  onAddTestCase: (promptId: string, updatedTestCase: TestCase) => void
  onUpdateTestCase: (promptId: string, updatedTestCase: TestCase) => void
  onDeleteTestCase: (promptId: string, testCase: TestCase) => void
}

export function TestCasePanel({ prompt, onAddTestCase, onUpdateTestCase, onDeleteTestCase }: TestCasePanelProps) {
  const { state } = useSidebar()
  const [isExpanded, setIsExpanded] = useState(false)
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [newTestName, setNewTestName] = useState("")
  const [newTestInput, setNewTestInput] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editInput, setEditInput] = useState("")

  useEffect(() => {
    setTestCases(prompt?.testCases || [])
  }, [prompt])

  const addTestCase = () => {
    if (!newTestName.trim() || !newTestInput.trim()) return

    const newTestCase: TestCase = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTestName.trim(),
      input: newTestInput.trim(),
    }

    setTestCases([...testCases, newTestCase])
    onAddTestCase(prompt?.id || "", newTestCase)
    setNewTestName("")
    setNewTestInput("")
  }

  const deleteTestCase = (id: string) => {
    setTestCases(testCases.filter(tc => tc.id !== id))
    onDeleteTestCase(prompt?.id || "", testCases.find(tc => tc.id === id) || { id: "", name: "", input: "" })
  }

  const startEditing = (testCase: TestCase) => {
    setEditingId(testCase.id)
    setEditName(testCase.name)
    setEditInput(testCase.input)
  }

  const saveEdit = () => {
    if (!editName.trim() || !editInput.trim() || !editingId) return

    setTestCases(testCases.map(tc => 
      tc.id === editingId 
        ? { ...tc, name: editName.trim(), input: editInput.trim() }
        : tc
    ))
    onUpdateTestCase(prompt?.id || "", { id: editingId, name: editName.trim(), input: editInput.trim() })
    setEditingId(null)
    setEditName("")
    setEditInput("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditInput("")
  }

  return (
    <div className={cn(
      "fixed bottom-0 right-0 border-t bg-background z-10",
      state === "expanded" ? "left-[var(--sidebar-width)]" : "left-0"
    )}>
      {/* Collapse/Expand Header */}
      <div 
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Test Suite</h3>
          
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="h-[calc(100vh-7rem)] overflow-y-auto border-t bg-background">
          <Tabs defaultValue="test-cases" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
              <TabsTrigger value="experiments">Experiments</TabsTrigger>
              <TabsTrigger value="ai-enhancer">AI Enhancer</TabsTrigger>
            </TabsList>

            <TabsContent value="test-cases" className="flex-1 overflow-hidden m-4 mt-2">
              <div className="space-y-4">
                {/* Add New Test Case */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Add New Test Case</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Test case name"
                      value={newTestName}
                      onChange={(e) => setNewTestName(e.target.value)}
                    />
                    <Textarea
                      placeholder="Test input"
                      value={newTestInput}
                      onChange={(e) => setNewTestInput(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={addTestCase}
                      disabled={!newTestName.trim() || !newTestInput.trim()}
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Test Case
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Test Cases */}
                {testCases.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Test Cases ({testCases.length})</h4>
                    {testCases.map((testCase) => (
                      <Card key={testCase.id} className="bg-muted/30">
                        <CardContent className="p-3">
                          {editingId === testCase.id ? (
                            <div className="space-y-3">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Test case name"
                              />
                              <Textarea
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                placeholder="Test input"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={saveEdit}
                                  disabled={!editName.trim() || !editInput.trim()}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-sm mb-1">{testCase.name}</h5>
                                <p className="text-xs text-muted-foreground break-words">
                                  {testCase.input}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditing(testCase)}
                                  className="h-7 px-2"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteTestCase(testCase.id)}
                                  className="h-7 px-2 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="experiments" className="flex-1 overflow-hidden m-4 mt-2">
              {/* Content for Experiments tab will go here */}
            </TabsContent>

            <TabsContent value="ai-enhancer" className="flex-1 overflow-hidden m-4 mt-2">
              {/* Content for AI Enhancer tab will go here */}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
} 