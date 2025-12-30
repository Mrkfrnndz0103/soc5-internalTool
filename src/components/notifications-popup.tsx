import { useState } from "react"
import { 
  Bell, X, Minimize2, Check, CheckCheck, Trash2, Settings,
  Package, AlertTriangle, Info, CheckCircle, Archive
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "info" | "success" | "warning" | "error" | "dispatch" | "system"
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  actionUrl?: string
}

// Lazy-loaded mock data - only created when component mounts
const getMockNotifications = (): Notification[] => [
  {
    id: "1",
    type: "dispatch",
    title: "Dispatch Completed",
    message: "Bay 5 dispatch for Route A-123 has been completed successfully.",
    timestamp: new Date(Date.now() - 300000),
    isRead: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Prealert Mismatch",
    message: "3 packages in prealert batch #4521 have weight discrepancies.",
    timestamp: new Date(Date.now() - 1800000),
    isRead: false,
  },
  {
    id: "3",
    type: "success",
    title: "Report Generated",
    message: "Your daily dispatch report is ready for download.",
    timestamp: new Date(Date.now() - 3600000),
    isRead: false,
  },
  {
    id: "4",
    type: "info",
    title: "System Update",
    message: "New features have been added to the dispatch monitoring module.",
    timestamp: new Date(Date.now() - 7200000),
    isRead: true,
  },
  {
    id: "5",
    type: "error",
    title: "Sync Failed",
    message: "Failed to sync data with external system. Please retry.",
    timestamp: new Date(Date.now() - 10800000),
    isRead: true,
  },
  {
    id: "6",
    type: "dispatch",
    title: "New Assignment",
    message: "You have been assigned to monitor Bay 3 for the afternoon shift.",
    timestamp: new Date(Date.now() - 14400000),
    isRead: true,
  },
  {
    id: "7",
    type: "system",
    title: "Maintenance Scheduled",
    message: "System maintenance scheduled for tonight at 11 PM.",
    timestamp: new Date(Date.now() - 86400000),
    isRead: true,
  },
]

interface NotificationsPopupProps {
  isOpen: boolean
  onClose: () => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

export function NotificationsPopup({ isOpen, onClose, isMinimized, onToggleMinimize }: NotificationsPopupProps) {
  // Lazy initialization - mock data only created once when component first mounts
  const [notifications, setNotifications] = useState<Notification[]>(() => getMockNotifications())
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [showSettings, setShowSettings] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length
  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "dispatch": return <Package className="h-5 w-5" />
      case "warning": return <AlertTriangle className="h-5 w-5" />
      case "error": return <AlertTriangle className="h-5 w-5" />
      case "success": return <CheckCircle className="h-5 w-5" />
      case "system": return <Settings className="h-5 w-5" />
      default: return <Info className="h-5 w-5" />
    }
  }

  const getIconColor = (type: Notification["type"]) => {
    switch (type) {
      case "dispatch": return "text-blue-500 bg-blue-500/10"
      case "warning": return "text-yellow-500 bg-yellow-500/10"
      case "error": return "text-red-500 bg-red-500/10"
      case "success": return "text-green-500 bg-green-500/10"
      case "system": return "text-purple-500 bg-purple-500/10"
      default: return "text-gray-500 bg-gray-500/10"
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return "Yesterday"
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed bottom-6 left-[300px] w-[380px] bg-card border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden",
        "animate-in slide-in-from-bottom-5 fade-in duration-300",
        isMinimized ? "h-14" : "h-[550px]"
      )}
    >
      {/* Header - Click to close */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white cursor-pointer"
        onClick={onClose}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">Notifications</h3>
            <p className="text-xs text-amber-100">{unreadCount} unread</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full" 
            onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings) }}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full" 
            onClick={(e) => { e.stopPropagation(); onToggleMinimize() }}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full" 
            onClick={(e) => { e.stopPropagation(); onClose() }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Filter Bar */}
          <div className="px-4 py-2 border-b flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                  filter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                  filter === "unread" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={markAllAsRead}>
                <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bell className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={cn(
                    "relative group px-4 py-3 border-b hover:bg-muted/50 transition-colors cursor-pointer",
                    !notification.isRead && "bg-primary/5"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", getIconColor(notification.type))}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn("text-sm font-medium", !notification.isRead && "font-semibold")}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                  
                  {/* Actions on hover */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(notification.id) }}
                        className="p-1.5 rounded-full hover:bg-muted"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}
                      className="p-1.5 rounded-full hover:bg-muted"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t flex justify-between">
              <Button variant="ghost" size="sm" className="text-xs" onClick={clearAll}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear all
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                <Archive className="h-3.5 w-3.5 mr-1" /> View archived
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
