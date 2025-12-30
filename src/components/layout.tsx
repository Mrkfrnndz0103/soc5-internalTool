import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Search, Mail, Bell, Calendar, Settings, User, Home, ChevronRight, LayoutDashboard, Eye, FileText, AlertCircle, Grid3x3, Briefcase, TrendingUp, Truck, Keyboard } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { ThemePresetSelector } from "@/components/theme-preset-selector"
import { ChatPopup } from "@/components/chat-popup"
import { useAuth } from "@/contexts/auth-context"

const pageTitle: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/outbound/dispatch-report": "Dispatch Report",
  "/outbound/prealert": "Prealert Database",
  "/outbound/dispatch-monitoring": "Dispatch Monitoring",
  "/outbound/bay-allocation": "Per Bay Allocation",
  "/kpi/mdt": "MDT Performance",
  "/kpi/workstation": "Workstation Metrics",
  "/kpi/productivity": "Productivity Tracking",
  "/kpi/intraday": "Intraday Analytics",
  "/midmile/truck-request": "Truck Request Management",
}

export function Layout() {
  const { user } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const location = useLocation()
  const [lastPath, setLastPath] = useState(location.pathname)

  useEffect(() => {
    if (location.pathname !== lastPath) {
      setIsSidebarCollapsed(false)
      setLastPath(location.pathname)
    }
  }, [location.pathname, lastPath])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
        searchInput?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const currentPageTitle = pageTitle[location.pathname] || "Outbound Tool"

  const handleSidebarClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button')) {
      return
    }
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const getPageIcon = () => {
    const path = location.pathname
    if (path === "/dashboard") return <LayoutDashboard className="h-3 w-3" />
    if (path === "/outbound/dispatch-monitoring") return <Eye className="h-3 w-3" />
    if (path === "/outbound/dispatch-report") return <FileText className="h-3 w-3" />
    if (path === "/outbound/prealert") return <AlertCircle className="h-3 w-3" />
    if (path === "/outbound/bay-allocation") return <Grid3x3 className="h-3 w-3" />
    if (path.startsWith("/outbound/admin")) return <Briefcase className="h-3 w-3" />
    if (path.startsWith("/kpi")) return <TrendingUp className="h-3 w-3" />
    if (path.startsWith("/midmile")) return <Truck className="h-3 w-3" />
    return <Home className="h-3 w-3" />
  }

  const getUserAvatar = () => {
    const avatars = [
      "from-orange-400 to-pink-400",
      "from-blue-400 to-purple-400",
      "from-green-400 to-teal-400",
      "from-red-400 to-orange-400",
      "from-purple-400 to-pink-400"
    ]
    const hash = (user?.name || "").split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return avatars[hash % avatars.length]
  }

  return (
    <div className="app-container flex h-full overflow-hidden bg-background">
      <div 
        onClick={handleSidebarClick}
        className="cursor-pointer transition-all duration-300 ease-in-out hover:shadow-lg"
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <header className="flex h-20 items-center justify-between bg-card px-8 border-b shadow-md">
          {/* Modern Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full group">
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
          <div className="flex items-center gap-2 flex-shrink-0">
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

            <ThemePresetSelector />
            <ThemeToggle />

            <div className="w-px h-6 bg-border flex-shrink-0" />

            {/* User Info */}
            <div className="flex items-center gap-3 pl-2 min-w-0">
              <div className="text-right min-w-0 max-w-[200px]">
                <div className="text-m font-semibold leading-tight truncate">{user?.name || "User"}</div>
                <div className="text-[12px] text-muted-foreground truncate">{user?.role || "Role"}</div>
              </div>
              <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${getUserAvatar()} flex items-center justify-center shadow-md flex-shrink-0`}>
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{currentPageTitle}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getPageIcon()}
                <span>Home</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium">{currentPageTitle}</span>
              </div>
            </div>
            <Outlet />
          </div>
        </div>
      </div>

      <ChatPopup />
    </div>
  )
}
