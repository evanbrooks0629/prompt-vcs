"use client"

import { useState, useEffect } from "react"
import { GoogleLogin, UserData } from "./components/google-login"
import { MainApp } from "./components/main-app"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    // Check if user is already authenticated
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (userData: UserData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    // Remove current user reference but keep user data
    localStorage.removeItem("currentUser")
  }

  if (!isAuthenticated) {
    return <GoogleLogin onLogin={handleLogin} />
  }

  return <MainApp user={user} onLogout={handleLogout} />
}
