import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { authApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Mail, Eye, EyeOff } from "lucide-react"

export function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

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

      if (response.data.must_change_password) {
        toast({
          title: "Password change required",
          description: "You must change your password before continuing.",
        })
        navigate("/change-password")
        return
      }

      navigate("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-[#e8e8e8] relative">
      {/* Top left corner */}
      <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-[#5a8a8f]" 
           style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
      
      {/* Bottom right corner */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[600px] bg-[#5a8a8f]"></div>

      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="relative w-full max-w-6xl">
          {/* Main card with diagonal split */}
          <div className="relative bg-white rounded-[40px] shadow-2xl overflow-hidden" style={{ minHeight: '600px' }}>
            <div className="flex">
              {/* Left side - Form */}
              <div className="w-1/2 p-16 relative z-10">
                {/* Paper plane */}
                <div className="absolute top-8 right-8">
                  <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
                    <path d="M20 50 L60 20 L25 35 Z" stroke="#333" strokeWidth="2" fill="white"/>
                    <path d="M60 20 Q75 12 82 5" stroke="#333" strokeWidth="1.5" strokeDasharray="4 4" fill="none"/>
                    <circle cx="85" cy="3" r="4" fill="#5a8a8f"/>
                  </svg>
                </div>

                <h2 className="text-3xl font-semibold text-[#5a8a8f] mb-12 mt-8">Login to your account</h2>

                <form onSubmit={handleLogin} className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Enter User Name :</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="enteremail123@gmail.com"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border-b-2 border-gray-300 focus:border-[#5a8a8f] outline-none bg-transparent text-gray-700"
                        required
                      />
                      <Mail className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Enter Password :</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border-b-2 border-gray-300 focus:border-[#5a8a8f] outline-none bg-transparent text-gray-700"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 border-2 border-gray-400 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Remember me</span>
                    </label>
                    <button type="button" className="text-sm text-gray-700 hover:text-[#5a8a8f]">
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#5a8a8f] hover:bg-[#4a7a7f] text-white font-semibold rounded-xl transition-all disabled:opacity-50 mt-8 text-lg"
                  >
                    {loading ? "Signing In..." : "Login"}
                  </button>
                </form>
              </div>

              {/* Right side - Illustration with diagonal */}
              <div className="w-1/2 relative">
                {/* Diagonal overlay */}
                <div className="absolute inset-0 bg-[#5a8a8f]" 
                     style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}>
                  
                  {/* Illustration */}
                  <div className="flex items-center justify-center h-full p-12">
                    <svg width="450" height="400" viewBox="0 0 450 400" fill="none">
                      {/* Hand with package */}
                      <ellipse cx="80" cy="200" rx="45" ry="40" fill="#f4a89f"/>
                      <path d="M60 180 Q80 160 100 180" fill="#f4a89f"/>
                      <rect x="55" y="165" width="40" height="40" rx="3" fill="#ff9f5a"/>
                      <rect x="60" y="170" width="30" height="30" fill="#4a7a7f" opacity="0.3"/>
                      <circle cx="75" cy="185" r="3" fill="white"/>
                      
                      {/* Search icon */}
                      <circle cx="130" cy="170" r="12" stroke="white" strokeWidth="2" fill="none"/>
                      <line x1="138" y1="178" x2="148" y2="188" stroke="white" strokeWidth="2"/>
                      
                      {/* Globe */}
                      <circle cx="240" cy="180" r="70" fill="#b8d4e8" opacity="0.4"/>
                      <ellipse cx="240" cy="180" rx="70" ry="30" fill="none" stroke="#7ba8c4" strokeWidth="2"/>
                      <ellipse cx="240" cy="180" rx="35" ry="70" fill="none" stroke="#7ba8c4" strokeWidth="2"/>
                      <line x1="170" y1="180" x2="310" y2="180" stroke="#7ba8c4" strokeWidth="2"/>
                      
                      {/* Location pin on globe */}
                      <path d="M240 150 Q240 165 240 170 L235 175 L240 185 L245 175 Z" fill="#4a9eff"/>
                      <circle cx="240" cy="155" r="5" fill="#4a9eff"/>
                      
                      {/* Map/Document */}
                      <rect x="310" y="160" width="50" height="60" rx="3" fill="white" opacity="0.9"/>
                      <line x1="320" y1="175" x2="350" y2="175" stroke="#5a8a8f" strokeWidth="2"/>
                      <line x1="320" y1="185" x2="345" y2="185" stroke="#5a8a8f" strokeWidth="1.5"/>
                      <line x1="320" y1="195" x2="350" y2="195" stroke="#5a8a8f" strokeWidth="1.5"/>
                      
                      {/* Location pins */}
                      <path d="M370 140 Q370 150 370 155 L367 158 L370 165 L373 158 Z" fill="#4a9eff"/>
                      <circle cx="370" cy="145" r="4" fill="#4a9eff"/>
                      
                      {/* Packages/Boxes on forklift */}
                      <rect x="140" y="280" width="35" height="35" rx="2" fill="#ff6b6b"/>
                      <rect x="145" y="285" width="25" height="25" fill="#4a7a7f" opacity="0.2"/>
                      <rect x="180" y="290" width="30" height="30" rx="2" fill="#ffd93d"/>
                      <rect x="185" y="295" width="20" height="20" fill="#4a7a7f" opacity="0.2"/>
                      
                      {/* Forklift */}
                      <rect x="210" y="295" width="60" height="35" fill="#4a7a7f"/>
                      <rect x="220" y="270" width="20" height="25" fill="#5a8a8f"/>
                      <circle cx="225" cy="335" r="10" fill="#333"/>
                      <circle cx="255" cy="335" r="10" fill="#333"/>
                      <rect x="200" y="280" width="12" height="50" fill="#6a9a9f"/>
                      
                      {/* Stacked boxes */}
                      <rect x="230" y="250" width="30" height="30" rx="2" fill="#4a7a7f"/>
                      <rect x="235" y="255" width="20" height="20" fill="#5a8a8f" opacity="0.3"/>
                      <line x1="245" y1="255" x2="245" y2="275" stroke="white" strokeWidth="2"/>
                      <line x1="235" y1="265" x2="255" y2="265" stroke="white" strokeWidth="2"/>
                      
                      {/* Mobile with checkmark */}
                      <rect x="360" y="250" width="45" height="80" rx="6" fill="#2d3748"/>
                      <rect x="365" y="258" width="35" height="60" rx="3" fill="#5a8a8f"/>
                      <circle cx="382" cy="280" r="15" fill="#4ade80"/>
                      <path d="M375 280 L380 285 L390 273" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      
                      {/* Truck */}
                      <rect x="300" y="300" width="100" height="50" rx="5" fill="#ff6b6b"/>
                      <rect x="360" y="280" width="40" height="20" fill="#ff5252"/>
                      <rect x="365" y="285" width="30" height="10" fill="#b8d4e8"/>
                      <circle cx="320" cy="355" r="13" fill="#2d3748"/>
                      <circle cx="320" cy="355" r="7" fill="#4a5568"/>
                      <circle cx="375" cy="355" r="13" fill="#2d3748"/>
                      <circle cx="375" cy="355" r="7" fill="#4a5568"/>
                      <path d="M310 315 L318 323 L330 308" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      
                      {/* Clouds */}
                      <ellipse cx="100" cy="120" rx="18" ry="10" fill="white" opacity="0.6"/>
                      <ellipse cx="115" cy="123" rx="15" ry="8" fill="white" opacity="0.6"/>
                      <ellipse cx="380" cy="100" rx="20" ry="12" fill="white" opacity="0.6"/>
                      <ellipse cx="395" cy="105" rx="18" ry="10" fill="white" opacity="0.6"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
