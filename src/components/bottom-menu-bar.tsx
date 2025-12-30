import { useState } from "react"
import { MessageSquare, Bell, HelpCircle, Settings, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatPopup } from "@/components/chat-popup"
import { MessagesPopup } from "@/components/messages-popup"
import { NotificationsPopup } from "@/components/notifications-popup"
import { HelpPopup } from "@/components/help-popup"
import { SettingsPopup } from "@/components/settings-popup"

type PopupType = "chat" | "messages" | "notifications" | "help" | "settings" | null

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  badge?: number
  isActive: boolean
  onClick: () => void
  gradient: string
}

function MenuItem({ icon, label, badge, isActive, onClick, gradient }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
        isActive 
          ? `${gradient} text-white shadow-lg scale-105` 
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="relative">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

export function BottomMenuBar() {
  const [activePopup, setActivePopup] = useState<PopupType>(null)
  const [minimizedPopups, setMinimizedPopups] = useState<Set<PopupType>>(new Set())

  const togglePopup = (popup: PopupType) => {
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

  const toggleMinimize = (popup: PopupType) => {
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

  const closePopup = (popup: PopupType) => {
    if (activePopup === popup) {
      setActivePopup(null)
    }
    setMinimizedPopups(prev => {
      const next = new Set(prev)
      next.delete(popup)
      return next
    })
  }

  // Mock badge counts
  const messageBadge = 3
  const notificationBadge = 7

  return (
    <>
      {/* Bottom Menu Bar */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border rounded-2xl shadow-xl p-2">
          <MenuItem
            icon={<MessageCircle className="h-5 w-5" />}
            label="Support"
            isActive={activePopup === "chat"}
            onClick={() => togglePopup("chat")}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
          />
          <MenuItem
            icon={<MessageSquare className="h-5 w-5" />}
            label="Messages"
            badge={messageBadge}
            isActive={activePopup === "messages"}
            onClick={() => togglePopup("messages")}
            gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
          />
          <MenuItem
            icon={<Bell className="h-5 w-5" />}
            label="Notifications"
            badge={notificationBadge}
            isActive={activePopup === "notifications"}
            onClick={() => togglePopup("notifications")}
            gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          />
          <MenuItem
            icon={<HelpCircle className="h-5 w-5" />}
            label="Help"
            isActive={activePopup === "help"}
            onClick={() => togglePopup("help")}
            gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
          />
          <MenuItem
            icon={<Settings className="h-5 w-5" />}
            label="Settings"
            isActive={activePopup === "settings"}
            onClick={() => togglePopup("settings")}
            gradient="bg-gradient-to-br from-slate-600 to-slate-700"
          />
        </div>
      </div>

      {/* Chat Support Popup */}
      {activePopup === "chat" && (
        <ChatPopup />
      )}

      {/* Messages Popup */}
      <MessagesPopup
        isOpen={activePopup === "messages"}
        onClose={() => closePopup("messages")}
        isMinimized={minimizedPopups.has("messages")}
        onToggleMinimize={() => toggleMinimize("messages")}
      />

      {/* Notifications Popup */}
      <NotificationsPopup
        isOpen={activePopup === "notifications"}
        onClose={() => closePopup("notifications")}
        isMinimized={minimizedPopups.has("notifications")}
        onToggleMinimize={() => toggleMinimize("notifications")}
      />

      {/* Help Popup */}
      <HelpPopup
        isOpen={activePopup === "help"}
        onClose={() => closePopup("help")}
        isMinimized={minimizedPopups.has("help")}
        onToggleMinimize={() => toggleMinimize("help")}
      />

      {/* Settings Popup */}
      <SettingsPopup
        isOpen={activePopup === "settings"}
        onClose={() => closePopup("settings")}
        isMinimized={minimizedPopups.has("settings")}
        onToggleMinimize={() => toggleMinimize("settings")}
      />
    </>
  )
}
