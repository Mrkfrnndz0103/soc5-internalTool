import { useState, useRef, useEffect } from "react"
import { 
  MessageSquare, X, Send, Minimize2, Search, Plus, Users,
  Check, CheckCheck, Paperclip, Smile, MoreVertical, Phone, 
  Video, Trash2, Pin, BellOff, ChevronLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  avatar: string
  status: "online" | "away" | "busy" | "offline"
  lastSeen?: Date
}

interface Message {
  id: string
  text: string
  senderId: string
  timestamp: Date
  status?: "sending" | "sent" | "delivered" | "read"
  reactions?: { emoji: string; userId: string }[]
  replyTo?: Message | null
}

interface Chat {
  id: string
  type: "direct" | "group"
  name: string
  avatar?: string
  participants: User[]
  messages: Message[]
  lastMessage?: Message
  unreadCount: number
  isPinned?: boolean
  isMuted?: boolean
}

const CURRENT_USER: User = {
  id: "current",
  name: "You",
  avatar: "bg-gradient-to-br from-blue-500 to-purple-500",
  status: "online"
}

// Lazy-loaded mock data - only created when needed
const getMockUsers = (): User[] => [
  { id: "1", name: "John Santos", avatar: "bg-gradient-to-br from-green-400 to-cyan-500", status: "online" },
  { id: "2", name: "Maria Garcia", avatar: "bg-gradient-to-br from-pink-400 to-rose-500", status: "online" },
  { id: "3", name: "Alex Chen", avatar: "bg-gradient-to-br from-orange-400 to-amber-500", status: "away" },
  { id: "4", name: "Sarah Kim", avatar: "bg-gradient-to-br from-violet-400 to-purple-500", status: "busy" },
  { id: "5", name: "Mike Johnson", avatar: "bg-gradient-to-br from-teal-400 to-emerald-500", status: "offline", lastSeen: new Date(Date.now() - 3600000) },
  { id: "6", name: "Emma Wilson", avatar: "bg-gradient-to-br from-red-400 to-pink-500", status: "online" },
]

const getMockChats = (users: User[]): Chat[] => [
  {
    id: "1",
    type: "group",
    name: "SOC Team",
    participants: [users[0], users[1], users[2]],
    messages: [
      { id: "m1", text: "Good morning team! 🌅", senderId: "1", timestamp: new Date(Date.now() - 3600000), status: "read" },
      { id: "m2", text: "Morning! Ready for today's dispatch", senderId: "2", timestamp: new Date(Date.now() - 3500000), status: "read" },
      { id: "m3", text: "Let's crush it! 💪", senderId: "current", timestamp: new Date(Date.now() - 3400000), status: "read" },
    ],
    unreadCount: 0,
    isPinned: true,
  },
  {
    id: "2",
    type: "direct",
    name: "Maria Garcia",
    participants: [users[1]],
    messages: [
      { id: "m4", text: "Hey, can you check the prealert data?", senderId: "2", timestamp: new Date(Date.now() - 1800000), status: "read" },
      { id: "m5", text: "Sure, I'll look into it now", senderId: "current", timestamp: new Date(Date.now() - 1700000), status: "delivered" },
    ],
    unreadCount: 2,
  },
  {
    id: "3",
    type: "group",
    name: "Dispatch Coordinators",
    participants: [users[0], users[3], users[4]],
    messages: [
      { id: "m6", text: "Bay 5 is ready for loading", senderId: "4", timestamp: new Date(Date.now() - 7200000), status: "read" },
    ],
    unreadCount: 5,
  },
  {
    id: "4",
    type: "direct",
    name: "Alex Chen",
    participants: [users[2]],
    messages: [
      { id: "m7", text: "Thanks for the help earlier!", senderId: "3", timestamp: new Date(Date.now() - 86400000), status: "read" },
    ],
    unreadCount: 0,
    isMuted: true,
  },
]

const EMOJI_LIST = ["😀", "😂", "😍", "🥰", "😊", "🤔", "👍", "👎", "❤️", "🔥", "🎉", "💯", "😢", "😮", "🙏", "👏", "✅", "❌", "⭐", "💪"]

interface MessagesPopupProps {
  isOpen: boolean
  onClose: () => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

export function MessagesPopup({ isOpen, onClose, isMinimized, onToggleMinimize }: MessagesPopupProps) {
  // Lazy initialization - mock data only created once when component first mounts
  const [mockUsers] = useState<User[]>(() => getMockUsers())
  const [chats, setChats] = useState<Chat[]>(() => getMockChats(getMockUsers()))
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [inputValue, setInputValue] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [showGroupCreate, setShowGroupCreate] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [groupName, setGroupName] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [chatMenuOpen, setChatMenuOpen] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout)
      timeoutRefs.current = []
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedChat?.messages])

  const handleSend = () => {
    if (!inputValue.trim() || !selectedChat) return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      senderId: "current",
      timestamp: new Date(),
      status: "sending",
    }

    setChats(prev => prev.map(chat => 
      chat.id === selectedChat.id 
        ? { ...chat, messages: [...chat.messages, newMessage], lastMessage: newMessage }
        : chat
    ))
    setSelectedChat(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null)
    setInputValue("")
    setShowEmojiPicker(false)

    // Clear previous timeouts to prevent memory leaks
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []

    // Simulate status updates with tracked timeouts
    const sentTimeout = setTimeout(() => updateMessageStatus(selectedChat.id, newMessage.id, "sent"), 300)
    const deliveredTimeout = setTimeout(() => updateMessageStatus(selectedChat.id, newMessage.id, "delivered"), 800)
    timeoutRefs.current.push(sentTimeout, deliveredTimeout)
    
    // Simulate typing and response for direct chats
    if (selectedChat.type === "direct") {
      setIsTyping(true)
      const responseTimeout = setTimeout(() => {
        setIsTyping(false)
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Got it! I'll get back to you shortly. 👍",
          senderId: selectedChat.participants[0].id,
          timestamp: new Date(),
          status: "read",
        }
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, messages: [...chat.messages, responseMessage], lastMessage: responseMessage }
            : chat
        ))
        setSelectedChat(prev => prev ? { ...prev, messages: [...prev.messages, responseMessage] } : null)
        updateMessageStatus(selectedChat.id, newMessage.id, "read")
      }, 2000)
      timeoutRefs.current.push(responseTimeout)
    }
  }

  const updateMessageStatus = (chatId: string, messageId: string, status: Message["status"]) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: chat.messages.map(m => m.id === messageId ? { ...m, status } : m) }
        : chat
    ))
    setSelectedChat(prev => 
      prev?.id === chatId 
        ? { ...prev, messages: prev.messages.map(m => m.id === messageId ? { ...m, status } : m) }
        : prev
    )
  }

  const createDirectChat = (user: User) => {
    const existingChat = chats.find(c => c.type === "direct" && c.participants[0].id === user.id)
    if (existingChat) {
      setSelectedChat(existingChat)
    } else {
      const newChat: Chat = {
        id: Date.now().toString(),
        type: "direct",
        name: user.name,
        participants: [user],
        messages: [],
        unreadCount: 0,
      }
      setChats(prev => [newChat, ...prev])
      setSelectedChat(newChat)
    }
    setShowNewChat(false)
  }

  const createGroupChat = () => {
    if (selectedUsers.length < 2 || !groupName.trim()) return
    
    const newChat: Chat = {
      id: Date.now().toString(),
      type: "group",
      name: groupName,
      participants: selectedUsers,
      messages: [{
        id: "system",
        text: `Group "${groupName}" created`,
        senderId: "system",
        timestamp: new Date(),
      }],
      unreadCount: 0,
    }
    setChats(prev => [newChat, ...prev])
    setSelectedChat(newChat)
    setShowGroupCreate(false)
    setSelectedUsers([])
    setGroupName("")
  }

  const togglePinChat = (chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, isPinned: !chat.isPinned } : chat
    ))
    setChatMenuOpen(null)
  }

  const toggleMuteChat = (chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, isMuted: !chat.isMuted } : chat
    ))
    setChatMenuOpen(null)
  }

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    if (selectedChat?.id === chatId) setSelectedChat(null)
    setChatMenuOpen(null)
  }

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "online": return "bg-green-500"
      case "away": return "bg-yellow-500"
      case "busy": return "bg-red-500"
      default: return "bg-gray-400"
    }
  }

  const getStatusIcon = (status?: Message["status"]) => {
    switch (status) {
      case "sending": return <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
      case "sent": return <Check className="h-3 w-3" />
      case "delivered": return <CheckCheck className="h-3 w-3" />
      case "read": return <CheckCheck className="h-3 w-3 text-blue-400" />
      default: return null
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / 86400000)
    
    if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (days === 1) return "Yesterday"
    if (days < 7) return date.toLocaleDateString([], { weekday: "short" })
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const filteredChats = chats
    .filter(chat => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      const aTime = a.lastMessage?.timestamp || a.messages[a.messages.length - 1]?.timestamp
      const bTime = b.lastMessage?.timestamp || b.messages[b.messages.length - 1]?.timestamp
      return (bTime?.getTime() || 0) - (aTime?.getTime() || 0)
    })

  const onlineUsers = mockUsers.filter(u => u.status === "online")

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed bottom-6 left-[300px] w-[420px] bg-card border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden",
        "animate-in slide-in-from-bottom-5 fade-in duration-300",
        isMinimized ? "h-14" : "h-[600px]"
      )}
    >
      {/* Header - Click to close */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-pointer"
        onClick={onClose}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
              {chats.reduce((acc, c) => acc + c.unreadCount, 0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Messages</h3>
            <p className="text-xs text-indigo-200">{onlineUsers.length} online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={(e) => { e.stopPropagation(); setShowNewChat(true) }}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={(e) => { e.stopPropagation(); onToggleMinimize() }}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={(e) => { e.stopPropagation(); onClose() }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex overflow-hidden">
          {/* Chat List */}
          {!selectedChat && !showNewChat && !showGroupCreate && (
            <div className="flex-1 flex flex-col">
              {/* Search */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="pl-9 rounded-full bg-muted/50 border-0"
                  />
                </div>
              </div>

              {/* Online Users */}
              <div className="px-3 py-2 border-b">
                <p className="text-xs text-muted-foreground mb-2 font-medium">ONLINE NOW</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {onlineUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => createDirectChat(user)}
                      className="flex flex-col items-center gap-1 min-w-[60px] group"
                    >
                      <div className="relative">
                        <div className={cn("h-12 w-12 rounded-full flex items-center justify-center text-white text-sm font-medium group-hover:scale-105 transition-transform", user.avatar)}>
                          {user.name.charAt(0)}
                        </div>
                        <span className={cn("absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card", getStatusColor(user.status))} />
                      </div>
                      <span className="text-xs truncate w-full text-center">{user.name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {filteredChats.map(chat => (
                  <div
                    key={chat.id}
                    className="relative group"
                  >
                    <button
                      onClick={() => { setSelectedChat(chat); setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c)) }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left",
                        chat.unreadCount > 0 && "bg-primary/5"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        {chat.type === "group" ? (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                            <Users className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-medium", chat.participants[0].avatar)}>
                            {chat.name.charAt(0)}
                          </div>
                        )}
                        {chat.type === "direct" && (
                          <span className={cn("absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card", getStatusColor(chat.participants[0].status))} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn("font-medium truncate flex items-center gap-1", chat.unreadCount > 0 && "font-semibold")}>
                            {chat.isPinned && <Pin className="h-3 w-3 text-muted-foreground" />}
                            {chat.isMuted && <BellOff className="h-3 w-3 text-muted-foreground" />}
                            {chat.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {chat.messages.length > 0 && formatTime(chat.messages[chat.messages.length - 1].timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className={cn("text-sm truncate", chat.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                            {chat.messages.length > 0 ? (
                              <>
                                {chat.messages[chat.messages.length - 1].senderId === "current" && (
                                  <span className="inline-flex items-center mr-1">
                                    {getStatusIcon(chat.messages[chat.messages.length - 1].status)}
                                  </span>
                                )}
                                {chat.messages[chat.messages.length - 1].text}
                              </>
                            ) : "No messages yet"}
                          </p>
                          {chat.unreadCount > 0 && (
                            <span className="h-5 min-w-[20px] px-1.5 bg-primary rounded-full text-xs text-primary-foreground flex items-center justify-center font-medium">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {/* Chat menu */}
                    <button
                      onClick={() => setChatMenuOpen(chatMenuOpen === chat.id ? null : chat.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                    
                    {chatMenuOpen === chat.id && (
                      <div className="absolute right-2 top-full mt-1 bg-card border rounded-lg shadow-xl py-1 z-10 min-w-[140px]">
                        <button onClick={() => togglePinChat(chat.id)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                          <Pin className="h-4 w-4" /> {chat.isPinned ? "Unpin" : "Pin"}
                        </button>
                        <button onClick={() => toggleMuteChat(chat.id)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                          <BellOff className="h-4 w-4" /> {chat.isMuted ? "Unmute" : "Mute"}
                        </button>
                        <button onClick={() => deleteChat(chat.id)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500">
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* New Chat / Group buttons */}
              <div className="p-3 border-t flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowNewChat(true)}>
                  <Plus className="h-4 w-4" /> New Chat
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowGroupCreate(true)}>
                  <Users className="h-4 w-4" /> New Group
                </Button>
              </div>
            </div>
          )}

          {/* New Chat View */}
          {showNewChat && !showGroupCreate && (
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNewChat(false)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">New Message</span>
              </div>
              <div className="p-3 border-b">
                <Input placeholder="Search people..." className="rounded-full bg-muted/50 border-0" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {mockUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => createDirectChat(user)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white font-medium", user.avatar)}>
                        {user.name.charAt(0)}
                      </div>
                      <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card", getStatusColor(user.status))} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create Group View */}
          {showGroupCreate && (
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowGroupCreate(false); setSelectedUsers([]) }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">Create Group</span>
              </div>
              <div className="p-3 border-b space-y-3">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name..."
                  className="rounded-lg"
                />
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                      <span key={user.id} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-sm">
                        {user.name}
                        <button onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))} className="hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                <p className="px-3 py-2 text-xs text-muted-foreground font-medium">SELECT MEMBERS ({selectedUsers.length} selected)</p>
                {mockUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUsers(prev => 
                      prev.find(u => u.id === user.id) 
                        ? prev.filter(u => u.id !== user.id)
                        : [...prev, user]
                    )}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors",
                      selectedUsers.find(u => u.id === user.id) && "bg-primary/5"
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white font-medium", user.avatar)}>
                      {user.name.charAt(0)}
                    </div>
                    <span className="flex-1 text-left font-medium">{user.name}</span>
                    {selectedUsers.find(u => u.id === user.id) && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
              <div className="p-3 border-t">
                <Button 
                  className="w-full" 
                  disabled={selectedUsers.length < 2 || !groupName.trim()}
                  onClick={createGroupChat}
                >
                  Create Group ({selectedUsers.length} members)
                </Button>
              </div>
            </div>
          )}

          {/* Chat View */}
          {selectedChat && (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-3 border-b flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedChat(null)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="relative">
                  {selectedChat.type === "group" ? (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                      <Users className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white font-medium", selectedChat.participants[0].avatar)}>
                      {selectedChat.name.charAt(0)}
                    </div>
                  )}
                  {selectedChat.type === "direct" && (
                    <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card", getStatusColor(selectedChat.participants[0].status))} />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{selectedChat.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedChat.type === "group" 
                      ? `${selectedChat.participants.length} members`
                      : isTyping ? "typing..." : selectedChat.participants[0].status
                    }
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Video className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {selectedChat.messages.map((msg) => {
                  const isOwn = msg.senderId === "current"
                  const sender = msg.senderId === "system" ? null : isOwn ? CURRENT_USER : mockUsers.find(u => u.id === msg.senderId)
                  const showAvatar = selectedChat.type === "group" && !isOwn && msg.senderId !== "system"
                  
                  if (msg.senderId === "system") {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{msg.text}</span>
                      </div>
                    )
                  }
                  
                  return (
                    <div key={msg.id} className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}>
                      {showAvatar && (
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0", sender?.avatar)}>
                          {sender?.name.charAt(0)}
                        </div>
                      )}
                      <div className={cn("max-w-[70%]", showAvatar && "")}>
                        {showAvatar && <p className="text-xs text-muted-foreground mb-1 ml-1">{sender?.name}</p>}
                        <div className={cn(
                          "px-3 py-2 rounded-2xl",
                          isOwn 
                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md"
                            : "bg-card border rounded-bl-md"
                        )}>
                          <p className="text-sm">{msg.text}</p>
                          <div className={cn("flex items-center gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
                            <span className={cn("text-[10px]", isOwn ? "text-indigo-200" : "text-muted-foreground")}>
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {isOwn && <span className="text-indigo-200">{getStatusIcon(msg.status)}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="border-t p-2 bg-card">
                  <div className="flex flex-wrap gap-1">
                    {EMOJI_LIST.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => { setInputValue(prev => prev + emoji); inputRef.current?.focus() }}
                        className="h-8 w-8 hover:bg-muted rounded flex items-center justify-center text-lg hover:scale-110 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t bg-card">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full flex-shrink-0" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full flex-shrink-0">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    onFocus={() => setShowEmojiPicker(false)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full bg-muted/50 border-0"
                  />
                  <Button
                    onClick={handleSend}
                    size="icon"
                    disabled={!inputValue.trim()}
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
