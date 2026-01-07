"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { usePathname } from "next/navigation"
import { Search, Mail, Bell, Calendar, Settings, User, Home, ChevronRight, LayoutDashboard, Eye, FileText, AlertCircle, Grid3x3, Briefcase, TrendingUp, Truck, Keyboard, Database } from "lucide-react"
import { Sidebar, SidebarPopupType } from "@/components/sidebar"
import { AnimatedPage } from "@/components/animated-page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { ChatPopup } from "@/components/chat-popup"
import { MessagesPopup } from "@/components/messages-popup"
import { NotificationsPopup } from "@/components/notifications-popup"
import { HelpPopup } from "@/components/help-popup"
import { SettingsPopup } from "@/components/settings-popup"
import { useAuth } from "@/contexts/auth-context"
import { LoginModal } from "@/screens/login"

const pageTitle: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/outbound/dispatch-report": "Dispatch Report",
  "/outbound/prealert": "Prealert Database",
  "/outbound/dispatch-monitoring": "Dispatch Monitoring",
  "/outbound/bay-allocation": "Per Bay Allocation",
  "/data-team/prealert": "Prealert Database",
  "/data-team/socpacked-update": "SOCPacked Update",
  "/data-team/file-upload": "File Upload",
  "/data-team/validation/stuckup": "Stuckup Validation",
  "/data-team/validation/shortlanded": "Shortlanded Validation",
  "/admin/attendance": "Attendance",
  "/admin/masterfile": "Masterfile",
  "/admin/attendance-history": "Attendance History",
  "/admin/breaktime": "Breaktime Management",
  "/admin/leave": "Leave Management",
  "/admin/workstation": "Workstation",
  "/kpi/mdt": "MDT Performance",
  "/kpi/workstation": "Workstation Metrics",
  "/kpi/productivity": "Productivity Tracking",
  "/kpi/intraday": "Intraday Analytics",
  "/midmile/truck-request": "Truck Request Management",
}

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activePopup, setActivePopup] = useState<SidebarPopupType>(null)
  const [minimizedPopups, setMinimizedPopups] = useState<Set<SidebarPopupType>>(new Set())
  const pathname = usePathname()
  const [lastPath, setLastPath] = useState(pathname)

  const handlePopupChange = (popup: SidebarPopupType) => {
    if (activePopup === popup) {
      setActivePopup(null)
      setMinimizedPopups(prev => {
        const next = new Set(prev)
        next.delete(popup)
        return next
      })
    } else {
      setActivePopup(popup)
      setMinimizedPopups(prev => {
        const next = new Set(prev)
        next.delete(popup)
        return next
      })
    }
  }

  const toggleMinimize = (popup: SidebarPopupType) => {
    setMinimizedPopups(prev => {
      const next = new Set(prev)
      if (next.has(popup)) {
        next.delete(popup)
      } else {
        next.add(popup)
      }
      return next
    })
  }

  const closePopup = (popup: SidebarPopupType) => {
    if (activePopup === popup) {
      setActivePopup(null)
    }
    setMinimizedPopups(prev => {
      const next = new Set(prev)
      next.delete(popup)
      return next
    })
  }

  useEffect(() => {
    if (pathname && pathname !== lastPath) {
      setIsSidebarCollapsed(false)
      setLastPath(pathname)
    }
  }, [pathname, lastPath])

  // Memoized keyboard handler to prevent recreation
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault()
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
      searchInput?.focus()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const currentPageTitle = (pathname && pageTitle[pathname]) || "Outbound Tool"

  const handleSidebarClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button')) {
      return
    }
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const getPageIcon = (size: "sm" | "lg" = "sm") => {
    const iconClassName = size === "lg" ? "h-5 w-5" : "h-4 w-4"
    const path = pathname || "/"
    if (path === "/dashboard") return <LayoutDashboard className={iconClassName} />
    if (path === "/outbound/dispatch-monitoring") return <Eye className={iconClassName} />
    if (path === "/outbound/dispatch-report") return <FileText className={iconClassName} />
    if (path === "/outbound/prealert") return <AlertCircle className={iconClassName} />
    if (path === "/outbound/bay-allocation") return <Grid3x3 className={iconClassName} />
    if (path.startsWith("/data-team")) return <Database className={iconClassName} />
    if (path.startsWith("/admin")) return <Briefcase className={iconClassName} />
    if (path.startsWith("/kpi")) return <TrendingUp className={iconClassName} />
    if (path.startsWith("/midmile")) return <Truck className={iconClassName} />
    return <Home className={iconClassName} />
  }

  // Memoize avatar calculation to prevent recalculation on every render
  const userAvatar = useMemo(() => {
    const avatars = [
      "from-orange-400 to-pink-400",
      "from-blue-400 to-purple-400",
      "from-green-400 to-teal-400",
      "from-red-400 to-orange-400",
      "from-purple-400 to-pink-400"
    ]
    const hash = (user?.name || "").split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return avatars[hash % avatars.length]
  }, [user?.name])

  return (
    <div className="app-container flex h-screen overflow-hidden bg-background">
      <div 
        onClick={handleSidebarClick}
        className="cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg"
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activePopup={activePopup}
          onPopupChange={handlePopupChange}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <header className="grid h-20 grid-cols-[auto,1fr,auto] items-center gap-6 bg-card px-8 border-b shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-sm ring-1 ring-primary/10">
                {getPageIcon("lg")}
              </span>
              <span className="text-foreground font-extrabold text-2xl lg:text-3xl tracking-tight truncate">
                {currentPageTitle}
              </span>
            </div>
          </div>

          {/* Modern Search Bar */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary z-10 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
              <Input
                placeholder="Search tasks, reports, or navigate..."
                className="relative z-10 pl-14 pr-20 h-12 text-base font-medium bg-primary/5 border-2 border-primary/30 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:scale-[1.02] hover:border-primary/60 hover:-translate-y-0.5"
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none inline-flex h-7 select-none items-center gap-1 rounded-md border-2 border-primary/40 bg-primary/15 px-2.5 font-mono text-sm font-bold text-primary shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-primary/60">
                <Keyboard className="h-4 w-4" />
                /
              </kbd>
            </div>
          </div>

          {/* Right Side Icons and User Info */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-accent/50 rounded-xl flex-shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-lg group">
              <Mail className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" />
            </Button>

            <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-accent/50 rounded-xl flex-shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-lg group">
              <Bell className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:animate-pulse" />
            </Button>

            <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-accent/50 rounded-xl flex-shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-lg group">
              <Calendar className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
            </Button>

            <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-accent/50 rounded-xl flex-shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-lg group">
              <Settings className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-90" />
            </Button>

            <div className="w-px h-6 bg-border ml-2 flex-shrink-0" />

            <ThemeToggle />

            <div className="w-px h-6 bg-border flex-shrink-0" />

            {/* User Info */}
            <div className="flex items-center gap-3 pl-2 min-w-0">
              <div className="text-right min-w-0 max-w-[200px]">
                <div className="text-m font-semibold leading-tight truncate">{user?.name || "User"}</div>
                <div className="text-[12px] text-muted-foreground truncate">{user?.role || "Role"}</div>
              </div>
              <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${userAvatar} flex items-center justify-center shadow-md flex-shrink-0`}>
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pb-6 pt-4">
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
                <span className="text-primary">{getPageIcon("sm")}</span>
                <span className="font-medium">Home</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-semibold">{currentPageTitle}</span>
              </div>
            </div>
            <AnimatedPage>{children}</AnimatedPage>
          </div>
        </div>
      </div>

      {/* Chat Support - always rendered, self-contained */}
      <ChatPopup />

      {/* Sidebar Popups */}
      <MessagesPopup
        isOpen={activePopup === "messages"}
        onClose={() => closePopup("messages")}
        isMinimized={minimizedPopups.has("messages")}
        onToggleMinimize={() => toggleMinimize("messages")}
      />

      <NotificationsPopup
        isOpen={activePopup === "notifications"}
        onClose={() => closePopup("notifications")}
        isMinimized={minimizedPopups.has("notifications")}
        onToggleMinimize={() => toggleMinimize("notifications")}
      />

      <HelpPopup
        isOpen={activePopup === "help"}
        onClose={() => closePopup("help")}
        isMinimized={minimizedPopups.has("help")}
        onToggleMinimize={() => toggleMinimize("help")}
      />

      <SettingsPopup
        isOpen={activePopup === "settings"}
        onClose={() => closePopup("settings")}
        isMinimized={minimizedPopups.has("settings")}
        onToggleMinimize={() => toggleMinimize("settings")}
      />

      <LoginModal />
    </div>
  )
}
