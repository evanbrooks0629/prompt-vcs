"use client"

import { useState, useEffect } from "react"
import { Play, Save, ThumbsUp, ThumbsDown, Plus, Copy, RotateCcw, ChevronDown, ChevronRight, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { NotificationContainer } from "@/components/ui/notification"
import { useNotifications } from "@/hooks/use-notifications"

import type { PromptVersion, TestResult } from "./main-app"

interface PromptEditorProps {
  version: PromptVersion | null
  onUpdateVersion: (version: PromptVersion) => void
}

export function PromptEditor({ version, onUpdateVersion }: PromptEditorProps) {
  const [prompt, setPrompt] = useState("")
  const [systemMessage, setSystemMessage] = useState("")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)
  const [topP, setTopP] = useState(1)
  const [model, setModel] = useState("gpt-4o")
  const [testInput, setTestInput] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [currentOutput, setCurrentOutput] = useState("")
  const [commitMessage, setCommitMessage] = useState("")
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false)
  const [copiedInputIndex, setCopiedInputIndex] = useState<number | null>(null)
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set())

  const { notifications, addNotification } = useNotifications()

  useEffect(() => {
    if (version) {
      setPrompt(version.prompt)
      setSystemMessage(version.systemMessage)
      setTemperature(version.parameters.temperature)
      setMaxTokens(version.parameters.maxTokens)
      setTopP(version.parameters.topP)
      setModel(version.parameters.model)
    }
  }, [version])

  if (!version) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Select a prompt version to start editing</p>
          <div className="h-60"></div>
        </div>
      </div>
    )
  }

  const hasChanges =
    prompt !== version.prompt ||
    systemMessage !== version.systemMessage ||
    temperature !== version.parameters.temperature ||
    maxTokens !== version.parameters.maxTokens ||
    topP !== version.parameters.topP ||
    model !== version.parameters.model

  const runPrompt = async () => {
    if (!testInput.trim()) {
      addNotification({
        title: "Input Required",
        message: "Please enter a test input to run the prompt.",
        type: "error",
        duration: 3000,
      })
      return
    }

    setIsRunning(true)

    try {
      // Get API settings from localStorage
      const apiSettings = JSON.parse(localStorage.getItem("api_settings") || "{}")
      const isOpenAI = model.startsWith("gpt")
      const apiKey = apiSettings[isOpenAI ? "openai" : "anthropic"]

      if (!apiKey) {
        addNotification({
          title: "API Key Missing",
          message: "Please configure your API key in settings.",
          type: "error",
          duration: 3000,
        })
        setIsRunning(false)
        return
      }

      let response
      
      if (isOpenAI) {
        // OpenAI API call
        const messages = []
        if (systemMessage.trim()) {
          messages.push({ role: "system", content: systemMessage })
        }
        messages.push({ role: "user", content: `${prompt}\n\n${testInput}` })

        const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: temperature,
            max_tokens: maxTokens,
            top_p: topP
          })
        })

        if (!openAIResponse.ok) {
          const error = await openAIResponse.json()
          throw new Error(error.error?.message || "OpenAI API request failed")
        }

        const data = await openAIResponse.json()
        response = data.choices[0]?.message?.content || "No response generated"
      } else {
        // Anthropic API call
        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: model,
            max_tokens: maxTokens,
            temperature: temperature,
            top_p: topP,
            system: systemMessage.trim() || undefined,
            messages: [
              {
                role: "user",
                content: `${prompt}\n\n${testInput}`
              }
            ]
          })
        })

        if (!anthropicResponse.ok) {
          const error = await anthropicResponse.json()
          throw new Error(error.error?.message || "Anthropic API request failed")
        }

        const data = await anthropicResponse.json()
        response = data.content[0]?.text || "No response generated"
      }

      setCurrentOutput(response)
      addNotification({
        title: "Prompt Executed",
        message: "Review the output and rate its quality.",
        type: "success",
        duration: 3000,
      })
    } catch (error) {
      console.error("API Error:", error)
      addNotification({
        title: "Error",
        message: `Error: ${error instanceof Error ? error.message : "Failed to run prompt. Please check your API settings."}`,
        type: "error",
        duration: 3000,
      })
    } finally {
      setIsRunning(false)
    }
  }

  const rateOutput = (rating: "pass" | "fail") => {
    if (!currentOutput || !testInput) return

    const newTestResult: TestResult = {
      input: testInput,
      output: currentOutput,
      rating,
      timestamp: new Date(),
    }

    const updatedVersion = {
      ...version,
      testResults: [...(version.testResults || []), newTestResult],
    }

    onUpdateVersion(updatedVersion)
    setCurrentOutput("")
    setTestInput("")

    addNotification({
      title: "Output Rated",
      message: `Output rated as ${rating}: Test result saved to version history.`,
      type: "success",
      duration: 3000,
    })
  }

  const saveChanges = () => {
    if (!commitMessage.trim()) {
      setIsCommitDialogOpen(true)
      return
    }

    const updatedVersion = {
      ...version,
      prompt,
      systemMessage,
      parameters: {
        temperature,
        maxTokens,
        topP,
        model,
      },
      commitMessage: commitMessage.trim(),
      timestamp: new Date(),
    }

    onUpdateVersion(updatedVersion)
    setCommitMessage("")
    setIsCommitDialogOpen(false)

    addNotification({
      title: "Changes Saved",
      message: "Prompt version updated successfully.",
      type: "success",
      duration: 3000,
    })
  }

  const resetChanges = () => {
    setPrompt(version.prompt)
    setSystemMessage(version.systemMessage)
    setTemperature(version.parameters.temperature)
    setMaxTokens(version.parameters.maxTokens)
    setTopP(version.parameters.topP)
    setModel(version.parameters.model)
  }

  const addTestCase = () => {
    if (!testInput.trim()) return
    // This would add a saved test case for reuse
    // TODO: Implement this
    // should have a set of test-inputs for each prompt
    addNotification({
      title: "Test Case Saved",
      message: "You can now reuse this input for testing.",
      type: "success",
      duration: 3000,
    })
  }

  const copyInput = (input: string, index: number) => {
    navigator.clipboard.writeText(input)
    setCopiedInputIndex(index)
    setTimeout(() => setCopiedInputIndex(null), 1500)
  }

  const toggleTestExpansion = (index: number) => {
    const newExpanded = new Set(expandedTests)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedTests(newExpanded)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="h-15 pl-1">
            <h3 className="font-medium mt-1">Prompt Editor</h3>
            <p className="text-sm text-muted-foreground mt-3">
              {version.branch} • {version.commitMessage}
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button variant="outline" size="sm" onClick={resetChanges}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
            <Dialog open={isCommitDialogOpen} onOpenChange={setIsCommitDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!hasChanges} onClick={() => hasChanges && setIsCommitDialogOpen(true)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Commit Changes</DialogTitle>
                  <DialogDescription>Describe the changes you made to this prompt version.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="commit-msg">Commit Message</Label>
                    <Textarea
                      id="commit-msg"
                      placeholder="e.g., Improved tone to be more professional"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCommitDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveChanges} disabled={!commitMessage.trim()}>
                    Commit Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="editor" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="test">Test & Judge</TabsTrigger>
            <TabsTrigger value="history">Test History</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 overflow-hidden m-4 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-4">
                <div className="space-y-2">
                  <Label htmlFor="system">System Message</Label>
                  <Textarea
                    id="system"
                    placeholder="You are a helpful assistant..."
                    value={systemMessage}
                    onChange={(e) => setSystemMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Enter your prompt here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number(e.target.value))}
                      min={1}
                      max={4000}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Temperature: {temperature}</Label>
                    <Slider
                      value={[temperature]}
                      onValueChange={(value) => setTemperature(value[0])}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Top P: {topP}</Label>
                    <Slider
                      value={[topP]}
                      onValueChange={(value) => setTopP(value[0])}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="test" className="flex-1 overflow-hidden m-4 mt-2">
            <div className="h-full flex flex-col space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-input">Test Input</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="test-input"
                    placeholder="Enter test input to evaluate your prompt..."
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex flex-col gap-2">
                    <Button onClick={runPrompt} disabled={isRunning || !testInput.trim()}>
                      <Play className="h-4 w-4 mr-2" />
                      {isRunning ? "Running..." : "Run"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={addTestCase} disabled={!testInput.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {currentOutput && (
                <Card className="flex-1">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Output</CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {}}>
                          <Scale className="h-4 w-4 mr-2" />
                          Compare
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rateOutput("pass")}>
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Pass
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rateOutput("fail")}>
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Fail
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(currentOutput)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <pre className="whitespace-pre-wrap text-sm">{currentOutput}</pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden m-4 mt-2">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {version.testResults && version.testResults.length > 0 ? (
                  version.testResults.map((result, index) => {
                    const isExpanded = expandedTests.has(index)
                    return (
                      <Card key={index}>
                        <CardHeader 
                          className="pb-2 cursor-pointer transition-colors"
                          onClick={() => toggleTestExpansion(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <CardTitle className="text-sm">Test #{index + 1}</CardTitle>
                            </div>
                            <Badge variant={result.rating === "pass" ? "default" : "destructive"}>{result.rating}</Badge>
                          </div>
                          <CardDescription>{result.timestamp.toLocaleString()}</CardDescription>
                        </CardHeader>
                        {isExpanded && (
                          <CardContent className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Input:</Label>
                                <div className="flex items-center gap-2">
                                  {copiedInputIndex === index && (
                                    <span className="text-xs text-green-600 font-medium">Copied!</span>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      copyInput(result.input, index)
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm bg-muted p-2 rounded mt-1">{result.input}</p>
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Output:</Label>
                              <Textarea
                                value={result.output}
                                readOnly
                                className="text-sm bg-muted mt-1 resize-none border-0 focus-visible:ring-0"
                                style={{ minHeight: `${Math.max(100, result.output.split('\n').length * 20)}px` }}
                              />
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No test results yet</p>
                    <p className="text-sm">Run some tests to see the history here</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
      <NotificationContainer notifications={notifications} />
    </div>
  )
}
