import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { authApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<"Backroom" | "FTE" | null>(null)
  const [opsId, setOpsId] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const response = await authApi.login(opsId, password)
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

  if (!selectedRole) {
    return (
      <div className="flex min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#2D3748]">
          <p className="text-white/80 text-lg">Book Shuttle in one go</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white">
          <h1 className="text-2xl font-semibold text-gray-800 mb-12 text-center">
            Unified Platform for Employee Transport<br />Automation
          </h1>

          <div className="flex gap-8">
            <button
              onClick={() => setSelectedRole("Backroom")}
              className="w-64 h-80 bg-[#374151] hover:bg-[#4B5563] rounded-2xl flex flex-col items-center justify-center transition-all shadow-xl hover:shadow-2xl"
            >
              <div className="w-24 h-24 rounded-full bg-[#EF8B7F] mb-6"></div>
              <p className="text-white text-xl font-medium">Employee Login</p>
            </button>

            <button
              onClick={() => setSelectedRole("FTE")}
              className="w-64 h-80 bg-[#374151] hover:bg-[#4B5563] rounded-2xl flex flex-col items-center justify-center transition-all shadow-xl hover:shadow-2xl"
            >
              <div className="w-24 h-24 rounded-full bg-[#D4A574] mb-6"></div>
              <p className="text-white text-xl font-medium">Vendor Login</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#2D3748]">
        <p className="text-white/80 text-lg">Book Shuttle in one go</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-12 bg-white">
        <div className="w-full max-w-md">
          <button
            onClick={() => setSelectedRole(null)}
            className="mb-8 text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>

          <h2 className="text-3xl font-semibold text-gray-800 mb-2">
            {selectedRole === "Backroom" ? "Employee" : "Vendor"} Login
          </h2>
          <div className="w-20 h-1 bg-[#EF8B7F] rounded-full mb-8"></div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#EF8B7F]"></div>
              <input
                type="text"
                placeholder="Enter your ID"
                value={opsId}
                onChange={(e) => setOpsId(e.target.value.toUpperCase())}
                className="w-full pl-16 h-12 border-0 border-b-2 border-gray-200 focus:border-[#EF8B7F] outline-none"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#EF8B7F]"></div>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-16 h-12 border-0 border-b-2 border-gray-200 focus:border-[#EF8B7F] outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#EF8B7F] hover:bg-[#E07A6E] text-white font-medium text-lg shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
