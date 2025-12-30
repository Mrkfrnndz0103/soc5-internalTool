import { useState } from "react"
import { 
  Settings, X, Minimize2, User, Bell, Moon, Sun, Globe, Lock,
  Palette, Monitor, ChevronRight, Check, LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

interface SettingsPopupProps {
  isOpen: boolean
  onClose: () => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

export function SettingsPopup({ isOpen, onClose, isMinimized, onToggleMinimize }: SettingsPopupProps) {
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      pushEnabled: true,
      emailEnabled: true,
      soundEnabled: true,
      dispatchAlerts: true,
      systemUpdates: true,
      chatMessages: true,
    },
    appearance: {
      compactMode: false,
      showAvatars: true,
      animationsEnabled: true,
    },
    privacy: {
      showOnlineStatus: true,
      readReceipts: true,
      activityStatus: true,
    },
    language: "en",
  })

  const updateSetting = (category: string, key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev[category as keyof typeof prev] as object),
        [key]: value,
      },
    }))
  }

  const languages = [
    { code: "en", name: "English" },
    { code: "fil", name: "Filipino" },
    { code: "zh", name: "中文 (Chinese)" },
    { code: "ja", name: "日本語 (Japanese)" },
    { code: "ko", name: "한국어 (Korean)" },
  ]

  if (!isOpen) return null

  const renderToggle = (enabled: boolean, onChange: () => void) => (
    <button
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        enabled ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          enabled && "translate-x-5"
        )}
      />
    </button>
  )

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
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white cursor-pointer"
        onClick={onClose}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Settings</h3>
            <p className="text-xs text-slate-300">Customize your experience</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
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
        <div className="flex-1 overflow-y-auto">
          {/* Profile Section */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-xl font-bold">
                JD
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">John Doe</h4>
                <p className="text-sm text-muted-foreground">SOC Operator</p>
              </div>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="divide-y">
            {/* Theme */}
            <div className="p-4">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Theme
              </h5>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "light", icon: <Sun className="h-4 w-4" />, label: "Light" },
                  { value: "dark", icon: <Moon className="h-4 w-4" />, label: "Dark" },
                  { value: "system", icon: <Monitor className="h-4 w-4" />, label: "System" },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as "light" | "dark" | "system")}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                      theme === option.value 
                        ? "border-primary bg-primary/5" 
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    {option.icon}
                    <span className="text-xs font-medium">{option.label}</span>
                    {theme === option.value && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="p-4">
              <button
                onClick={() => setActiveSection(activeSection === "notifications" ? null : "notifications")}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Notifications</p>
                    <p className="text-xs text-muted-foreground">Manage alerts & sounds</p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  activeSection === "notifications" && "rotate-90"
                )} />
              </button>
              
              {activeSection === "notifications" && (
                <div className="mt-3 space-y-3 pl-12">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Push notifications</span>
                    {renderToggle(settings.notifications.pushEnabled, () => 
                      updateSetting("notifications", "pushEnabled", !settings.notifications.pushEnabled)
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email notifications</span>
                    {renderToggle(settings.notifications.emailEnabled, () => 
                      updateSetting("notifications", "emailEnabled", !settings.notifications.emailEnabled)
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sound</span>
                    {renderToggle(settings.notifications.soundEnabled, () => 
                      updateSetting("notifications", "soundEnabled", !settings.notifications.soundEnabled)
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dispatch alerts</span>
                    {renderToggle(settings.notifications.dispatchAlerts, () => 
                      updateSetting("notifications", "dispatchAlerts", !settings.notifications.dispatchAlerts)
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Chat messages</span>
                    {renderToggle(settings.notifications.chatMessages, () => 
                      updateSetting("notifications", "chatMessages", !settings.notifications.chatMessages)
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy */}
            <div className="p-4">
              <button
                onClick={() => setActiveSection(activeSection === "privacy" ? null : "privacy")}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Privacy</p>
                    <p className="text-xs text-muted-foreground">Control your visibility</p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  activeSection === "privacy" && "rotate-90"
                )} />
              </button>
              
              {activeSection === "privacy" && (
                <div className="mt-3 space-y-3 pl-12">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show online status</span>
                    {renderToggle(settings.privacy.showOnlineStatus, () => 
                      updateSetting("privacy", "showOnlineStatus", !settings.privacy.showOnlineStatus)
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Read receipts</span>
                    {renderToggle(settings.privacy.readReceipts, () => 
                      updateSetting("privacy", "readReceipts", !settings.privacy.readReceipts)
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Activity status</span>
                    {renderToggle(settings.privacy.activityStatus, () => 
                      updateSetting("privacy", "activityStatus", !settings.privacy.activityStatus)
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Appearance */}
            <div className="p-4">
              <button
                onClick={() => setActiveSection(activeSection === "appearance" ? null : "appearance")}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Appearance</p>
                    <p className="text-xs text-muted-foreground">Customize display</p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  activeSection === "appearance" && "rotate-90"
                )} />
              </button>
              
              {activeSection === "appearance" && (
                <div className="mt-3 space-y-3 pl-12">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compact mode</span>
                    {renderToggle(settings.appearance.compactMode, () => 
                      updateSetting("appearance", "compactMode", !settings.appearance.compactMode)
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show avatars</span>
                    {renderToggle(settings.appearance.showAvatars, () => 
                      updateSetting("appearance", "showAvatars", !settings.appearance.showAvatars)
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Animations</span>
                    {renderToggle(settings.appearance.animationsEnabled, () => 
                      updateSetting("appearance", "animationsEnabled", !settings.appearance.animationsEnabled)
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Language */}
            <div className="p-4">
              <button
                onClick={() => setActiveSection(activeSection === "language" ? null : "language")}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Language</p>
                    <p className="text-xs text-muted-foreground">
                      {languages.find(l => l.code === settings.language)?.name}
                    </p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  activeSection === "language" && "rotate-90"
                )} />
              </button>
              
              {activeSection === "language" && (
                <div className="mt-3 space-y-1 pl-12">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setSettings(prev => ({ ...prev, language: lang.code }))}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg transition-colors",
                        settings.language === lang.code ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      <span className="text-sm">{lang.name}</span>
                      {settings.language === lang.code && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
