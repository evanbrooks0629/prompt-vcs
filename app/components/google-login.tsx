"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export interface UserData {
  id: string
  email: string
  name: string
  picture: string
}

interface GoogleLoginProps {
  onLogin: (userData: UserData) => void
}

export function GoogleLogin({ onLogin }: GoogleLoginProps) {
  const [email, setEmail] = useState("")

  // Simulated Google login for demo purposes
  const handleLogin = () => {
    if (email) {
      // Check if user data exists in localStorage for this email
      const existingUserData = localStorage.getItem(email)
      
      let userData
      if (existingUserData) {
        // Restore existing user data
        userData = JSON.parse(existingUserData)
      } else {
        // Create new user data
        userData = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          name: email.split("@")[0],
          picture: `https://api.dicebear.com/9.x/adventurer/svg?seed=Easton&skinColor=ecad80&backgroundColor=b6e3f4`,
        }
        // Store new user data with email as key
        localStorage.setItem(email, JSON.stringify(userData))
      }
      
      // Also store current user reference
      localStorage.setItem("currentUser", email)
      onLogin(userData)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Diagonal lines background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 20px,
            #9ca3af 20px,
            #9ca3af 21px
          )`
        }}
      />
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            PromptVCS
          </CardTitle>
          <CardDescription>Version control for your AI prompts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button onClick={handleLogin} className="w-full" disabled={!email}>
            Sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
