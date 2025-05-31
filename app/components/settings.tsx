"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Key, Save, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationContainer } from "@/components/ui/notification"
import { useNotifications } from "@/hooks/use-notifications"
import { UserData } from "./google-login"

interface SettingsProps {
  user: UserData
  onBack: () => void
  onLogout: () => void
}

export function Settings({ user, onBack, onLogout }: SettingsProps) {
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    anthropic: "",
    google: "",
    cohere: "",
  })

  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    google: false,
    cohere: false,
  })

  const { notifications, addNotification } = useNotifications()

  useEffect(() => {
    // Load API keys from localStorage
    const savedSettings = localStorage.getItem("api_settings")
    if (savedSettings) {
      setApiKeys(JSON.parse(savedSettings))
    }
  }, [])

  const saveApiKeys = () => {
    localStorage.setItem("api_settings", JSON.stringify(apiKeys))
    addNotification({
      type: "success",
      title: "Settings Saved",
      message: "Your API keys have been saved securely.",
      duration: 4000
    })
  }

  const updateApiKey = (provider: keyof typeof apiKeys, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }))
  }

  const toggleShowKey = (provider: keyof typeof apiKeys) => {
    setShowKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }))
  }

  return (
    <div className="h-screen bg-background">
      <div className="border-b">
        <div className="flex h-14 items-center px-4 gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="api-keys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Configure your API keys for different AI providers. Keys are stored locally in your browser.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">OpenAI API Key</Label>
                    <div className="relative">
                      <Input
                        id="openai-key"
                        type={showKeys.openai ? "text" : "password"}
                        placeholder="sk-..."
                        value={apiKeys.openai}
                        onChange={(e) => updateApiKey("openai", e.target.value)}
                        className="pr-10"
                      />
                      {apiKeys.openai && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => toggleShowKey("openai")}
                        >
                          {showKeys.openai ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required for GPT models. Get your key from{" "}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        OpenAI Platform
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                    <div className="relative">
                      <Input
                        id="anthropic-key"
                        type={showKeys.anthropic ? "text" : "password"}
                        placeholder="sk-ant-..."
                        value={apiKeys.anthropic}
                        onChange={(e) => updateApiKey("anthropic", e.target.value)}
                        className="pr-10"
                      />
                      {apiKeys.anthropic && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => toggleShowKey("anthropic")}
                        >
                          {showKeys.anthropic ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required for Claude models. Get your key from{" "}
                      <a
                        href="https://console.anthropic.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Anthropic Console
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google-key">Google AI API Key</Label>
                    <div className="relative">
                      <Input
                        id="google-key"
                        type={showKeys.google ? "text" : "password"}
                        placeholder="AIza..."
                        value={apiKeys.google}
                        onChange={(e) => updateApiKey("google", e.target.value)}
                        className="pr-10"
                      />
                      {apiKeys.google && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => toggleShowKey("google")}
                        >
                          {showKeys.google ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required for Gemini models. Get your key from{" "}
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cohere-key">Cohere API Key</Label>
                    <div className="relative">
                      <Input
                        id="cohere-key"
                        type={showKeys.cohere ? "text" : "password"}
                        placeholder="co-..."
                        value={apiKeys.cohere}
                        onChange={(e) => updateApiKey("cohere", e.target.value)}
                        className="pr-10"
                      />
                      {apiKeys.cohere && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => toggleShowKey("cohere")}
                        >
                          {showKeys.cohere ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required for Cohere models. Get your key from{" "}
                      <a
                        href="https://dashboard.cohere.ai/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Cohere Dashboard
                      </a>
                    </p>
                  </div>
                </div>

                <Button onClick={saveApiKeys} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save API Keys
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="text-lg">{user.name[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="destructive" onClick={onLogout}>
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <NotificationContainer notifications={notifications} />
    </div>
  )
}
