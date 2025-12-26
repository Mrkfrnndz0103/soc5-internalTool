import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { authApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Mail, Eye, EyeOff, QrCode, Smartphone, MessageCircle, X, Send } from "lucide-react"

export function LoginModal() {
  const [method, setMethod] = useState<"qr" | "password" | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState("")

  const { login, isAuthenticated } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => setShowModal(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (method === "qr") {
      setTimeout(() => {
        setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + "/auth/" + Date.now())}`)
      }, 300)
    }
  }, [method])

  if (isAuthenticated) {
    return null
  }

  if (!showModal) {
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const response = await authApi.login(username, password)
    setLoading(false)

    if (response.error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: response.error,
      })
      return
    }

    if (response.data) {
      login(response.data.user, response.data.token)
    }
  }

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      toast({
        title: "Message sent",
        description: "Data Team will respond shortly.",
      })
      setChatMessage("")
      setShowChat(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-backdrop">
        <div className="relative w-full max-w-4xl mx-4 modal-container">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-2xl font-semibold text-white">Please select login method</h2>
            <div className="flex items-center gap-2">
              <svg width="60" height="40" viewBox="0 0 60 40" className="truck-moving">
                {/* Truck body */}
                <rect x="20" y="15" width="30" height="15" rx="2" fill="#60a5fa" />
                {/* Truck cabin */}
                <rect x="35" y="8" width="15" height="7" fill="#3b82f6" />
                {/* Window */}
                <rect x="37" y="10" width="5" height="3" fill="#93c5fd" opacity="0.6" />
                {/* Wheels */}
                <circle cx="28" cy="32" r="4" fill="#1e293b" />
                <circle cx="28" cy="32" r="2" fill="#475569" />
                <circle cx="44" cy="32" r="4" fill="#1e293b" />
                <circle cx="44" cy="32" r="2" fill="#475569" />
                {/* Motion lines */}
                <line x1="5" y1="20" x2="15" y2="20" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4" className="motion-line-1" />
                <line x1="8" y1="25" x2="16" y2="25" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4" className="motion-line-2" />
              </svg>
            </div>
          </div>

          <div className="flex">
            {/* Left side - Method selection */}
            <div className="w-1/2 p-12 flex flex-col justify-center">
              <p className="text-white/70 mb-8">Choose how you want to sign in</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => setMethod("qr")}
                  className={`login-button w-full py-4 px-6 rounded-2xl font-medium relative overflow-hidden group ${
                    method === "qr" ? "active" : ""
                  }`}
                >
                  <span className="button-bg"></span>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Scan with phone
                  </span>
                </button>
                
                <button
                  onClick={() => setMethod("password")}
                  className={`login-button w-full py-4 px-6 rounded-2xl font-medium relative overflow-hidden group ${
                    method === "password" ? "active" : ""
                  }`}
                >
                  <span className="button-bg"></span>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Use password
                  </span>
                </button>
              </div>

              <div className="mt-12 text-sm">
                <p className="text-white/60 mb-2">Need help?</p>
                <button
                  onClick={() => setShowChat(true)}
                  className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 group"
                >
                  <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Contact Data Team
                </button>
              </div>
            </div>

            {/* Right side - Content */}
            <div className="w-1/2 p-12 bg-white/5 backdrop-blur-sm border-l border-white/10 flex items-center justify-center">
              {!method && (
                <div className="text-center text-white/40 animate-pulse">
                  <p className="text-lg">Select a login method to continue</p>
                </div>
              )}

              {method === "qr" && (
                <div className="text-center qr-content">
                  <div className="qr-wrapper group cursor-pointer">
                    {!qrCode && (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <div className="qr-placeholder">
                          <QrCode className="w-24 h-24 text-purple-400/40" />
                          <div className="mt-2 text-sm text-gray-400">Loading...</div>
                        </div>
                      </div>
                    )}
                    {qrCode && <img src={qrCode} alt="QR Code" className="w-48 h-48 qr-image" />}
                  </div>
                  <p className="text-white mt-6 font-medium">Scan with your phone's camera</p>
                  <div className="flex items-center justify-center gap-3 mt-6 text-white/60">
                    <Smartphone className="w-5 h-5" />
                    <span className="text-sm">Point your camera at the QR code</span>
                  </div>
                </div>
              )}

              {method === "password" && (
                <form onSubmit={handleLogin} className="w-full space-y-6 password-form">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Email or Username</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter your email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                        required
                      />
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 text-white/40" /> : <Eye className="w-5 h-5 text-white/40" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Box */}
      {showChat && (
        <div className="fixed inset-0 z-[60] flex items-end justify-end p-6 pointer-events-none">
          <div className="chat-box pointer-events-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Contact Data Team</h3>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-white/90">Hi! How can we help you today?</p>
                <p className="text-xs text-white/60 mt-1">Data Team • Online</p>
              </div>
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                rows={3}
              />
              <button
                onClick={handleSendMessage}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
