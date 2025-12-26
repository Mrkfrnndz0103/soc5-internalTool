import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Layout } from "@/components/layout"
import { LoginModal } from "@/components/login-modal"
import { DashboardPage } from "@/pages/dashboard"
import { DispatchReportPage } from "@/pages/dispatch-report"
import { PrealertPage } from "@/pages/prealert"

// Placeholder pages for other routes
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">{title}</h1>
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-muted-foreground">
          This page is under development. Content will be added soon.
        </p>
      </div>
    </div>
  )
}



function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Outbound routes */}
        <Route path="outbound/dispatch-monitoring" element={<PlaceholderPage title="Dispatch Monitoring" />} />
        <Route path="outbound/dispatch-report" element={<DispatchReportPage />} />
        <Route path="outbound/prealert" element={<PrealertPage />} />
        <Route path="outbound/bay-allocation" element={<PlaceholderPage title="Per Bay Allocation" />} />

        {/* Outbound Admin routes */}
        <Route path="outbound/admin/attendance" element={<PlaceholderPage title="Attendance" />} />
        <Route path="outbound/admin/masterfile" element={<PlaceholderPage title="Masterfile" />} />
        <Route path="outbound/admin/attendance-history" element={<PlaceholderPage title="Attendance History" />} />
        <Route path="outbound/admin/breaktime" element={<PlaceholderPage title="Breaktime Management" />} />
        <Route path="outbound/admin/leave" element={<PlaceholderPage title="Leave Management" />} />
        <Route path="outbound/admin/workstation" element={<PlaceholderPage title="Workstation" />} />

        {/* KPI & Compliance routes */}
        <Route path="kpi/mdt" element={<PlaceholderPage title="MDT" />} />
        <Route path="kpi/workstation" element={<PlaceholderPage title="Workstation" />} />
        <Route path="kpi/productivity" element={<PlaceholderPage title="Productivity" />} />
        <Route path="kpi/intraday" element={<PlaceholderPage title="Intraday" />} />

        {/* Midmile routes */}
        <Route path="midmile/truck-request" element={<PlaceholderPage title="Truck Request" />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="outbound-theme">
        <AuthProvider>
          <LoginModal />
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
