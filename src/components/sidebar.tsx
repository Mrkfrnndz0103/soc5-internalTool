"use client"

import type React from "react"
import { useState, useCallback, memo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, LayoutDashboard, Package, TrendingUp, Truck, Bell, HelpCircle, Settings, Eye, FileText, AlertCircle, Grid3x3, Users, Calendar, Clock, Briefcase, BarChart3, Zap, MapPin, Database, Upload, CheckCircle, AlertTriangle, Anchor, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SpxLogo } from "@/components/spx-logo"
import { isModuleEnabled, type ModuleKey } from "@/lib/module-flags"

export type SidebarPopupType = "chat" | "messages" | "notifications" | "help" | "settings" | null

interface SubMenuItem {
  title: string
  path: string
  icon?: React.ReactNode
  subItems?: SubMenuItem[]
}

interface MenuItem {
  title: string
  path: string
  icon: React.ReactNode
  moduleKey: ModuleKey
  subItems?: SubMenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    moduleKey: "dashboard",
  },
  {
    title: "Outbound",
    path: "/outbound",
    icon: <Package className="h-5 w-5" />,
    moduleKey: "outbound",
    subItems: [
      { title: "Dispatch Monitoring", path: "/outbound/dispatch-monitoring", icon: <Eye className="h-4 w-4" /> },
      { title: "Dispatch Report", path: "/outbound/dispatch-report", icon: <FileText className="h-4 w-4" /> },
      { title: "Prealert", path: "/outbound/prealert", icon: <AlertCircle className="h-4 w-4" /> },
      { title: "Per Bay Allocation", path: "/outbound/bay-allocation", icon: <Grid3x3 className="h-4 w-4" /> },
    ],
  },
  {
    title: "Data Team",
    path: "/data-team",
    icon: <Database className="h-5 w-5" />,
    moduleKey: "data-team",
    subItems: [
      { title: "Prealert", path: "/data-team/prealert", icon: <AlertCircle className="h-4 w-4" /> },
      { title: "SOCPacked Update", path: "/data-team/socpacked-update", icon: <CheckCircle className="h-4 w-4" /> },
      { title: "File Upload", path: "/data-team/file-upload", icon: <Upload className="h-4 w-4" /> },
      {
        title: "Validation",
        path: "/data-team/validation",
        icon: <CheckCircle className="h-4 w-4" />,
        subItems: [
          { title: "Stuckup", path: "/data-team/validation/stuckup", icon: <Anchor className="h-4 w-4" /> },
          { title: "Shortlanded", path: "/data-team/validation/shortlanded", icon: <AlertTriangle className="h-4 w-4" /> },
        ],
      },
    ],
  },
  {
    title: "Admin",
    path: "/admin",
    icon: <Briefcase className="h-5 w-5" />,
    moduleKey: "admin",
    subItems: [
      { title: "Attendance", path: "/admin/attendance", icon: <Users className="h-4 w-4" /> },
      { title: "Masterfile", path: "/admin/masterfile", icon: <FileText className="h-4 w-4" /> },
      { title: "Attendance History", path: "/admin/attendance-history", icon: <Calendar className="h-4 w-4" /> },
      { title: "Breaktime Management", path: "/admin/breaktime", icon: <Clock className="h-4 w-4" /> },
      { title: "Leave Management", path: "/admin/leave", icon: <Calendar className="h-4 w-4" /> },
      { title: "Workstation", path: "/admin/workstation", icon: <Briefcase className="h-4 w-4" /> },
    ],
  },
  {
    title: "KPI & Compliance",
    path: "/kpi",
    icon: <TrendingUp className="h-5 w-5" />,
    moduleKey: "kpi",
    subItems: [
      { title: "MDT", path: "/kpi/mdt", icon: <BarChart3 className="h-4 w-4" /> },
      { title: "Workstation", path: "/kpi/workstation", icon: <Briefcase className="h-4 w-4" /> },
      { title: "Productivity", path: "/kpi/productivity", icon: <Zap className="h-4 w-4" /> },
      { title: "Intraday", path: "/kpi/intraday", icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
  {
    title: "Midmile",
    path: "/midmile",
    icon: <Truck className="h-5 w-5" />,
    moduleKey: "midmile",
    subItems: [
      { title: "Truck Request", path: "/midmile/truck-request", icon: <MapPin className="h-4 w-4" /> },
    ],
  },
]

interface NavItemProps {
  item: MenuItem | SubMenuItem
  isCollapsed: boolean
  level?: number
}

const NavItem = memo(function NavItem({ item, isCollapsed, level = 0 }: NavItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()
  const hasSubItems = item.subItems && item.subItems.length > 0
  const isActive = pathname === item.path
  const isParentActive = pathname ? pathname.startsWith(item.path + "/") : false

  const isTopLevelHighlighted = level === 0 && (isActive || isParentActive)
  const isSubItemActive = level > 0 && isActive

  const paddingLeft = level === 0 ? "pl-4" : level === 1 ? "pl-10" : "pl-14"
  const shouldShowSubItems = hasSubItems && (isExpanded || isHovered) && !isCollapsed

  // Memoized handlers to prevent recreation on every render
  const handleChevronClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsExpanded(prev => !prev)
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (hasSubItems) setIsHovered(true)
  }, [hasSubItems])

  const handleMouseLeave = useCallback(() => {
    if (hasSubItems) setIsHovered(false)
  }, [hasSubItems])

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={item.path}
        onClick={(e) => hasSubItems && e.preventDefault()}
        className={cn(
          "relative flex h-9 items-center gap-2.5 overflow-hidden rounded-lg py-2 pr-3 text-sm transition-all duration-200 group",
          paddingLeft,
          level === 0 && "font-semibold text-base",
          level > 0 && "text-sm font-medium",
          isTopLevelHighlighted
            ? "text-white bg-gradient-to-r from-[#1f2230] to-[#2b2f45] shadow-[inset_0_0_0_1px_rgba(123,97,255,0.15)] after:content-[''] after:absolute after:right-0 after:top-2 after:bottom-2 after:w-1 after:rounded-full after:bg-[#7B61FF]"
            : isSubItemActive
            ? "text-[#f97316] bg-[hsl(var(--sidebar-submenu-active))] shadow-[inset_0_0_0_1px_rgba(249,115,22,0.12)] before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-[#f97316]"
            : level === 0
            ? "text-[hsl(var(--sidebar-foreground))] hover:text-white hover:bg-gradient-to-r hover:from-[#1f2230] hover:to-[#2b2f45] hover:shadow-[inset_0_0_0_1px_rgba(123,97,255,0.15)] hover:after:content-[''] hover:after:absolute hover:after:right-0 hover:after:top-2 hover:after:bottom-2 hover:after:w-1 hover:after:rounded-full hover:after:bg-[#7B61FF]"
            : "text-[#94a3b8] hover:text-[#f97316] hover:bg-[hsl(var(--sidebar-submenu-active))] hover:shadow-[inset_0_0_0_1px_rgba(249,115,22,0.12)] hover:before:content-[''] hover:before:absolute hover:before:left-0 hover:before:top-2 hover:before:bottom-2 hover:before:w-1 hover:before:rounded-full hover:before:bg-[#f97316]",
          isCollapsed && level === 0 && "justify-center px-2"
        )}
      >
        {item.icon && (
          <span className={cn(
            "transition-all duration-200 group-hover:scale-110",
            level === 0 ? "text-base" : "text-sm"
          )}>
            {item.icon}
          </span>
        )}
        {!isCollapsed && (
          <>
            <span className="flex-1 group-hover:text-[length:calc(1em+1px)] transition-all duration-200">{item.title}</span>
            {hasSubItems && (
              <ChevronRight
                onClick={handleChevronClick}
                className={cn(
                  "h-4 w-4 transition-all duration-200 cursor-pointer hover:scale-125",
                  (isExpanded || isHovered) && "rotate-90"
                )}
              />
            )}
          </>
        )}
      </Link>
      {shouldShowSubItems && (
        <div className="space-y-0.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 ml-2">
          {item.subItems!.map((subItem) => (
            <NavItem
              key={subItem.path}
              item={subItem}
              isCollapsed={isCollapsed}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
})

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  activePopup?: SidebarPopupType
  onPopupChange?: (popup: SidebarPopupType) => void
}

export function Sidebar({ isCollapsed, onToggle: _onToggle, activePopup, onPopupChange }: SidebarProps) {
  const bottomMenuItems = [
    { id: "messages" as const, icon: <MessageSquare className="h-5 w-5" />, label: "Messages", badge: 3, gradient: "from-indigo-500 to-purple-600" },
    { id: "notifications" as const, icon: <Bell className="h-5 w-5" />, label: "Notifications", badge: 7, gradient: "from-amber-500 to-orange-500" },
    { id: "help" as const, icon: <HelpCircle className="h-5 w-5" />, label: "Help", badge: 0, gradient: "from-cyan-500 to-blue-500" },
    { id: "settings" as const, icon: <Settings className="h-5 w-5" />, label: "Settings", badge: 0, gradient: "from-slate-500 to-slate-600" },
  ]

  return (
    <div
      className={cn(
        "flex h-full flex-col transition-all duration-300",
        "bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-foreground))]",
        isCollapsed ? "w-[70px]" : "w-[280px]"
      )}
    >
      <div className={cn(
        "flex h-16 items-center gap-3 px-4 border-b border-white/10",
        isCollapsed && "justify-center px-2"
      )}>
        {!isCollapsed ? (
          <>
            <SpxLogo className="h-9 w-9" />
            <h2 className="text-base font-bold text-[hsl(var(--sidebar-foreground))]">SOC Internal TOOL</h2>
          </>
        ) : (
          <SpxLogo className="h-8 w-8" />
        )}
      </div>

      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {menuItems.filter((item) => isModuleEnabled(item.moduleKey)).map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-1">
        {bottomMenuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => onPopupChange?.(activePopup === item.id ? null : item.id)}
            className={cn(
              "w-full justify-start gap-3 h-10 rounded-lg transition-all duration-200 relative group",
              isCollapsed && "justify-center px-2",
              activePopup === item.id 
                ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                : "text-[hsl(var(--sidebar-foreground))] hover:bg-white/10"
            )}
          >
            <span className="relative">
              {item.icon}
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </span>
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </Button>
        ))}
      </div>
    </div>
  )
}
