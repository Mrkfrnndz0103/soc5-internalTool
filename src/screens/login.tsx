"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { authApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { QrCode, MessageCircle, X, CheckCircle2 } from "lucide-react"

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void
          renderButton: (element: HTMLElement, options: Record<string, string>) => void
        }
      }
    }
  }
}

const GOOGLE_SCRIPT_ID = "google-gsi-script"

export function LoginModal() {
  const allowedDomains = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || "shopeemobile-external.com,spxexpress.com")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
  const [email, setEmail] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [isQrZoomed, setIsQrZoomed] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [helpMessage, setHelpMessage] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [sessionUnlocked, setSessionUnlocked] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const googleButtonRef = useRef<HTMLDivElement | null>(null)

  const { login } = useAuth()
  const { toast } = useToast()

  const createSession = useCallback(async (sid: string) => {
    await authApi.createSeatalkSession(sid)
  }, [])

  const handleSeatalkLogin = useCallback(async (email: string) => {
    const response = await authApi.login(email, "")
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
      setShowSuccess(true)
    }
  }, [login, toast])

  const startPolling = useCallback((sid: string) => {
    pollingRef.current = setInterval(async () => {
      const response = await authApi.checkSeatalkAuth(sid)
      if (response.data?.authenticated && response.data?.email) {
        if (pollingRef.current) clearInterval(pollingRef.current)
        await handleSeatalkLogin(response.data.email)
      }
    }, 2000)
  }, [handleSeatalkLogin])

  useEffect(() => {
    const timer = setTimeout(() => setShowModal(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!showModal || sessionUnlocked) {
      return
    }

    const newSessionId = `seatalk-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    createSession(newSessionId)
    setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`seatalk://auth/soc5-outbound?session=${newSessionId}`)}`)
    startPolling(newSessionId)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [showModal, sessionUnlocked, createSession, startPolling])

  useEffect(() => {
    if (!showModal || sessionUnlocked || !googleClientId) {
      return
    }

    const loadGoogleScript = () =>
      new Promise<void>((resolve, reject) => {
        if (document.getElementById(GOOGLE_SCRIPT_ID)) {
          resolve()
          return
        }
        const script = document.createElement("script")
        script.id = GOOGLE_SCRIPT_ID
        script.src = "https://accounts.google.com/gsi/client"
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error("Failed to load Google script"))
        document.head.appendChild(script)
      })

    let cancelled = false

    loadGoogleScript()
      .then(() => {
        if (cancelled) return
        if (!window.google?.accounts?.id || !googleButtonRef.current) {
          return
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (!response.credential) {
              toast({
                variant: "destructive",
                title: "Google login failed",
                description: "No credential received from Google.",
              })
              return
            }
            const result = await authApi.googleLogin(response.credential)
            if (result.error) {
              toast({
                variant: "destructive",
                title: "Google login failed",
                description: result.error,
              })
              return
            }
            if (result.data) {
              login(result.data.user, result.data.token)
              setShowSuccess(true)
            }
          },
        })

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "filled_black",
          size: "large",
          type: "standard",
          shape: "pill",
          width: "280",
        })

        setGoogleReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setGoogleReady(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [showModal, sessionUnlocked, googleClientId, login, toast])

  useEffect(() => {
    if (!showSuccess) return
    const timer = setTimeout(() => setSessionUnlocked(true), 1200)
    return () => clearTimeout(timer)
  }, [showSuccess])

  const handleBackroomLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const domain = email.split("@")[1]?.toLowerCase() || ""
    if (!domain || !allowedDomains.includes(domain)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: `Only ${allowedDomains.map((d) => `@${d}`).join(" or ")} emails are allowed.`,
      })
      return
    }

    setLoading(true)
    const response = await authApi.login(email, "")
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
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      setShowSuccess(true)
    }
  }

  const handleQrClick = () => {
    setIsQrZoomed(true)
    setTimeout(() => setIsQrZoomed(false), 5000)
  }

  const handleSendHelp = () => {
    if (helpMessage.trim()) {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the Data Team. They will respond shortly.",
      })
      setHelpMessage("")
      setShowHelp(false)
    }
  }

  if (!showModal || sessionUnlocked) return null

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"></div>
        <div className="relative animate-in zoom-in-50 fade-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 -m-20">
              <div className="absolute inset-0 border-4 border-green-500/30 rounded-full animate-ping"></div>
              <div className="absolute inset-0 border-4 border-green-500/20 rounded-full animate-pulse"></div>
            </div>
            
            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-8 shadow-2xl">
              <CheckCircle2 className="w-24 h-24 text-white animate-in zoom-in-50 duration-700" />
            </div>
          </div>
          
          <div className="text-center mt-8 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-300">
            <h2 className="text-4xl font-bold text-white mb-2">Login Successful!</h2>
            <p className="text-gray-300 text-lg">Welcome back to SOC5 Outbound</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500"></div>

        <div className="relative w-full max-w-3xl mx-4 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
          <div className="bg-[#252836] rounded-2xl shadow-2xl overflow-hidden animate-shadow-pulse">
            <div className="text-center py-6 px-6 animate-in slide-in-from-top-4 duration-500 delay-150">
              <h1 className="text-2xl font-semibold text-white mb-1">Login to continue</h1>
              <p className="text-sm text-gray-400">Scan QR code with SeaTalk (FTE) or enter email (Backroom)</p>
            </div>

            <div className="flex items-center justify-center px-8 pb-8 gap-8">
              <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-50 duration-700 delay-300">
                <div className="relative group">
                  <div className="absolute -inset-3 bg-gradient-to-r from-[#5a8a8f] via-[#6ac4d0] to-[#5a8a8f] rounded-3xl blur-lg opacity-60 animate-spin-slow"></div>
                  <div className="absolute -inset-2 bg-gradient-to-l from-[#4a7a7f] via-[#5a8a8f] to-[#4a7a7f] rounded-3xl blur opacity-80 animate-spin-reverse"></div>
                  
                  <div 
                    onClick={handleQrClick}
                    className={`relative bg-gradient-to-br from-white via-gray-50 to-white p-5 rounded-2xl shadow-2xl transform transition-all duration-500 border-2 border-white/50 cursor-pointer ${
                      isQrZoomed ? 'scale-150' : 'group-hover:scale-105'
                    }`}
                  >
                    <div className="absolute top-1 left-1 w-6 h-6 border-t-3 border-l-3 border-[#5a8a8f] rounded-tl-xl"></div>
                    <div className="absolute top-1 right-1 w-6 h-6 border-t-3 border-r-3 border-[#5a8a8f] rounded-tr-xl"></div>
                    <div className="absolute bottom-1 left-1 w-6 h-6 border-b-3 border-l-3 border-[#5a8a8f] rounded-bl-xl"></div>
                    <div className="absolute bottom-1 right-1 w-6 h-6 border-b-3 border-r-3 border-[#5a8a8f] rounded-br-xl"></div>
                    
                    <div className="absolute inset-2 bg-gradient-to-br from-[#5a8a8f]/10 to-transparent rounded-xl"></div>
                    
                    {qrCode ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCode} alt="QR Code" className="w-40 h-40 relative z-10 rounded-lg animate-in zoom-in-50 duration-500 delay-500" />
                      </>
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                        <QrCode className="w-24 h-24 text-[#5a8a8f] animate-pulse" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#5a8a8f]/50 to-transparent animate-scan"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-white text-base font-semibold mb-1">Use SeaTalk App to Scan QR</h3>
                  <p className="text-gray-400 text-xs max-w-xs">
                    Open SeaTalk mobile app and scan to authenticate
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center relative animate-in fade-in duration-800 delay-200 -ml-4">
                <div className="h-56 w-0.5 bg-gradient-to-b from-transparent via-blue-400 to-transparent relative overflow-hidden shadow-lg">
                  <div className="absolute inset-0 w-full">
                    <div className="absolute w-full h-16 bg-gradient-to-b from-transparent via-blue-400 to-transparent blur-md animate-glow-run opacity-90"></div>
                    <div className="absolute w-full h-20 bg-gradient-to-b from-transparent via-blue-400 to-transparent blur-sm animate-glow-run-delayed opacity-70"></div>
                    <div className="absolute w-full h-14 bg-gradient-to-b from-transparent via-blue-300 to-transparent blur-sm animate-glow-run-fast opacity-60"></div>
                  </div>
                </div>
                <div className="absolute animate-in zoom-in-50 duration-500 delay-700">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                    <span className="relative bg-[#252836] px-2 py-0.5 text-white font-medium rounded-full border border-blue-400 text-[11px] shadow-lg">OR</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 animate-in slide-in-from-right-4 duration-700 delay-400">
                <div className="mb-6 flex flex-col items-center">
                  {googleClientId ? (
                    <div className="flex flex-col items-center gap-2">
                      <div ref={googleButtonRef} />
                      {googleReady ? (
                        <p className="text-xs text-gray-400">FTE users: Sign in with Google</p>
                      ) : (
                        <p className="text-xs text-gray-500">Loading Google Sign-In...</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-red-400 text-center">Google Sign-In not configured.</p>
                  )}
                </div>
                <form onSubmit={handleBackroomLogin} className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-xs font-medium mb-2">
                      Enter Google Account (External Email)
                    </label>
                    <input
                      type="email"
                      placeholder="username@shopeemobile-external.com or @spxexpress.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-[#1a1d29] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#5a8a8f] transition-colors"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      By proceeding you confirm that you agree to the{" "}
                      <span className="text-white font-medium">Privacy Policy</span> &{" "}
                      <span className="text-white font-medium">Terms of Use</span>.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#5a8a8f] hover:bg-[#4a7a7f] text-white font-semibold rounded-lg transition-all disabled:opacity-50 text-sm"
                  >
                    {loading ? "Signing In..." : "Continue"}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-400">
                    Having trouble logging in?{" "}
                    <button 
                      onClick={() => setShowHelp(true)}
                      className="text-[#5a8a8f] hover:underline font-medium"
                    >
                      Get Help
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowHelp(false)}></div>
          <div className="relative w-full max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="bg-[#252836] rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#5a8a8f]" />
                  <h3 className="text-lg font-semibold text-white">Contact Data Team</h3>
                </div>
                <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-400 mb-4">
                Describe your issue and our Data Team will assist you shortly.
              </p>
              
              <textarea
                value={helpMessage}
                onChange={(e) => setHelpMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full h-32 px-3 py-2 bg-[#1a1d29] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#5a8a8f] resize-none text-sm"
              />
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowHelp(false)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendHelp}
                  disabled={!helpMessage.trim()}
                  className="flex-1 py-2 bg-[#5a8a8f] hover:bg-[#4a7a7f] text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
