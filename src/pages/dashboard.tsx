import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, Users, Clock } from "lucide-react"
import { LoginModal } from "@/pages/login"
import { useState, useEffect } from "react"

export function DashboardPage() {
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowLoginModal(true), 500)
    return () => clearTimeout(timer)
  }, [])
  const stats = [
    {
      title: "Total Dispatches",
      value: "1,234",
      icon: Package,
      change: "+12.5%",
      changeType: "positive" as const,
    },
    {
      title: "Active Routes",
      value: "89",
      icon: TrendingUp,
      change: "+5.2%",
      changeType: "positive" as const,
    },
    {
      title: "Team Members",
      value: "45",
      icon: Users,
      change: "+2",
      changeType: "positive" as const,
    },
    {
      title: "Avg. Processing Time",
      value: "24m",
      icon: Clock,
      change: "-8.1%",
      changeType: "positive" as const,
    },
  ]

  return (
    <>
      <LoginModal isOpen={showLoginModal} />
      
      <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="text-muted-foreground">Here's what's happening with your operations today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="card-shadow-lg rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 font-semibold mt-1">
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Dispatch #{1000 + i} completed</p>
                    <p className="text-xs text-muted-foreground">{i} hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {["New Dispatch", "View Reports", "Team Status", "Analytics"].map((action) => (
                <button
                  key={action}
                  className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <p className="font-semibold">{action}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
