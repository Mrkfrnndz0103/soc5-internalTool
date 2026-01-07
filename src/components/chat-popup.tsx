"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Send, Minimize2, Smile, Paperclip, Image as ImageIcon, Mic, Check, CheckCheck, Reply, MoreVertical, Trash2, Copy, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  text: string
  sender: "user" | "support"
  timestamp: Date
  status?: "sending" | "sent" | "delivered" | "read"
  replyTo?: Message | null
  reactions?: string[]
  avatar?: string
  senderName?: string
  isTyping?: boolean
}

const EMOJI_LIST = ["😀", "😂", "😍", "🥰", "😊", "🤔", "👍", "👎", "❤️", "🔥", "🎉", "💯", "😢", "😮", "🙏", "👏", "✨", "🎯", "💪", "🚀", "💎", "🌟", "🌈", "🎨"]
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "✨"]

// Avatar presets for different user types
const AVATAR_PRESETS = {
  user: [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=d1d4f9",
  ],
  support: [
    "https://api.dicebear.com/7.x/bottts/svg?seed=SupportBot&backgroundColor=ffdfbf",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Helper&backgroundColor=ffd18d",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Assistant&backgroundColor=ffb347",
  ]
}

export function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [supportAvatar] = useState(AVATAR_PRESETS.support[0])
  // Lazy initialization - only create initial message once
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "1",
      text: "Hello! 👋 I'm here to help you with anything you need. How can I assist you today?",
      sender: "support",
      timestamp: new Date(),
      status: "read",
      senderName: "Support Assistant",
      avatar: AVATAR_PRESETS.support[0],
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout)
      timeoutRefs.current = []
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Memoized scroll handler to prevent recreation on every render
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100)
  }, [])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || isMinimized) return
    
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [isMinimized, handleScroll])

  // Close dropdown menu when clicking outside
  useEffect(() => {
    if (!activeMessageMenu) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-message-menu]')) {
        setActiveMessageMenu(null)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [activeMessageMenu])

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
      status: "sending",
      replyTo: replyingTo,
    }

    setMessages([...messages, newMessage])
    setInputValue("")
    setReplyingTo(null)
    setShowEmojiPicker(false)

    // Clear previous timeouts to prevent memory leaks
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []

    // Simulate message status updates with tracked timeouts
    const sentTimeout = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMessage.id ? { ...m, status: "sent" } : m))
      )
    }, 300)
    timeoutRefs.current.push(sentTimeout)

    const deliveredTimeout = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMessage.id ? { ...m, status: "delivered" } : m))
      )
    }, 600)
    timeoutRefs.current.push(deliveredTimeout)

    // Show typing indicator
    setIsTyping(true)

    // Simulate response with tracked timeout
    const responseTimeout = setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === newMessage.id ? { ...m, status: "read" as const } : m
        )
        return [
          ...updated,
          {
            id: (Date.now() + 1).toString(),
            text: "Thank you for your message. Our team will respond shortly.",
            sender: "support" as const,
            timestamp: new Date(),
            status: "read" as const,
          },
        ]
      })
    }, 1500)
    timeoutRefs.current.push(responseTimeout)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          const reactions = m.reactions || []
          if (reactions.includes(emoji)) {
            return { ...m, reactions: reactions.filter((r) => r !== emoji) }
          }
          return { ...m, reactions: [...reactions, emoji] }
        }
        return m
      })
    )
    setActiveMessageMenu(null)
  }

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
    setActiveMessageMenu(null)
  }

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
    setActiveMessageMenu(null)
  }

  const handleReply = (message: Message) => {
    setReplyingTo(message)
    setActiveMessageMenu(null)
    inputRef.current?.focus()
  }

  const addEmoji = (emoji: string) => {
    setInputValue((prev) => prev + emoji)
    inputRef.current?.focus()
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "sending":
        return <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
      case "sent":
        return <Check className="h-3 w-3" />
      case "delivered":
        return <CheckCheck className="h-3 w-3" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-400" />
      default:
        return null
    }
  }

  // Enhanced floating button with animations
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative group h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 active:scale-95"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <MessageCircle className="h-7 w-7 relative z-10" />
          <div className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-full text-xs flex items-center justify-center font-bold shadow-lg animate-pulse">
            1
          </div>
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        </button>
        <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 bg-card/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ease-out",
        isMinimized ? "h-14 w-80" : isExpanded ? "w-[500px] h-[600px]" : "w-[380px] h-[520px]"
      )}
    >
      {/* Enhanced Header with Glassmorphism */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20" />
        <div className="relative flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={supportAvatar} 
                  alt="Support" 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=fallback&backgroundColor=ffdfbf`
                  }}
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse" />
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-400 rounded-full animate-ping" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Support Assistant</h3>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-400/20 rounded-full">
                  <div className="h-1.5 w-1.5 bg-green-300 rounded-full animate-pulse" />
                  <span className="text-xs text-green-100">Online</span>
                </div>
              </div>
              <p className="text-xs text-blue-100 flex items-center gap-1">
                {isTyping ? (
                  <><span className="inline-flex gap-0.5">
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span><span className="ml-1">typing...</span></>
                ) : (
                  <>Typically responds instantly</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-full transition-all duration-200"
              onClick={() => setIsExpanded(!isExpanded)}
              title="Expand"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-full transition-all duration-200"
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }}
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-full transition-all duration-200"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Enhanced Messages Area */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white/80 backdrop-blur-sm"
          >
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={cn(
                  "flex group animate-slide-in",
                  msg.sender === "user" ? "justify-end" : "justify-start"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {msg.sender === "support" && (
                  <div className="flex-shrink-0 mr-2">
                    <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={msg.avatar || supportAvatar} 
                        alt={msg.senderName || "Support"} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=fallback&backgroundColor=ffdfbf`
                        }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="relative max-w-[75%]">
                  {/* Sender name for support messages */}
                  {msg.sender === "support" && msg.senderName && (
                    <div className="text-xs text-muted-foreground mb-1 ml-1 font-medium">
                      {msg.senderName}
                    </div>
                  )}
                  
                  {/* Reply preview */}
                  {msg.replyTo && (
                    <div className={cn(
                      "text-xs px-3 py-2 rounded-t-lg border-l-3 mb-0.5 backdrop-blur-sm",
                      msg.sender === "user" 
                        ? "bg-green-50/80 border-green-300 text-green-700" 
                        : "bg-blue-50/80 border-blue-300 text-blue-700"
                    )}>
                      <Reply className="h-3 w-3 inline mr-1.5" />
                      <span className="font-medium">Replying to:</span> {msg.replyTo.text.slice(0, 40)}...
                    </div>
                  )}
                  
                  {/* Enhanced message bubble */}
                  <div
                    className={cn(
                      "relative px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl",
                      msg.sender === "user"
                        ? "bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white rounded-2xl rounded-br-sm"
                        : "bg-white/90 text-slate-800 border border-slate-200 rounded-2xl rounded-bl-sm",
                      msg.replyTo && "rounded-t-sm"
                    )}
                  >
                    <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                    <div className={cn(
                      "flex items-center gap-2 mt-2",
                      msg.sender === "user" ? "justify-end" : "justify-between"
                    )}>
                      <span className={cn(
                        "text-xs font-medium",
                        msg.sender === "user" ? "text-green-100" : "text-slate-500"
                      )}>
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {msg.sender === "user" && (
                        <span className="text-green-100">
                          {getStatusIcon(msg.status)}
                        </span>
                      )}
                    </div>
                    
                    {/* Enhanced message tail */}
                    <div className={cn(
                      "absolute bottom-0 w-4 h-4",
                      msg.sender === "user" 
                        ? "-right-2 bg-gradient-to-br from-green-600 to-emerald-600" 
                        : "-left-2 bg-white/90 border-l border-b border-slate-200",
                      "clip-path-tail"
                    )} style={{
                      clipPath: msg.sender === "user" 
                        ? "polygon(0 0, 100% 0, 0 100%)" 
                        : "polygon(100% 0, 100% 100%, 0 0)"
                    }} />
                  </div>

                  {/* Enhanced reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={cn(
                      "absolute -bottom-2 flex gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg border border-slate-200",
                      msg.sender === "user" ? "right-2" : "left-2"
                    )}>
                      {msg.reactions.map((r, i) => (
                        <span 
                          key={i} 
                          className="text-sm hover:scale-110 transition-transform cursor-pointer"
                          onClick={() => handleReaction(msg.id, r)}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Enhanced message actions */}
                  <div className={cn(
                    "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200",
                    msg.sender === "user" ? "-left-24" : "-right-24"
                  )}>
                    <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full shadow-xl border border-slate-200 p-1">
                      <button
                        onClick={() => handleReply(msg)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-all duration-200 group/btn"
                        title="Reply"
                      >
                        <Reply className="h-4 w-4 text-slate-600 group-hover/btn:text-blue-600" />
                      </button>
                      <button
                        onClick={() => setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-all duration-200 group/btn"
                        title="More options"
                      >
                        <MoreVertical className="h-4 w-4 text-slate-600 group-hover/btn:text-slate-800" />
                      </button>
                    </div>
                    
                    {/* Enhanced dropdown menu */}
                    {activeMessageMenu === msg.id && (
                      <div className="absolute top-full mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-200 py-2 min-w-[140px] z-10 animate-slide-in">
                        <button
                          onClick={() => handleCopyMessage(msg.text)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        >
                          <Copy className="h-4 w-4 text-slate-600" /> <span className="text-slate-700">Copy</span>
                        </button>
                        {msg.sender === "user" && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" /> <span>Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enhanced quick reactions */}
                  <div className={cn(
                    "absolute -top-10 opacity-0 group-hover:opacity-100 transition-all duration-200",
                    msg.sender === "user" ? "right-0" : "left-0"
                  )}>
                    <div className="flex items-center gap-0.5 bg-white/95 backdrop-blur-sm rounded-full shadow-xl border border-slate-200 px-2 py-1.5">
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg.id, emoji)}
                          className="hover:scale-125 transition-transform duration-200 p-0.5 text-lg"
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Enhanced typing indicator */}
            {isTyping && (
              <div className="flex justify-start animate-slide-in">
                <div className="flex items-end gap-2">
                  <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={supportAvatar} 
                      alt="Support typing" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

            {/* Enhanced scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 right-4 h-11 w-11 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all duration-200 hover:scale-110 group"
            >
              <ChevronDown className="h-5 w-5 text-slate-600 group-hover:text-slate-800 transition-colors" />
              <div className="absolute inset-0 rounded-full bg-blue-500/10 scale-0 group-hover:scale-100 transition-transform duration-300" />
            </button>
          )}

          {/* Enhanced reply preview bar */}
          {replyingTo && (
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-t border-blue-200/50 flex items-center gap-3">
              <div className="flex-1 border-l-3 border-blue-400 pl-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Replying to {replyingTo.senderName || "Support"}</p>
                <p className="text-sm text-slate-700 truncate">{replyingTo.text}</p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-2 hover:bg-blue-100/50 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          )}

          {/* Enhanced emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-24 left-4 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 z-20 animate-slide-in">
              <div className="mb-3">
                <p className="text-xs text-slate-600 font-medium mb-2">Quick Reactions</p>
                <div className="flex gap-1 pb-3 border-b border-slate-200">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addEmoji(emoji)}
                      className="h-9 w-9 hover:bg-slate-100 rounded-lg flex items-center justify-center text-lg hover:scale-110 transition-all duration-200"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium mb-2">All Emojis</p>
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addEmoji(emoji)}
                      className="h-8 w-8 hover:bg-slate-100 rounded flex items-center justify-center text-sm hover:scale-110 transition-all duration-200"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Input Area */}
          <div className="p-4 bg-gradient-to-t from-white/95 to-slate-50/95 backdrop-blur-xl border-t border-slate-200/50">
            <div className="flex items-end gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-slate-100/80 flex-shrink-0 transition-all duration-200 group/btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Add emoji"
              >
                <Smile className="h-5 w-5 text-slate-600 group-hover/btn:text-yellow-500 transition-colors" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-slate-100/80 flex-shrink-0 transition-all duration-200 group/btn"
                title="Attach file"
              >
                <Paperclip className="h-5 w-5 text-slate-600 group-hover/btn:text-blue-500 transition-colors" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  onFocus={() => setShowEmojiPicker(false)}
                  placeholder="Type your message..."
                  className="pr-12 rounded-full bg-white/80 backdrop-blur-sm border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 shadow-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-slate-100/80 transition-all duration-200 group/btn"
                  title="Add image"
                >
                  <ImageIcon className="h-4 w-4 text-slate-600 group-hover/btn:text-green-500 transition-colors" />
                </Button>
              </div>
              {inputValue.trim() ? (
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 flex-shrink-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group"
                  title="Send message"
                >
                  <Send className="h-5 w-5 text-white group-hover:translate-x-0.5 transition-transform duration-200" />
                  <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full hover:bg-slate-100/80 flex-shrink-0 transition-all duration-200 group/btn"
                  title="Voice message"
                >
                  <Mic className="h-5 w-5 text-slate-600 group-hover/btn:text-red-500 transition-colors" />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
