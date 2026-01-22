"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react"
import { authApi } from "@/lib/api"

export interface User {
  ops_id?: string
  name: string
  role: "FTE" | "Backroom" | "Data Team" | "Admin" | "Processor"
  email?: string
  department?: string
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  isAuthenticated: boolean
  isReady: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const LAST_ACTIVE_KEY = "auth_last_active"
const IDLE_TIMEOUT_MS = 60 * 60 * 1000

type AuthState = {
  user: User | null
  isReady: boolean
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isReady: false,
  })
  const lastActivityRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    const hydrateSession = async () => {
      const response = await authApi.getSession()
      if (cancelled) return
      const nextUser = response.data?.user ?? null
      if (nextUser) {
        const now = Date.now()
        localStorage.setItem(LAST_ACTIVE_KEY, String(now))
        lastActivityRef.current = now
      }

      setAuthState({
        user: nextUser,
        isReady: true,
      })
    }

    hydrateSession().catch(() => {
      if (cancelled) return
      setAuthState({ user: null, isReady: true })
    })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback((userData: User) => {
    const now = Date.now()
    localStorage.setItem(LAST_ACTIVE_KEY, String(now))
    lastActivityRef.current = now
    setAuthState({
      user: userData,
      isReady: true,
    })
  }, [])

  const logout = useCallback(() => {
    void authApi.logout().catch(() => undefined)
    localStorage.removeItem(LAST_ACTIVE_KEY)
    lastActivityRef.current = 0
    setAuthState((prev) => ({
      user: null,
      isReady: prev.isReady,
    }))
  }, [])

  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState((prev) => {
      if (!prev.user) return prev
      const updatedUser = { ...prev.user, ...userData }
      return { ...prev, user: updatedUser }
    })
  }, [])

  useEffect(() => {
    if (!authState.user) return

    const updateActivity = () => {
      const now = Date.now()
      if (now - lastActivityRef.current < 30000) return
      lastActivityRef.current = now
      localStorage.setItem(LAST_ACTIVE_KEY, String(now))
    }

    const checkIdle = () => {
      const lastActiveRaw = localStorage.getItem(LAST_ACTIVE_KEY)
      const lastActive = lastActiveRaw ? Number(lastActiveRaw) : 0
      if (!lastActive) return
      if (Date.now() - lastActive > IDLE_TIMEOUT_MS) {
        logout()
      }
    }

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"]
    events.forEach((event) => window.addEventListener(event, updateActivity, { passive: true }))
    const intervalId = window.setInterval(checkIdle, 60000)

    return () => {
      events.forEach((event) => window.removeEventListener(event, updateActivity))
      window.clearInterval(intervalId)
    }
  }, [authState.user, logout])

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        login,
        logout,
        updateUser,
        isAuthenticated: !!authState.user,
        isReady: authState.isReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
