import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { authApi, lookupApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { LoginIllustration } from "@/components/login-illustration"
import { Facebook, Twitter } from "lucide-react"
import { useRef } from "react"
import gsap from "gsap"

export function LoginPage() {
  const [role, setRole] = useState<"FTE" | "Backroom">("Backroom")
  const [opsId, setOpsId] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [showTruckAnimation, setShowTruckAnimation] = useState(false)
  const [animationDone, setAnimationDone] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const truckRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleOpsIdBlur = async () => {
    if (!opsId || role !== "Backroom") return

    setLookupLoading(true)
    const response = await lookupApi.getUser(opsId)
    setLookupLoading(false)

    if (response.data) {
      setName(response.data.name)
    } else {
      toast({
        variant: "destructive",
        title: "Ops ID not found",
        description: "Please check the Ops ID and try again.",
      })
      setName("")
    }
  }

  const handleBackroomLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setShowTruckAnimation(true)

    const button = buttonRef.current
    const truck = truckRef.current
    const box = boxRef.current

    if (button && truck && box) {
      gsap.to(button, { '--box-s': 1, '--box-o': 1, duration: .3, delay: .5 })
      gsap.to(box, { x: 0, duration: .4, delay: .7 })
      gsap.to(button, { '--hx': -5, '--bx': 50, duration: .18, delay: .92 })
      gsap.to(box, { y: 0, duration: .1, delay: 1.15 })
      gsap.set(button, { '--truck-y': 0, '--truck-y-n': -26 })
      gsap.to(button, {
        '--truck-y': 1,
        '--truck-y-n': -25,
        duration: .2,
        delay: 1.25,
        onComplete() {
          gsap.timeline({
            onComplete() {
              setAnimationDone(true)
            }
          })
            .to(truck, { x: 0, duration: .4 })
            .to(truck, { x: 40, duration: 1 })
            .to(truck, { x: 20, duration: .6 })
            .to(truck, { x: 96, duration: .4 })
          gsap.to(button, { '--progress': 1, duration: 2.4, ease: 'power2.in' })
        }
      })
    }

    const response = await authApi.login(opsId, password)
    setLoading(false)

    if (response.error) {
      setShowTruckAnimation(false)
      setAnimationDone(false)
      toast({
        variant: "destructive",
        title: "Login failed",
        description: response.error,
      })
      return
    }

    if (response.data) {
      login(response.data.user, response.data.token)

      if (response.data.must_change_password) {
        toast({
          title: "Password change required",
          description: "You must change your password before continuing.",
        })
        navigate("/change-password")
        return
      }

      setTimeout(() => {
        navigate("/dashboard")
      }, 500)
    }
  }

  const handleGoogleLogin = async () => {
    toast({
      title: "Google Sign-In",
      description: "Google OAuth integration coming soon. Please contact your administrator.",
    })
  }

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(135deg, #E8EAF6 0%, #C5CAE9 100%)" }}>
      <div className="flex-1 flex items-center justify-center p-12">
        <LoginIllustration className="w-full max-w-2xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-12">
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-8">
            SOC Internal Tool
          </h2>

          <div className="flex gap-2 mb-8">
            <Button
              variant={role === "FTE" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("FTE")}
            >
              FTE
            </Button>
            <Button
              variant={role === "Backroom" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("Backroom")}
            >
              Backroom
            </Button>
          </div>

          {role === "Backroom" ? (
            <form onSubmit={handleBackroomLogin} className="space-y-6">
              <div>
                <Label htmlFor="opsId" className="text-sm text-gray-600">Ops ID</Label>
                <Input
                  id="opsId"
                  placeholder="Enter your Ops ID"
                  value={opsId}
                  onChange={(e) => setOpsId(e.target.value.toUpperCase())}
                  onBlur={handleOpsIdBlur}
                  className="border-0 border-b-2 border-gray-300 rounded-none px-0 focus:border-blue-600 focus-visible:ring-0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="name" className="text-sm text-gray-600">Name</Label>
                <Input
                  id="name"
                  value={name}
                  readOnly
                  disabled={lookupLoading}
                  placeholder={lookupLoading ? "Looking up..." : "Auto-filled"}
                  className="border-0 border-b-2 border-gray-300 rounded-none px-0 bg-transparent"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm text-gray-600">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-0 border-b-2 border-gray-300 rounded-none px-0 focus:border-blue-600 focus-visible:ring-0"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  First-time default: SOC5-Outbound
                </p>
              </div>

              <div className="flex justify-center gap-4 my-6">
                <button
                  type="button"
                  className="h-14 w-14 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center transition-colors"
                >
                  <Facebook className="h-6 w-6 text-white" fill="white" />
                </button>
                <button
                  type="button"
                  className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
                >
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="white">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
                >
                  <Twitter className="h-6 w-6 text-white" fill="white" />
                </button>
              </div>

              <button
                ref={buttonRef}
                type="submit"
                disabled={loading || !name}
                className={`truck-button w-full h-14 rounded-full bg-blue-700 hover:bg-blue-800 text-white text-lg tracking-widest ${showTruckAnimation ? 'animation' : ''} ${animationDone ? 'done' : ''}`}
                style={{
                  '--color': '#fff',
                  '--background': '#1d4ed8',
                  '--tick': '#16BF78',
                  '--base': '#0D0F18',
                  '--wheel': '#2B3044',
                  '--wheel-inner': '#646B8C',
                  '--wheel-dot': '#fff',
                  '--back': '#6D58FF',
                  '--back-inner': '#362A89',
                  '--back-inner-shadow': '#2D246B',
                  '--front': '#A6ACCD',
                  '--front-shadow': '#535A79',
                  '--front-light': '#FFF8B1',
                  '--window': '#2B3044',
                  '--window-shadow': '#404660',
                  '--street': '#646B8C',
                  '--street-fill': '#404660',
                  '--box': '#DCB97A',
                  '--box-shadow': '#B89B66',
                  '--br': '9999px',
                  '--rx': '0deg',
                  '--progress': 0,
                  '--truck-x': '4px',
                  '--truck-y': 0,
                  '--truck-y-n': -26,
                  '--box-x': -24,
                  '--box-y': -6,
                  '--box-s': 0.5,
                  '--box-o': 0,
                  '--hx': 0,
                  '--bx': 0,
                } as React.CSSProperties}
              >
                <span className="default" style={{ opacity: showTruckAnimation ? 0 : 1 }}>E N T E R</span>
                <span className="loading" style={{ position: 'absolute', top: '12px', left: 0, right: 0, opacity: showTruckAnimation && !animationDone ? 1 : 0 }}>Loading...</span>
                <span className="success" style={{ position: 'absolute', top: '12px', left: 0, right: 0, opacity: animationDone ? 1 : 0 }}>Welcome Back</span>
                <div ref={truckRef} className="truck" style={{ position: 'absolute', width: '72px', height: '28px', transform: 'rotateX(90deg) translate3d(4px, 26px, 12px)' }}>
                  <div className="wheel" style={{ position: 'absolute', bottom: '-6px', left: '6px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--wheel)' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: '35px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--wheel)' }}></div>
                  </div>
                  <div className="back" style={{ position: 'absolute', left: 0, bottom: 0, zIndex: 1, width: '47px', height: '28px', borderRadius: '1px 1px 0 0', background: 'linear-gradient(68deg, var(--back-inner) 0%, var(--back-inner) 22%, var(--back-inner-shadow) 22.1%, var(--back-inner-shadow) 100%)' }}>
                    <div style={{ content: '', position: 'absolute', left: '11px', top: 0, right: 0, bottom: 0, zIndex: 2, borderRadius: '0 1px 0 0', background: 'var(--back)' }}></div>
                  </div>
                  <div className="front" style={{ position: 'absolute', left: '47px', bottom: '-1px', height: '22px', width: '24px', clipPath: 'polygon(55% 0, 72% 44%, 100% 58%, 100% 100%, 0 100%, 0 0)', background: 'linear-gradient(84deg, var(--front-shadow) 0%, var(--front-shadow) 10%, var(--front) 12%, var(--front) 100%)' }}></div>
                  <div ref={boxRef} className="box" style={{ position: 'absolute', width: '13px', height: '13px', right: '56px', bottom: 0, zIndex: 1, borderRadius: '1px', transform: 'translate(-24px, -6px) scale(0.5)', opacity: 0, background: 'linear-gradient(68deg, var(--box) 0%, var(--box) 50%, var(--box-shadow) 50.2%, var(--box-shadow) 100%)', backgroundSize: '250% 100%' }}></div>
                </div>
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 text-center">
                FTE users can sign in using their company Google account.
              </p>

              <div className="flex justify-center gap-4 my-6">
                <button
                  type="button"
                  className="h-14 w-14 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center transition-colors"
                >
                  <Facebook className="h-6 w-6 text-white" fill="white" />
                </button>
                <button
                  type="button"
                  className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
                >
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="white">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
                >
                  <Twitter className="h-6 w-6 text-white" fill="white" />
                </button>
              </div>

              <Button
                onClick={handleGoogleLogin}
                className="w-full h-14 rounded-full bg-blue-700 hover:bg-blue-800 text-white text-lg tracking-widest"
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
