"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ChevronUp, ChevronDown, Plus, Trash2, Edit, Upload, RotateCcw } from "lucide-react"
import { Prompt, Dataset, Experiment, ExperimentResult, ExperimentRun } from "./main-app"
import { useSidebar } from "@/components/ui/sidebar"
import { cn, parseCSV, interpolateTemplate } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TestCasePanelProps {
  prompt: Prompt | null
  prompts: Prompt[]
  onAddDataset: (promptId: string, dataset: Dataset) => void
  onUpdateDataset: (promptId: string, updatedDataset: Dataset) => void
  onDeleteDataset: (promptId: string, datasetId: string) => void
  onAddExperiment: (promptId: string, experiment: Experiment) => void
  onUpdateExperiment: (promptId: string, updatedExperiment: Experiment) => void
  onDeleteExperiment: (promptId: string, experimentId: string) => void
}

export function TestCasePanel({ 
  prompt, 
  prompts,
  onAddDataset,
  onDeleteDataset,
  onAddExperiment,
  onUpdateExperiment,
  onDeleteExperiment
}: TestCasePanelProps) {
  const { state } = useSidebar()
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Dataset state
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [newDatasetName, setNewDatasetName] = useState("")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<{ data: Record<string, string>[], columns: string[] } | null>(null)
  
  // Experiment state
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("")
  const [experimentName, setExperimentName] = useState("")
  const [selectedPromptId, setSelectedPromptId] = useState<string>("")
  const [selectedPromptVersionId, setSelectedPromptVersionId] = useState<string>("")
  const [judgePrompt, setJudgePrompt] = useState("")
  const [runningExperiment, setRunningExperiment] = useState<string | null>(null)
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)

  const [selectedResult, setSelectedResult] = useState<ExperimentResult | null>(null)
  const [showResultDetails, setShowResultDetails] = useState(false)
  const [showLiveOutput, setShowLiveOutput] = useState(false)
  
  // Edit experiment state
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  useEffect(() => {
    setDatasets(prompt?.datasets || [])
  }, [prompt])

  useEffect(() => {
    setExperiments(prompt?.experiments || [])
  }, [prompt])

  useEffect(() => {
    if (!showLiveOutput || !runningExperiment) return;
    const experiment = experiments.find(exp => exp.runs.some(run => run.id === runningExperiment));
    const currentRun = experiment?.runs.find(run => run.id === runningExperiment);
    if (currentRun && currentRun.results.length > 0 && (!selectedResult || !currentRun.results.find(r => r.id === selectedResult.id))) {
      setSelectedResult(currentRun.results[0]);
    }
  }, [showLiveOutput, runningExperiment, experiments, selectedResult]);

  // CSV and Dataset functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/csv") {
      setCsvFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const parsed = parseCSV(text)
        setCsvPreview(parsed)
      }
      reader.readAsText(file)
    }
  }

  const addDataset = () => {
    if (!newDatasetName.trim() || !csvPreview) return

    const newDataset: Dataset = {
      id: Math.random().toString(36).substr(2, 9),
      name: newDatasetName.trim(),
      data: csvPreview.data,
      columns: csvPreview.columns,
    }

    setDatasets([...datasets, newDataset])
    onAddDataset(prompt?.id || "", newDataset)
    setNewDatasetName("")
    setCsvFile(null)
    setCsvPreview(null)
  }

  const deleteDataset = (id: string) => {
    setDatasets(datasets.filter(ds => ds.id !== id))
    onDeleteDataset(prompt?.id || "", id)
  }

  // Experiment functions
  const saveExperiment = () => {
    if (!selectedDatasetId || !experimentName.trim() || !selectedPromptId || !selectedPromptVersionId || !judgePrompt.trim()) return

    // Create new experiment (without running it)
    const experiment: Experiment = {
      id: Math.random().toString(36).substr(2, 9),
      name: experimentName.trim(),
      datasetId: selectedDatasetId,
      promptId: selectedPromptId,
      promptVersionId: selectedPromptVersionId,
      judgePrompt: judgePrompt,
      runs: [], // No runs initially
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    setExperiments([...experiments, experiment])
    onAddExperiment(prompt?.id || "", experiment)
    
    // Clear form
    setExperimentName("")
    setSelectedDatasetId("")
    setSelectedPromptId("")
    setSelectedPromptVersionId("")
    setJudgePrompt("")
  }

  const runExperiment = async () => {
    if (!selectedDatasetId || !experimentName.trim() || !selectedPromptId || !selectedPromptVersionId || !judgePrompt.trim()) return

    const dataset = datasets.find(ds => ds.id === selectedDatasetId)
    if (!dataset) return

    // Get the selected prompt and version
    const selectedPrompt = prompts.find(p => p.id === selectedPromptId)
    const selectedVersion = selectedPrompt?.versions.find(v => v.id === selectedPromptVersionId)
    
    if (!selectedPrompt || !selectedVersion) return

    // Create new experiment (save it first)
    const experiment: Experiment = {
      id: Math.random().toString(36).substr(2, 9),
      name: experimentName.trim(),
      datasetId: selectedDatasetId,
      promptId: selectedPromptId,
      promptVersionId: selectedPromptVersionId,
      judgePrompt: judgePrompt,
      runs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    setExperiments([...experiments, experiment])
    onAddExperiment(prompt?.id || "", experiment)

    // Create new run
    const run: ExperimentRun = {
      id: Math.random().toString(36).substr(2, 9),
      results: [],
      status: "running",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    experiment.runs.push(run)
    experiment.updatedAt = new Date()
    onUpdateExperiment(prompt?.id || "", experiment)
    setRunningExperiment(run.id)
    // Also update local state immediately for live output
    setExperiments(prevExperiments =>
      prevExperiments.map(exp =>
        exp.id === experiment.id ? experiment : exp
      )
    )

    // Run the experiment with real LLM calls
    try {
      // Use a local results array to accumulate results
      let accumulatedResults: ExperimentResult[] = []
      for (let i = 0; i < dataset.data.length; i++) {
        const row = dataset.data[i]
      
      // Interpolate the prompt with row data
      const interpolatedPrompt = interpolateTemplate(selectedVersion.prompt, row)
      
      try {
        // Get API settings from localStorage
        const apiSettings = JSON.parse(localStorage.getItem("api_settings") || "{}")
        const model = selectedVersion.parameters.model
        const isOpenAI = model.startsWith("gpt")
        const apiKey = apiSettings[isOpenAI ? "openai" : "anthropic"]

        if (!apiKey) {
          throw new Error(`API key not configured for ${isOpenAI ? "OpenAI" : "Anthropic"}`)
        }

        let llmOutput = ""
        
        // Use our API route to avoid CORS issues
        const messages = [
          { role: "user", content: interpolatedPrompt }
        ]

        const llmResponse = await fetch("/api/llm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            provider: isOpenAI ? "openai" : "anthropic",
            model: model,
            messages: messages,
            temperature: selectedVersion.parameters.temperature,
            maxTokens: selectedVersion.parameters.maxTokens,
            topP: selectedVersion.parameters.topP,
            apiKey: apiKey
          })
        })

        if (!llmResponse.ok) {
          const error = await llmResponse.json()
          console.error('LLM API error response:', error)
          throw new Error(error.error || "LLM API request failed")
        }

        const data = await llmResponse.json()
        console.log('LLM API success response:', data)
        llmOutput = data.content || "No response generated"

        // Now run the judge prompt with variable interpolation
        let judgeOutput = ""
        const interpolatedJudgePrompt = interpolateTemplate(judgePrompt, row)
        const judgeMessages = [
          { role: "user", content: `${interpolatedJudgePrompt}\n\nInput: ${JSON.stringify(row)}\n\nOutput: ${llmOutput}` }
        ]

        const judgeResponse = await fetch("/api/llm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            provider: isOpenAI ? "openai" : "anthropic",
            model: model,
            messages: judgeMessages,
            temperature: 0.1, // Lower temperature for more consistent judging
            maxTokens: 100,
            topP: 1,
            apiKey: apiKey
          })
        })

        if (!judgeResponse.ok) {
          const error = await judgeResponse.json()
          throw new Error(error.error || "Judge API request failed")
        }

        const judgeData = await judgeResponse.json()
        judgeOutput = judgeData.content || "Judge failed"

        // Determine rating based on judge output
        const judgeLower = judgeOutput.toLowerCase()
        const rating = judgeLower.includes("pass") || judgeLower.includes("true") || judgeLower.includes("yes") 
          ? "pass" 
          : "fail"

        const result: ExperimentResult = {
          id: Math.random().toString(36).substr(2, 9),
          input: row,
          output: llmOutput,
          judgeOutput: judgeOutput,
          rating: rating,
          timestamp: new Date(),
        }

        // Append to local results array
        accumulatedResults = [...accumulatedResults, result]

        // Create new objects to ensure React detects the changes
        const updatedRun = {
          ...run,
          results: accumulatedResults,
          updatedAt: new Date()
        }
        
        const updatedExperiment = {
          ...experiment,
          runs: experiment.runs.map(r => r.id === run.id ? updatedRun : r),
          updatedAt: new Date()
        }
        
        // Update the experiment in real-time
        onUpdateExperiment(prompt?.id || "", updatedExperiment)
        
        // Also update local state for live output
        setExperiments(prevExperiments => 
          prevExperiments.map(exp => 
            exp.id === experiment.id ? updatedExperiment : exp
          )
        )
        
        // Add a small delay to make live output more visible
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        
        // Add error result with detailed error information
        const errorResult: ExperimentResult = {
          id: Math.random().toString(36).substr(2, 9),
          input: row,
          output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          judgeOutput: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rating: "fail",
          timestamp: new Date(),
        }
        accumulatedResults = [...accumulatedResults, errorResult]
        const updatedRun = {
          ...run,
          results: accumulatedResults,
          updatedAt: new Date()
        }
        const updatedExperiment = {
          ...experiment,
          runs: experiment.runs.map(r => r.id === run.id ? updatedRun : r),
          updatedAt: new Date()
        }
        onUpdateExperiment(prompt?.id || "", updatedExperiment)
        setExperiments(prevExperiments => 
          prevExperiments.map(exp => 
            exp.id === experiment.id ? updatedExperiment : exp
          )
        )
        
        // Continue processing other rows even if this one failed
        continue
              }
      }

      // After loop, mark run as completed
      const completedRun = {
        ...run,
        results: accumulatedResults,
        status: "completed" as const,
        updatedAt: new Date()
      }
      const completedExperiment = {
        ...experiment,
        runs: experiment.runs.map(r => r.id === run.id ? completedRun : r),
        updatedAt: new Date()
      }
      onUpdateExperiment(prompt?.id || "", completedExperiment)
      setExperiments(prevExperiments => 
        prevExperiments.map(exp => 
          exp.id === experiment.id ? completedExperiment : exp
        )
      )
      setRunningExperiment(null)
    } catch (error) {
      console.error("Experiment failed:", error)
      
      // Mark experiment as failed
      if (run && experiment) {
        run.status = "failed"
        run.updatedAt = new Date()
        experiment.updatedAt = new Date()
        onUpdateExperiment(prompt?.id || "", experiment)
        
        // Also update local state for live output
        setExperiments(prevExperiments => 
          prevExperiments.map(exp => 
            exp.id === experiment.id ? experiment : exp
          )
        )
      }
      
      setRunningExperiment(null)
      
      // Show error to user (you could add a toast notification here)
      alert(`Experiment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const viewExperimentResults = (experiment: Experiment) => {
    setSelectedExperiment(experiment)
    setSelectedResult(null)
    setShowResultDetails(true)
  }

  const viewResultDetails = (result: ExperimentResult) => {
    setSelectedResult(result)
  }

  const editExperiment = (experiment: Experiment) => {
    setEditingExperiment(experiment)
    setExperimentName(experiment.name)
    setSelectedDatasetId(experiment.datasetId)
    setSelectedPromptId(experiment.promptId)
    setSelectedPromptVersionId(experiment.promptVersionId)
    setJudgePrompt(experiment.judgePrompt)
    setShowEditDialog(true)
  }

  const saveEditedExperiment = () => {
    if (!editingExperiment || !selectedDatasetId || !experimentName.trim() || !selectedPromptId || !selectedPromptVersionId || !judgePrompt.trim()) return

    const updatedExperiment = {
      ...editingExperiment,
      name: experimentName.trim(),
      datasetId: selectedDatasetId,
      promptId: selectedPromptId,
      promptVersionId: selectedPromptVersionId,
      judgePrompt: judgePrompt,
      updatedAt: new Date(),
    }

    setExperiments(experiments.map(exp => exp.id === editingExperiment.id ? updatedExperiment : exp))
    onUpdateExperiment(prompt?.id || "", updatedExperiment)
    setShowEditDialog(false)
    setEditingExperiment(null)
    setExperimentName("")
    setSelectedDatasetId("")
    setSelectedPromptId("")
    setSelectedPromptVersionId("")
    setJudgePrompt("")
  }

  const rerunExperiment = async (experiment: Experiment) => {
    const dataset = datasets.find(ds => ds.id === experiment.datasetId)
    if (!dataset) return

    const selectedPrompt = prompts.find(p => p.id === experiment.promptId)
    const selectedVersion = selectedPrompt?.versions.find(v => v.id === experiment.promptVersionId)
    
    if (!selectedPrompt || !selectedVersion) return

    // Create new run
    const run: ExperimentRun = {
      id: Math.random().toString(36).substr(2, 9),
      results: [],
      status: "running",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    experiment.runs.push(run)
    experiment.updatedAt = new Date()
    onUpdateExperiment(prompt?.id || "", experiment)
    setRunningExperiment(run.id)
    // Also update local state immediately for live output
    setExperiments(prevExperiments =>
      prevExperiments.map(exp =>
        exp.id === experiment.id ? experiment : exp
      )
    )

    // Run the experiment with real LLM calls
    try {
      // Use a local results array to accumulate results
      let accumulatedResults: ExperimentResult[] = []
      for (let i = 0; i < dataset.data.length; i++) {
        const row = dataset.data[i]
      
        // Interpolate the prompt with row data
        const interpolatedPrompt = interpolateTemplate(selectedVersion.prompt, row)
        
        try {
          // Get API settings from localStorage
          const apiSettings = JSON.parse(localStorage.getItem("api_settings") || "{}")
          const model = selectedVersion.parameters.model
          const isOpenAI = model.startsWith("gpt")
          const apiKey = apiSettings[isOpenAI ? "openai" : "anthropic"]

          if (!apiKey) {
            throw new Error(`API key not configured for ${isOpenAI ? "OpenAI" : "Anthropic"}`)
          }

          let llmOutput = ""
          
          // Use our API route to avoid CORS issues
          const messages = [
            { role: "user", content: interpolatedPrompt }
          ]

          const llmResponse = await fetch("/api/llm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              provider: isOpenAI ? "openai" : "anthropic",
              model: model,
              messages: messages,
              temperature: selectedVersion.parameters.temperature,
              maxTokens: selectedVersion.parameters.maxTokens,
              topP: selectedVersion.parameters.topP,
              apiKey: apiKey
            })
          })

          if (!llmResponse.ok) {
            const error = await llmResponse.json()
            console.error('LLM API error response:', error)
            throw new Error(error.error || "LLM API request failed")
          }

          const data = await llmResponse.json()
          console.log('LLM API success response:', data)
          llmOutput = data.content || "No response generated"

          // Now run the judge prompt with variable interpolation
          let judgeOutput = ""
          const interpolatedJudgePrompt = interpolateTemplate(experiment.judgePrompt, row)
          const judgeMessages = [
            { role: "user", content: `${interpolatedJudgePrompt}\n\nInput: ${JSON.stringify(row)}\n\nOutput: ${llmOutput}` }
          ]

          const judgeResponse = await fetch("/api/llm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              provider: isOpenAI ? "openai" : "anthropic",
              model: model,
              messages: judgeMessages,
              temperature: 0.1, // Lower temperature for more consistent judging
              maxTokens: 100,
              topP: 1,
              apiKey: apiKey
            })
          })

          if (!judgeResponse.ok) {
            const error = await judgeResponse.json()
            throw new Error(error.error || "Judge API request failed")
          }

          const judgeData = await judgeResponse.json()
          judgeOutput = judgeData.content || "Judge failed"

          // Determine rating based on judge output
          const judgeLower = judgeOutput.toLowerCase()
          const rating = judgeLower.includes("pass") || judgeLower.includes("true") || judgeLower.includes("yes") 
            ? "pass" 
            : "fail"

          const result: ExperimentResult = {
            id: Math.random().toString(36).substr(2, 9),
            input: row,
            output: llmOutput,
            judgeOutput: judgeOutput,
            rating: rating,
            timestamp: new Date(),
          }

          accumulatedResults = [...accumulatedResults, result]
          run.results = accumulatedResults
          run.updatedAt = new Date()
          experiment.updatedAt = new Date()
          
          // Update the experiment in real-time
          onUpdateExperiment(prompt?.id || "", experiment)
          
          // Also update local state for live output
          setExperiments(prevExperiments => 
            prevExperiments.map(exp => 
              exp.id === experiment.id ? experiment : exp
            )
          )
        } catch (error) {
          console.error(`Error processing row ${i + 1}:`, error)
          
          // Add error result with detailed error information
          const errorResult: ExperimentResult = {
            id: Math.random().toString(36).substr(2, 9),
            input: row,
            output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            judgeOutput: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            rating: "fail",
            timestamp: new Date(),
          }
          accumulatedResults = [...accumulatedResults, errorResult]
          run.results = accumulatedResults
          run.updatedAt = new Date()
          experiment.updatedAt = new Date()
          onUpdateExperiment(prompt?.id || "", experiment)
          
          // Also update local state for live output
          setExperiments(prevExperiments => 
            prevExperiments.map(exp => 
              exp.id === experiment.id ? experiment : exp
            )
          )
          
          // Continue processing other rows even if this one failed
          continue
        }
      }

      run.status = "completed"
      run.updatedAt = new Date()
      experiment.updatedAt = new Date()
      onUpdateExperiment(prompt?.id || "", experiment)
      
      // Also update local state for live output
      setExperiments(prevExperiments => 
        prevExperiments.map(exp => 
          exp.id === experiment.id ? experiment : exp
        )
      )
      
      setRunningExperiment(null)
    } catch (error) {
      console.error("Experiment failed:", error)
      
      // Mark experiment as failed
      if (run && experiment) {
        run.status = "failed"
        run.updatedAt = new Date()
        experiment.updatedAt = new Date()
        onUpdateExperiment(prompt?.id || "", experiment)
        
        // Also update local state for live output
        setExperiments(prevExperiments => 
          prevExperiments.map(exp => 
            exp.id === experiment.id ? experiment : exp
          )
        )
      }
      
      setRunningExperiment(null)
      
      // Show error to user (you could add a toast notification here)
      alert(`Experiment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
        <div className="h-[calc(100vh-7rem)] border-t bg-background">
          <Tabs defaultValue="datasets" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4 flex-shrink-0">
              <TabsTrigger value="datasets">Datasets</TabsTrigger>
              <TabsTrigger value="experiments">Experiments</TabsTrigger>
              <TabsTrigger value="ai-enhancer">AI Enhancer</TabsTrigger>
            </TabsList>

            <TabsContent value="datasets" className="flex-1 overflow-y-auto m-4 mt-2">
              <div className="space-y-4">
                {/* Add Dataset */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Add Dataset</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Dataset name"
                      value={newDatasetName}
                      onChange={(e) => setNewDatasetName(e.target.value)}
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload CSV File</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label
                          htmlFor="csv-upload"
                          className="flex items-center gap-2 px-3 py-2 border border-input rounded-md cursor-pointer hover:bg-accent"
                        >
                          <Upload className="h-4 w-4" />
                          Choose CSV file
                        </label>
                        {csvFile && (
                          <span className="text-sm text-muted-foreground">
                            {csvFile.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {csvPreview && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Preview: {csvPreview.data.length} rows, {csvPreview.columns.length} columns
                        </p>
                        <div className="max-h-48 overflow-y-auto text-xs">
                          <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-muted">
                              <tr>
                                {csvPreview.columns.map((col, i) => (
                                  <th key={i} className="border px-2 py-1 text-left bg-muted">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvPreview.data.slice(0, 5).map((row, i) => (
                                <tr key={i}>
                                  {csvPreview.columns.map((col, j) => (
                                    <td key={j} className="border px-2 py-1 max-w-32 truncate" title={row[col]}>
                                      {row[col]}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                              {csvPreview.data.length > 5 && (
                                <tr>
                                  <td colSpan={csvPreview.columns.length} className="border px-2 py-1 text-center text-muted-foreground">
                                    ... and {csvPreview.data.length - 5} more rows
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    <Button 
                      onClick={addDataset}
                      disabled={!newDatasetName.trim() || !csvPreview}
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Dataset
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Datasets */}
                {datasets.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Datasets ({datasets.length})</h4>
                    {datasets.map((dataset) => (
                      <Card key={dataset.id} className="bg-muted/30">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm mb-1">{dataset.name}</h5>
                              <p className="text-xs text-muted-foreground">
                                {dataset.data.length} rows, {dataset.columns.length} columns
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Columns: {dataset.columns.join(", ")}
                              </p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                onClick={() => deleteDataset(dataset.id)}
                                className="h-7 px-2 text-destructive hover:text-destructive"
                                >
                                <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="experiments" className="flex-1 overflow-y-auto m-4 mt-2">
              <div className="space-y-4">
                {/* Create New Experiment */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Create New Experiment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Experiment Name</label>
                      <Input
                        placeholder="Enter experiment name..."
                        value={experimentName}
                        onChange={(e) => setExperimentName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Dataset</label>
                      <select
                        value={selectedDatasetId}
                        onChange={(e) => setSelectedDatasetId(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md"
                      >
                        <option value="">Choose a dataset...</option>
                        {datasets.map((dataset) => (
                          <option key={dataset.id} value={dataset.id}>
                            {dataset.name} ({dataset.data.length} rows)
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Prompt</label>
                      <select
                        value={selectedPromptId}
                        onChange={(e) => {
                          setSelectedPromptId(e.target.value)
                          setSelectedPromptVersionId("")
                        }}
                        className="w-full px-3 py-2 border border-input rounded-md"
                      >
                        <option value="">Choose a prompt...</option>
                        {prompts.map((prompt) => (
                          <option key={prompt.id} value={prompt.id}>
                            {prompt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedPromptId && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Prompt Version</label>
                        <select
                          value={selectedPromptVersionId}
                          onChange={(e) => setSelectedPromptVersionId(e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md"
                        >
                          <option value="">Choose a version...</option>
                          {prompts
                            .find(p => p.id === selectedPromptId)
                            ?.versions.map((version) => (
                              <option key={version.id} value={version.id}>
                                {version.branch} - {version.commitMessage} ({version.timestamp.toLocaleDateString()})
                              </option>
                            ))}
                        </select>
                        {selectedPromptVersionId && (
                          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                            <strong>Preview:</strong> {prompts
                              .find(p => p.id === selectedPromptId)
                              ?.versions.find(v => v.id === selectedPromptVersionId)?.prompt.slice(0, 100)}...
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Judge Prompt</label>
                      <Textarea
                        placeholder="Enter the judge prompt to evaluate responses..."
                        value={judgePrompt}
                        onChange={(e) => setJudgePrompt(e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        The judge should return &apos;pass&apos; or &apos;fail&apos; based on the response quality
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={saveExperiment}
                        disabled={!selectedDatasetId || !experimentName.trim() || !selectedPromptId || !selectedPromptVersionId || !judgePrompt.trim()}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        Save Experiment
                      </Button>
                      <Button 
                        onClick={runExperiment}
                        disabled={!selectedDatasetId || !experimentName.trim() || !selectedPromptId || !selectedPromptVersionId || !judgePrompt.trim() || !!runningExperiment}
                        size="sm"
                        className="flex-1"
                      >
                        {runningExperiment ? "Running..." : "Run Experiment"}
                      </Button>
                      {runningExperiment && (
                        <Button 
                          onClick={() => setShowLiveOutput(true)}
                          variant="outline"
                          size="sm"
                        >
                          View Live Output
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Experiments */}
                {experiments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Experiments ({experiments.length})</h4>
                    {experiments.map((experiment) => {
                      const dataset = datasets.find(ds => ds.id === experiment.datasetId)
                      const experimentPrompt = prompts.find(p => p.id === experiment.promptId)
                      const experimentVersion = experimentPrompt?.versions.find(v => v.id === experiment.promptVersionId)

                      const totalResults = experiment.runs.reduce((sum, run) => sum + run.results.length, 0)
                      const passCount = experiment.runs.reduce((sum, run) => 
                        sum + run.results.filter(r => r.rating === "pass").length, 0)
                      const passRate = totalResults > 0 ? ((passCount / totalResults) * 100).toFixed(1) : "0"
                      
                      return (
                        <Card key={experiment.id} className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-sm mb-1">{experiment.name}</h5>
                                <p className="text-xs text-muted-foreground">
                                  Dataset: {dataset?.name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Prompt: {experimentPrompt?.name || "Unknown"} ({experimentVersion?.branch || "Unknown"})
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {experiment.runs.length} runs • {passCount}/{totalResults} passed ({passRate}%)
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Created: {experiment.createdAt.toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => editExperiment(experiment)}
                                  className="h-7 px-2"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rerunExperiment(experiment)}
                                  disabled={!!runningExperiment}
                                  className="h-7 px-2"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                                {totalResults > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                    onClick={() => viewExperimentResults(experiment)}
                                >
                                    View Results
                                </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onDeleteExperiment(prompt?.id || "", experiment.id)}
                                  className="h-7 px-2 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                        </CardContent>
                      </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ai-enhancer" className="flex-1 overflow-y-auto m-4 mt-2">
              {/* Content for AI Enhancer tab will go here */}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Experiment Results Detail Panel */}
      {showResultDetails && selectedExperiment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">{selectedExperiment.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedExperiment.runs.length} runs • 
                  {selectedExperiment.runs.reduce((sum, run) => sum + run.results.length, 0)} total results
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowResultDetails(false)
                  setSelectedExperiment(null)
                  setSelectedResult(null)
                }}
              >
                Close
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Results Table */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Results</h4>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">#</th>
                          <th className="text-left p-2">Rating</th>
                          <th className="text-left p-2">Input Preview</th>
                          <th className="text-left p-2">Output Preview</th>
                          <th className="text-left p-2">Judge Output</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedExperiment.runs.flatMap((run, runIndex) => 
                          run.results.map((result, resultIndex) => (
                            <tr 
                              key={result.id} 
                              className={`border-t cursor-pointer hover:bg-muted/50 ${
                                selectedResult?.id === result.id ? 'bg-muted' : ''
                              }`}
                              onClick={() => viewResultDetails(result)}
                            >
                              <td className="p-2">{runIndex + 1}.{resultIndex + 1}</td>
                              <td className="p-2">
                                <Badge variant={result.rating === "pass" ? "default" : "destructive"}>
                                  {result.rating}
                                </Badge>
                              </td>
                              <td className="p-2 max-w-48">
                                <div className="truncate" title={JSON.stringify(result.input)}>
                                  {Object.values(result.input).slice(0, 2).join(", ")}
                                </div>
                              </td>
                              <td className="p-2 max-w-48">
                                <div className="truncate" title={result.output}>
                                  {result.output}
                                </div>
                              </td>
                              <td className="p-2 max-w-32">
                                <div className="truncate" title={result.judgeOutput}>
                                  {result.judgeOutput}
                                </div>
                              </td>
                              <td className="p-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    viewResultDetails(result)
                                  }}
                                >
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Result Details Side Panel */}
              {selectedResult && (
                <div className="w-96 border-l bg-muted/30 overflow-y-auto">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Result Details</h4>
                      <Badge variant={selectedResult.rating === "pass" ? "default" : "destructive"}>
                        {selectedResult.rating}
                      </Badge>
                    </div>

                    {/* Input Data */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Input Data</Label>
                      <div className="bg-background border rounded-md p-3 max-h-32 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(selectedResult.input, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Output */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Output</Label>
                      <div className="bg-background border rounded-md p-3 max-h-48 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">
                          {selectedResult.output}
                        </pre>
                      </div>
                    </div>

                    {/* Judge Output */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Judge Output</Label>
                      <div className="bg-background border rounded-md p-3 max-h-32 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">
                          {selectedResult.judgeOutput}
                        </pre>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground">
                      Timestamp: {selectedResult.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Output Modal */}
      {showLiveOutput && runningExperiment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Live Experiment Output</h3>
                <p className="text-sm text-muted-foreground">
                  Watching experiment run in real-time...
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLiveOutput(false)}
              >
                Close
              </Button>
            </div>

            {/* Live Output Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Results Table */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {experiments.map((experiment) => {
                    const currentRun = experiment.runs.find(run => run.id === runningExperiment)
                    if (!currentRun) return null

                    return (
                      <div key={experiment.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{experiment.name}</h4>
                          <Badge variant={currentRun.status === "running" ? "default" : "secondary"}>
                            {currentRun.status}
                          </Badge>
                        </div>
                        
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="text-left p-2">#</th>
                                <th className="text-left p-2">Rating</th>
                                <th className="text-left p-2">Input Preview</th>
                                <th className="text-left p-2">Output Preview</th>
                                <th className="text-left p-2">Judge Output</th>
                                <th className="text-left p-2">Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentRun.results.map((result, index) => (
                                <tr 
                                  key={result.id} 
                                  className={`border-t cursor-pointer hover:bg-muted/50 ${selectedResult?.id === result.id ? 'bg-muted' : ''}`}
                                  onClick={() => setSelectedResult(result)}
                                >
                                  <td className="p-2">{index + 1}</td>
                                  <td className="p-2">
                                    <Badge variant={result.rating === "pass" ? "default" : "destructive"}>
                                      {result.rating}
                                    </Badge>
                                  </td>
                                  <td className="p-2 max-w-48">
                                    <div className="truncate" title={JSON.stringify(result.input)}>
                                      {Object.values(result.input).slice(0, 2).join(", ")}
                                    </div>
                                  </td>
                                  <td className="p-2 max-w-48">
                                    <div className="truncate" title={result.output}>
                                      {result.output}
                                    </div>
                                  </td>
                                  <td className="p-2 max-w-32">
                                    <div className="truncate" title={result.judgeOutput}>
                                      {result.judgeOutput}
                                    </div>
                                  </td>
                                  <td className="p-2 text-xs text-muted-foreground">
                                    {result.timestamp.toLocaleTimeString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {currentRun.status === "running" && (
                          <div className="text-center py-4">
                            <div className="animate-pulse text-sm text-muted-foreground">
                              Processing next row...
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Result Details Side Panel */}
              <div className="w-96 border-l bg-muted/30 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {(() => {
                    // Find the current experiment and run
                    const experiment = experiments.find(exp => exp.runs.some(run => run.id === runningExperiment))
                    const currentRun = experiment?.runs.find(run => run.id === runningExperiment)
                    if (!currentRun) return <div className="text-center text-muted-foreground">No run found.</div>
                    if (currentRun.results.length === 0) {
                      return <div className="text-center text-muted-foreground">Waiting for results...</div>
                    }
                    if (!selectedResult) {
                      return <div className="text-center text-muted-foreground">Select a row to view details.</div>
                    }
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Result Details</h4>
                          <Badge variant={selectedResult.rating === "pass" ? "default" : "destructive"}>
                            {selectedResult.rating}
                          </Badge>
                        </div>
                        {/* Input Data */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Input Data</Label>
                          <div className="bg-background border rounded-md p-3 max-h-32 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap">
                              {JSON.stringify(selectedResult.input, null, 2)}
                            </pre>
                          </div>
                        </div>
                        {/* Output */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Output</Label>
                          <div className="bg-background border rounded-md p-3 max-h-48 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap">
                              {selectedResult.output}
                            </pre>
                          </div>
                        </div>
                        {/* Judge Output */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Judge Output</Label>
                          <div className="bg-background border rounded-md p-3 max-h-32 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap">
                              {selectedResult.judgeOutput}
                            </pre>
                          </div>
                        </div>
                        {/* Timestamp */}
                        <div className="text-xs text-muted-foreground">
                          Timestamp: {selectedResult.timestamp.toLocaleString()}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Experiment Dialog */}
      {showEditDialog && editingExperiment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Experiment</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEditDialog(false)
                    setEditingExperiment(null)
                    setExperimentName("")
                    setSelectedDatasetId("")
                    setSelectedPromptId("")
                    setSelectedPromptVersionId("")
                    setJudgePrompt("")
                  }}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Experiment Name</label>
                  <Input
                    placeholder="Enter experiment name..."
                    value={experimentName}
                    onChange={(e) => setExperimentName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Dataset</label>
                  <select
                    value={selectedDatasetId}
                    onChange={(e) => setSelectedDatasetId(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    <option value="">Choose a dataset...</option>
                    {datasets.map((dataset) => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.name} ({dataset.data.length} rows)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Prompt</label>
                  <select
                    value={selectedPromptId}
                    onChange={(e) => {
                      setSelectedPromptId(e.target.value)
                      setSelectedPromptVersionId("")
                    }}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    <option value="">Choose a prompt...</option>
                    {prompts.map((prompt) => (
                      <option key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedPromptId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Prompt Version</label>
                    <select
                      value={selectedPromptVersionId}
                      onChange={(e) => setSelectedPromptVersionId(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="">Choose a version...</option>
                      {prompts
                        .find(p => p.id === selectedPromptId)
                        ?.versions.map((version) => (
                          <option key={version.id} value={version.id}>
                            {version.branch} - {version.commitMessage} ({version.timestamp.toLocaleDateString()})
                          </option>
                        ))}
                    </select>
                    {selectedPromptVersionId && (
                      <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                        <strong>Preview:</strong> {prompts
                          .find(p => p.id === selectedPromptId)
                          ?.versions.find(v => v.id === selectedPromptVersionId)?.prompt.slice(0, 100)}...
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Judge Prompt</label>
                  <Textarea
                    placeholder="Enter the judge prompt to evaluate responses..."
                    value={judgePrompt}
                    onChange={(e) => setJudgePrompt(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    The judge should return &apos;pass&apos; or &apos;fail&apos; based on the response quality
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={saveEditedExperiment}
                  disabled={!selectedDatasetId || !experimentName.trim() || !selectedPromptId || !selectedPromptVersionId || !judgePrompt.trim()}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false)
                    setEditingExperiment(null)
                    setExperimentName("")
                    setSelectedDatasetId("")
                    setSelectedPromptId("")
                    setSelectedPromptVersionId("")
                    setJudgePrompt("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 