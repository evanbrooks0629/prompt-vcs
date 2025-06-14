"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { VersionTree } from "./version-tree"
import { PromptEditor } from "./prompt-editor"
import { Settings } from "./settings"
import { UserData } from "./google-login"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TestCasePanel, TestCase } from "./test-case-panel"

interface MainAppProps {
  user: UserData | null
  onLogout: () => void
}

export interface Prompt {
  id: string
  name: string
  lastAccessed: Date
  versions: PromptVersion[]
  currentBranch: string
  testCases: TestCase[]
}

export interface PromptVersion {
  id: string
  branch: string
  parent?: string
  prompt: string
  systemMessage: string
  parameters: {
    temperature: number
    maxTokens: number
    topP: number
    model: string
  }
  commitMessage: string
  timestamp: Date
  testResults?: TestResult[]
}

export interface TestResult {
  input: string
  output: string
  rating: "pass" | "fail" | "pending"
  timestamp: Date
}

export function MainApp({ user, onLogout }: MainAppProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Only load prompts if user exists
    if (!user) return
    
    // Load prompts from localStorage
    const savedPrompts = localStorage.getItem(`prompts_${user.id}`)
    if (savedPrompts) {
      const parsed = JSON.parse(savedPrompts)
      // Convert date strings back to Date objects
      const promptsWithDates = parsed.map((prompt: Prompt) => ({
        ...prompt,
        lastAccessed: new Date(prompt.lastAccessed),
        versions: prompt.versions.map((version: PromptVersion) => ({
          ...version,
          timestamp: new Date(version.timestamp),
          testResults: version.testResults?.map((result: TestResult) => ({
            ...result,
            timestamp: new Date(result.timestamp),
          })),
        })),
      }))
      setPrompts(promptsWithDates)
    }
  }, [user?.id])

  const savePrompts = (updatedPrompts: Prompt[]) => {
    if (!user) return
    
    setPrompts(updatedPrompts)
    localStorage.setItem(`prompts_${user.id}`, JSON.stringify(updatedPrompts))
  }

  const createNewPrompt = (name: string) => {
    const newPrompt: Prompt = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      lastAccessed: new Date(),
      currentBranch: "main",
      versions: [
        {
          id: Math.random().toString(36).substr(2, 9),
          branch: "main",
          prompt: "",
          systemMessage: "",
          parameters: {
            temperature: 0.7,
            maxTokens: 1000,
            topP: 1,
            model: "gpt-4o",
          },
          commitMessage: "Initial commit",
          timestamp: new Date(),
        },
      ],
      testCases: []
    }

    const updatedPrompts = [...prompts, newPrompt]
    savePrompts(updatedPrompts)
    setSelectedPrompt(newPrompt)
    setSelectedVersion(newPrompt.versions[0])
  }

  const deletePrompt = (name: string) => {
    const updatedPrompts = prompts.filter((p) => p.name !== name)
    savePrompts(updatedPrompts)
    
    // Clear selection if the deleted prompt was selected
    if (selectedPrompt && selectedPrompt.name === name) {
      setSelectedPrompt(null)
      setSelectedVersion(null)
    }
  }

  const selectPrompt = (prompt: Prompt) => {
    // Update last accessed
    const updatedPrompt = { ...prompt, lastAccessed: new Date() }
    const updatedPrompts = prompts.map((p) => (p.id === prompt.id ? updatedPrompt : p))
    savePrompts(updatedPrompts)

    setSelectedPrompt(updatedPrompt)
    // Select the current branch's latest version
    const currentBranchVersions = updatedPrompt.versions.filter((v) => v.branch === updatedPrompt.currentBranch)
    const latestVersion = currentBranchVersions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    setSelectedVersion(latestVersion)
  }

  const updatePromptVersion = (updatedVersion: PromptVersion) => {
    if (!selectedPrompt) return

    const updatedPrompt = {
      ...selectedPrompt,
      versions: selectedPrompt.versions.map((v) => (v.id === updatedVersion.id ? updatedVersion : v)),
      lastAccessed: new Date(),
    }

    const updatedPrompts = prompts.map((p) => (p.id === selectedPrompt.id ? updatedPrompt : p))
    savePrompts(updatedPrompts)
    setSelectedPrompt(updatedPrompt)
    setSelectedVersion(updatedVersion)
  }

  const createBranch = (fromVersion: PromptVersion, branchName: string, commitMessage: string) => {
    if (!selectedPrompt) return

    const newVersion: PromptVersion = {
      ...fromVersion,
      id: Math.random().toString(36).substr(2, 9),
      branch: branchName,
      parent: fromVersion.id,
      commitMessage,
      timestamp: new Date(),
      testResults: [],
    }

    const updatedPrompt = {
      ...selectedPrompt,
      versions: [...selectedPrompt.versions, newVersion],
      currentBranch: branchName,
      lastAccessed: new Date(),
    }

    const updatedPrompts = prompts.map((p) => (p.id === selectedPrompt.id ? updatedPrompt : p))
    savePrompts(updatedPrompts)
    setSelectedPrompt(updatedPrompt)
    setSelectedVersion(newVersion)
  }

  const mergeBranch = (fromBranch: string, toBranch: string, commitMessage: string) => {
    if (!selectedPrompt) return

    const fromVersions = selectedPrompt.versions.filter((v) => v.branch === fromBranch)
    const latestFromVersion = fromVersions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]

    const mergedVersion: PromptVersion = {
      ...latestFromVersion,
      id: Math.random().toString(36).substr(2, 9),
      branch: toBranch,
      parent: latestFromVersion.id,
      commitMessage: `Merge ${fromBranch} into ${toBranch}: ${commitMessage}`,
      timestamp: new Date(),
    }

    const updatedPrompt = {
      ...selectedPrompt,
      versions: [...selectedPrompt.versions, mergedVersion],
      currentBranch: toBranch,
      lastAccessed: new Date(),
    }

    const updatedPrompts = prompts.map((p) => (p.id === selectedPrompt.id ? updatedPrompt : p))
    savePrompts(updatedPrompts)
    setSelectedPrompt(updatedPrompt)
    setSelectedVersion(mergedVersion)
  }

  const deleteBranch = (branchName: string) => {
    if (!selectedPrompt || branchName === "main") return

    // Remove all versions from the branch
    const updatedVersions = selectedPrompt.versions.filter((v) => v.branch !== branchName)
    
    // If we're currently on the deleted branch, switch to main
    const newCurrentBranch = selectedPrompt.currentBranch === branchName ? "main" : selectedPrompt.currentBranch
    
    const updatedPrompt = {
      ...selectedPrompt,
      versions: updatedVersions,
      currentBranch: newCurrentBranch,
      lastAccessed: new Date(),
    }

    const updatedPrompts = prompts.map((p) => (p.id === selectedPrompt.id ? updatedPrompt : p))
    savePrompts(updatedPrompts)
    setSelectedPrompt(updatedPrompt)

    // If we were on the deleted branch, select the latest version from main
    if (selectedPrompt.currentBranch === branchName) {
      const mainVersions = updatedVersions.filter((v) => v.branch === "main")
      const latestMainVersion = mainVersions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
      setSelectedVersion(latestMainVersion)
    }
  }

  const addTestCase = (promptId: string, updatedTestCase: TestCase) => {
    const newTestCase: TestCase = {
      id: Math.random().toString(36).substr(2, 9),
      name: updatedTestCase.name,
      input: updatedTestCase.input
    }

    const updatedPrompts = prompts.map((prompt) => {
      if (prompt.id === promptId) {
        return {
          ...prompt,
          testCases: [...prompt.testCases, newTestCase],
          lastAccessed: new Date(),
        }
      }
      return prompt
    })

    savePrompts(updatedPrompts)
    
    // Update selected prompt if it's the one being modified
    if (selectedPrompt && selectedPrompt.id === promptId) {
      const updatedPrompt = updatedPrompts.find(p => p.id === promptId)!
      setSelectedPrompt(updatedPrompt)
    }
  }

  const updateTestCase = (promptId: string, updatedTestCase: TestCase) => {
    const updatedPrompts = prompts.map((prompt) => {
      if (prompt.id === promptId) {
        return {
          ...prompt,
          testCases: prompt.testCases.map((testCase) =>
            testCase.id === updatedTestCase.id
              ? updatedTestCase
              : testCase
          ),
          lastAccessed: new Date(),
        }
      }
      return prompt
    })

    savePrompts(updatedPrompts)
    
    // Update selected prompt if it's the one being modified
    if (selectedPrompt && selectedPrompt.id === promptId) {
      const updatedPrompt = updatedPrompts.find(p => p.id === promptId)!
      setSelectedPrompt(updatedPrompt)
    }
  }

  const deleteTestCase = (promptId: string, selectedTestCase: TestCase) => {
    const updatedPrompts = prompts.map((prompt) => {
      if (prompt.id === promptId) {
        return {
          ...prompt,
          testCases: prompt.testCases.filter((testCase) => testCase.id !== selectedTestCase.id),
          lastAccessed: new Date(),
        }
      }
      return prompt
    })

    savePrompts(updatedPrompts)
    
    // Update selected prompt if it's the one being modified
    if (selectedPrompt && selectedPrompt.id === promptId) {
      const updatedPrompt = updatedPrompts.find(p => p.id === promptId)!
      setSelectedPrompt(updatedPrompt)
    }
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Please log in to continue</h2>
          <p className="text-muted-foreground">You need to be logged in to access your prompts.</p>
        </div>
      </div>
    )
  }

  if (showSettings) {
    return <Settings user={user} onBack={() => setShowSettings(false)} onLogout={onLogout} />
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background w-full">
        <Sidebar
          prompts={prompts}
          selectedPrompt={selectedPrompt}
          onSelectPrompt={selectPrompt}
          user={user}
          onSettings={() => setShowSettings(true)}
          onLogout={onLogout}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar selectedPrompt={selectedPrompt} onCreatePrompt={createNewPrompt} onDeletePrompt={deletePrompt} />

          <div className="flex-1 flex min-w-0">
            <div className="w-100 border-r bg-muted/30 flex-shrink-0 pb-15">
              <VersionTree
                prompt={selectedPrompt}
                selectedVersion={selectedVersion}
                onSelectVersion={setSelectedVersion}
                onCreateBranch={createBranch}
                onMergeBranch={mergeBranch}
                onDeleteBranch={deleteBranch}
              />
            </div>

            <div className="flex-1 min-w-0 mb-15">
              <PromptEditor 
                basePrompt={selectedPrompt}
                version={selectedVersion} 
                onUpdateVersion={updatePromptVersion}
                onAddTestCase={addTestCase}
              />
            </div>
          </div>
        </div>

        {/* Test Case Panel - overlays at the bottom */}
        <TestCasePanel 
          prompt={selectedPrompt} 
          onAddTestCase={addTestCase}
          onUpdateTestCase={updateTestCase}
          onDeleteTestCase={deleteTestCase}
        />
      </div>
    </SidebarProvider>
  )
}
