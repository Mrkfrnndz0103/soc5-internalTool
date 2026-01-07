"use client"

import { useState } from "react"
import { 
  HelpCircle, X, Minimize2, Search, Book, FileText, Video,
  MessageCircle, ChevronRight, ExternalLink, Mail, Phone,
  Lightbulb, Keyboard, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

interface GuideItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  type: "video" | "article" | "interactive"
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "1",
    question: "How do I create a new dispatch report?",
    answer: "Navigate to Outbound > Dispatch Report, then click the 'New Report' button. Fill in the required fields and submit.",
    category: "Dispatch",
  },
  {
    id: "2",
    question: "What is the prealert system?",
    answer: "The prealert system allows you to receive advance notice of incoming shipments, helping you prepare for processing and allocation.",
    category: "Prealert",
  },
  {
    id: "3",
    question: "How do I assign bays for dispatch?",
    answer: "Go to Outbound > Per Bay Allocation. Select the bay you want to assign and choose the route or shipment from the dropdown.",
    category: "Dispatch",
  },
  {
    id: "4",
    question: "How can I export data to Excel?",
    answer: "Most tables have an 'Export' button in the top-right corner. Click it and select 'Export to Excel' to download your data.",
    category: "General",
  },
  {
    id: "5",
    question: "What do the different status colors mean?",
    answer: "Green = Completed, Yellow = In Progress, Red = Delayed/Issue, Blue = Pending, Gray = Not Started.",
    category: "General",
  },
  {
    id: "6",
    question: "How do I track a specific package?",
    answer: "Use the search bar at the top of any page and enter the tracking number. You can also use the Dispatch Monitoring page for real-time tracking.",
    category: "Tracking",
  },
]

const GUIDE_ITEMS: GuideItem[] = [
  {
    id: "1",
    title: "Getting Started Guide",
    description: "Learn the basics of the SOC Internal Tool",
    icon: <Book className="h-5 w-5" />,
    type: "article",
  },
  {
    id: "2",
    title: "Dispatch Workflow Tutorial",
    description: "Step-by-step video guide for dispatch operations",
    icon: <Video className="h-5 w-5" />,
    type: "video",
  },
  {
    id: "3",
    title: "Prealert Management",
    description: "How to effectively manage prealert data",
    icon: <FileText className="h-5 w-5" />,
    type: "article",
  },
  {
    id: "4",
    title: "Keyboard Shortcuts",
    description: "Speed up your workflow with shortcuts",
    icon: <Keyboard className="h-5 w-5" />,
    type: "interactive",
  },
]

const KEYBOARD_SHORTCUTS = [
  { keys: ["Ctrl", "K"], description: "Open search" },
  { keys: ["/"], description: "Focus search bar" },
  { keys: ["Ctrl", "N"], description: "New item" },
  { keys: ["Ctrl", "S"], description: "Save changes" },
  { keys: ["Ctrl", "E"], description: "Export data" },
  { keys: ["Esc"], description: "Close modal/popup" },
  { keys: ["?"], description: "Show help" },
]

interface HelpPopupProps {
  isOpen: boolean
  onClose: () => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

export function HelpPopup({ isOpen, onClose, isMinimized, onToggleMinimize }: HelpPopupProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"faq" | "guides" | "shortcuts" | "contact">("faq")
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const filteredFAQ = FAQ_ITEMS.filter(
    item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed bottom-6 left-[300px] w-[400px] bg-card border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden",
        "animate-in slide-in-from-bottom-5 fade-in duration-300",
        isMinimized ? "h-14" : "h-[550px]"
      )}
    >
      {/* Header - Click to close */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white cursor-pointer"
        onClick={onClose}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Help Center</h3>
            <p className="text-xs text-cyan-100">How can we help?</p>
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
        <>
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help..."
                className="pl-9 rounded-full bg-muted/50 border-0"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b px-2">
            {[
              { id: "faq", label: "FAQ", icon: <Lightbulb className="h-4 w-4" /> },
              { id: "guides", label: "Guides", icon: <Book className="h-4 w-4" /> },
              { id: "shortcuts", label: "Shortcuts", icon: <Keyboard className="h-4 w-4" /> },
              { id: "contact", label: "Contact", icon: <MessageCircle className="h-4 w-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* FAQ Tab */}
            {activeTab === "faq" && (
              <div className="p-3 space-y-2">
                {searchQuery && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {filteredFAQ.length} results for &quot;{searchQuery}&quot;
                  </p>
                )}
                {filteredFAQ.map(item => (
                  <div key={item.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <span className="text-xs text-primary font-medium">{item.category}</span>
                        <p className="text-sm font-medium mt-0.5">{item.question}</p>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        expandedFAQ === item.id && "rotate-180"
                      )} />
                    </button>
                    {expandedFAQ === item.id && (
                      <div className="px-3 pb-3 text-sm text-muted-foreground border-t bg-muted/30 pt-3">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Guides Tab */}
            {activeTab === "guides" && (
              <div className="p-3 space-y-2">
                {GUIDE_ITEMS.map(guide => (
                  <button
                    key={guide.id}
                    className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      guide.type === "video" ? "bg-red-500/10 text-red-500" :
                      guide.type === "interactive" ? "bg-purple-500/10 text-purple-500" :
                      "bg-blue-500/10 text-blue-500"
                    )}>
                      {guide.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {guide.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{guide.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            )}

            {/* Shortcuts Tab */}
            {activeTab === "shortcuts" && (
              <div className="p-3">
                <div className="space-y-2">
                  {KEYBOARD_SHORTCUTS.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <kbd
                            key={keyIdx}
                            className="px-2 py-1 text-xs font-mono bg-muted border rounded shadow-sm"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === "contact" && (
              <div className="p-3 space-y-3">
                <div className="p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                  <h4 className="font-semibold text-sm mb-2">Need more help?</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Our support team is available 24/7 to assist you.
                  </p>
                  <Button className="w-full gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Start Live Chat
                  </Button>
                </div>

                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">Email Support</p>
                      <p className="text-xs text-muted-foreground">support@soc-tool.com</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </button>

                  <button className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">Phone Support</p>
                      <p className="text-xs text-muted-foreground">+63 2 8888 9999</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </button>

                  <button className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <Book className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">Documentation</p>
                      <p className="text-xs text-muted-foreground">Browse full documentation</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
