"use client"

import { format } from "date-fns"
import { FileText, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { Prompt } from "./main-app"
import { UserData } from "./google-login"
interface SidebarProps {
  prompts: Prompt[]
  selectedPrompt: Prompt | null
  onSelectPrompt: (prompt: Prompt) => void
  user: UserData
  onSettings: () => void
  onLogout: () => void
}

export function Sidebar({ prompts, selectedPrompt, onSelectPrompt, user, onSettings, onLogout }: SidebarProps) {
  const sortedPrompts = prompts.toReversed();
  
  return (
    <SidebarComponent className="w-">
      <SidebarHeader className="p-4">
        {/* App Branding */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          <img src="/JudgementDay.png" alt="JudgementDay" className="h-8 w-8" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold">JudgementDay</h1>
            <p className="text-xs text-muted-foreground">AI Prompt Version Control</p>
          </div>
        </div>
        
        {/* User Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="px-4 py-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Your Prompts ({prompts.length})</h3>
        </div>

        <ScrollArea className="flex-1">
          <SidebarMenu>
            {sortedPrompts.map((prompt) => (
              <SidebarMenuItem key={prompt.id}>
                <SidebarMenuButton
                  onClick={() => onSelectPrompt(prompt)}
                  isActive={selectedPrompt?.id === prompt.id}
                  className="w-full justify-start p-4"
                  size="lg"
                >
                  <FileText className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{prompt.name}</div>
                    <div className="text-xs text-muted-foreground">{format(prompt.lastAccessed, "MMM d, yyyy")}</div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <Button variant="outline" size="sm" onClick={onSettings} className="w-full justify-start">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button variant="outline" size="sm" onClick={onLogout} className="w-full justify-start">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </SidebarComponent>
  )
}
