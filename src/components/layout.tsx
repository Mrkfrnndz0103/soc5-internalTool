import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { Menu, LogOut, User, Bell, Search, Settings } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ThemePresetSelector } from "@/components/theme-preset-selector"
import { ChatPopup } from "@/components/chat-popup"
import { useAuth } from "@/contexts/auth-context"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const currentPageTitle = pageTitle[location.pathname] || "Outbound Tool"

  return (
    <div className="app-container flex h-full overflow-hidden bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between bg-card px-8 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="h-9 w-9 hover:bg-accent transition-all duration-200"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {currentPageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent transition-all duration-200">
              <Bell className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent transition-all duration-200">
              <Search className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent transition-all duration-200">
              <Settings className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border" />

            <ThemePresetSelector />
            <ThemeToggle />

            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums tracking-tight">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </div>
              <div className="text-sm font-semibold text-muted-foreground">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 h-9 hover:bg-accent transition-all duration-200">
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
                    {user?.name?.charAt(0) || user?.ops_id?.charAt(0) || "U"}
                  </div>
                  <span className="font-semibold text-sm">{user?.name || user?.ops_id}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <User className="mr-2 h-4 w-4" />
                  <span>
                    {user?.role === "FTE" ? user?.email : `Ops ID: ${user?.ops_id}`}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  Role: {user?.role}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </div>
      </div>

      <ChatPopup />
    </div>
  )
}
