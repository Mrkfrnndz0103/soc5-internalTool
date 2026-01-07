"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react"

export interface User {
  ops_id?: string
  name: string
  role: "FTE" | "Backroom" | "Data Team" | "Admin"
  email?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (userData: User, authToken: string) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  isAuthenticated: boolean
  isReady: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_KEY = "user"
const TOKEN_KEY = "token"
const LAST_ACTIVE_KEY = "auth_last_active"
const IDLE_TIMEOUT_MS = 60 * 60 * 1000

type AuthState = {
  user: User | null
  token: string | null
  isReady: boolean
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isReady: false,
  })
  const lastActivityRef = useRef(0)

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY)
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const lastActiveRaw = localStorage.getItem(LAST_ACTIVE_KEY)
    const now = Date.now()
    const lastActive = lastActiveRaw ? Number(lastActiveRaw) : now
    let nextUser: User | null = null
    let nextToken: string | null = null

    if (storedUser && storedToken) {
      const isLastActiveValid = Number.isFinite(lastActive) ? lastActive : now
      const shouldRestore = now - isLastActiveValid <= IDLE_TIMEOUT_MS

      if (!lastActiveRaw || !Number.isFinite(lastActive)) {
        localStorage.setItem(LAST_ACTIVE_KEY, String(now))
        lastActivityRef.current = now
      } else {
        lastActivityRef.current = isLastActiveValid
      }

      if (shouldRestore) {
        try {
          nextUser = JSON.parse(storedUser)
          nextToken = storedToken
        } catch {
          localStorage.removeItem(USER_KEY)
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(LAST_ACTIVE_KEY)
        }
      } else {
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(LAST_ACTIVE_KEY)
      }
    } else if (storedUser || storedToken) {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(LAST_ACTIVE_KEY)
    }

    setAuthState({
      user: nextUser,
      token: nextToken,
      isReady: true,
    })
  }, [])

  const login = useCallback((userData: User, authToken: string) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    localStorage.setItem(TOKEN_KEY, authToken)
    const now = Date.now()
    localStorage.setItem(LAST_ACTIVE_KEY, String(now))
    lastActivityRef.current = now
    setAuthState({
      user: userData,
      token: authToken,
      isReady: true,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(LAST_ACTIVE_KEY)
    lastActivityRef.current = 0
    setAuthState((prev) => ({
      user: null,
      token: null,
      isReady: prev.isReady,
    }))
  }, [])

  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState((prev) => {
      if (!prev.user) return prev
      const updatedUser = { ...prev.user, ...userData }
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
      return { ...prev, user: updatedUser }
    })
  }, [])

  useEffect(() => {
    if (!authState.user || !authState.token) return

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
  }, [authState.user, authState.token, logout])

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        login,
        logout,
        updateUser,
        isAuthenticated: !!authState.user && !!authState.token,
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
