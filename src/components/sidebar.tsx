import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronRight, LayoutDashboard, Package, TrendingUp, Truck, Bell, HelpCircle, Settings, Eye, FileText, AlertCircle, Grid3x3, Users, Calendar, Clock, Briefcase, BarChart3, Zap, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SpxLogo } from "@/components/spx-logo"

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
  subItems?: SubMenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Outbound",
    path: "/outbound",
    icon: <Package className="h-5 w-5" />,
    subItems: [
      { title: "Dispatch Monitoring", path: "/outbound/dispatch-monitoring", icon: <Eye className="h-4 w-4" /> },
      { title: "Dispatch Report", path: "/outbound/dispatch-report", icon: <FileText className="h-4 w-4" /> },
      { title: "Prealert", path: "/outbound/prealert", icon: <AlertCircle className="h-4 w-4" /> },
      { title: "Per Bay Allocation", path: "/outbound/bay-allocation", icon: <Grid3x3 className="h-4 w-4" /> },
      {
        title: "Admin",
        path: "/outbound/admin",
        icon: <Briefcase className="h-4 w-4" />,
        subItems: [
          { title: "Attendance", path: "/outbound/admin/attendance", icon: <Users className="h-4 w-4" /> },
          { title: "Masterfile", path: "/outbound/admin/masterfile", icon: <FileText className="h-4 w-4" /> },
          { title: "Attendance History", path: "/outbound/admin/attendance-history", icon: <Calendar className="h-4 w-4" /> },
          { title: "Breaktime Management", path: "/outbound/admin/breaktime", icon: <Clock className="h-4 w-4" /> },
          { title: "Leave Management", path: "/outbound/admin/leave", icon: <Calendar className="h-4 w-4" /> },
          { title: "Workstation", path: "/outbound/admin/workstation", icon: <Briefcase className="h-4 w-4" /> },
        ],
      },
    ],
  },
  {
    title: "KPI & Compliance",
    path: "/kpi",
    icon: <TrendingUp className="h-5 w-5" />,
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

function NavItem({ item, isCollapsed, level = 0 }: NavItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const location = useLocation()
  const hasSubItems = item.subItems && item.subItems.length > 0
  const isActive = location.pathname === item.path
  const isParentActive = location.pathname.startsWith(item.path + "/")

  const paddingLeft = level === 0 ? "pl-4" : level === 1 ? "pl-10" : "pl-14"
  const shouldShowSubItems = hasSubItems && (isExpanded || isHovered) && !isCollapsed

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div
      onMouseEnter={() => hasSubItems && setIsHovered(true)}
      onMouseLeave={() => hasSubItems && setIsHovered(false)}
    >
      <Link
        to={!hasSubItems ? item.path : "#"}
        onClick={(e) => hasSubItems && e.preventDefault()}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group",
          paddingLeft,
          level === 0 && "font-semibold text-base",
          level > 0 && "text-sm font-medium",
          isActive && level === 0
            ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-foreground))]"
            : isActive && level > 0
            ? "bg-white/5 text-[hsl(var(--sidebar-foreground))]"
            : (isParentActive && level === 0)
            ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-foreground))]"
            : "hover:bg-white/5 text-[hsl(var(--sidebar-foreground))] hover:translate-x-1",
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
        <div className="space-y-0.125 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
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
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col transition-all duration-300",
        "bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-foreground))]",
        isCollapsed ? "w-[70px]" : "w-[280px]"
      )}
    >
      <div className={cn(
        "flex h-20 items-center gap-3 px-5 border-b border-white/10",
        isCollapsed && "justify-center px-2"
      )}>
        {!isCollapsed ? (
          <>
            <SpxLogo className="h-10 w-10" />
            <h2 className="text-lg font-bold text-[hsl(var(--sidebar-foreground))]">SOC Internal TOOL</h2>
          </>
        ) : (
          <SpxLogo className="h-8 w-8" />
        )}
      </div>

      <nav className="flex-1 space-y-0.5 p-4 overflow-y-auto">
        {menuItems.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-0.5">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-[hsl(var(--sidebar-foreground))] hover:bg-white/10 transition-all duration-200",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Bell className="h-5 w-5" />
          {!isCollapsed && <span>Notifications</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-[hsl(var(--sidebar-foreground))] hover:bg-white/10 transition-all duration-200",
            isCollapsed && "justify-center px-2"
          )}
        >
          <HelpCircle className="h-5 w-5" />
          {!isCollapsed && <span>Help</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-[hsl(var(--sidebar-foreground))] hover:bg-white/10 transition-all duration-200",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Settings className="h-5 w-5" />
          {!isCollapsed && <span>Settings</span>}
        </Button>
      </div>
    </div>
  )
}
