import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Layout } from "@/components/layout"
import { AnimatedPage } from "@/components/animated-page"
import { DashboardPage } from "@/pages/dashboard"
import { DispatchReportPage } from "@/pages/dispatch-report"
import { DispatchMonitoringPage } from "@/pages/dispatch-monitoring"
import { PrealertPage } from "@/pages/prealert"

// Placeholder pages for other routes
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">{title}</h1>
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
        <Route path="dashboard" element={
          <AnimatedPage>
            <DashboardPage />
          </AnimatedPage>
        } />

        {/* Outbound routes */}
        <Route path="outbound/dispatch-monitoring" element={
          <AnimatedPage>
            <DispatchMonitoringPage />
          </AnimatedPage>
        } />
        <Route path="outbound/dispatch-report" element={
          <AnimatedPage>
            <DispatchReportPage />
          </AnimatedPage>
        } />
        <Route path="outbound/prealert" element={
          <AnimatedPage>
            <PrealertPage />
          </AnimatedPage>
        } />
        <Route path="outbound/bay-allocation" element={
          <AnimatedPage>
            <PlaceholderPage title="Per Bay Allocation" />
          </AnimatedPage>
        } />

        {/* Data Team routes */}
        <Route path="data-team/prealert" element={
          <AnimatedPage>
            <PrealertPage />
          </AnimatedPage>
        } />
        <Route path="data-team/socpacked-update" element={
          <AnimatedPage>
            <PlaceholderPage title="SOCPacked Update" />
          </AnimatedPage>
        } />
        <Route path="data-team/file-upload" element={
          <AnimatedPage>
            <PlaceholderPage title="File Upload" />
          </AnimatedPage>
        } />
        <Route path="data-team/validation/stuckup" element={
          <AnimatedPage>
            <PlaceholderPage title="Stuckup Validation" />
          </AnimatedPage>
        } />
        <Route path="data-team/validation/shortlanded" element={
          <AnimatedPage>
            <PlaceholderPage title="Shortlanded Validation" />
          </AnimatedPage>
        } />

        {/* Admin routes */}
        <Route path="admin/attendance" element={
          <AnimatedPage>
            <PlaceholderPage title="Attendance" />
          </AnimatedPage>
        } />
        <Route path="admin/masterfile" element={
          <AnimatedPage>
            <PlaceholderPage title="Masterfile" />
          </AnimatedPage>
        } />
        <Route path="admin/attendance-history" element={
          <AnimatedPage>
            <PlaceholderPage title="Attendance History" />
          </AnimatedPage>
        } />
        <Route path="admin/breaktime" element={
          <AnimatedPage>
            <PlaceholderPage title="Breaktime Management" />
          </AnimatedPage>
        } />
        <Route path="admin/leave" element={
          <AnimatedPage>
            <PlaceholderPage title="Leave Management" />
          </AnimatedPage>
        } />
        <Route path="admin/workstation" element={
          <AnimatedPage>
            <PlaceholderPage title="Workstation" />
          </AnimatedPage>
        } />

        {/* KPI & Compliance routes */}
        <Route path="kpi/mdt" element={
          <AnimatedPage>
            <PlaceholderPage title="MDT" />
          </AnimatedPage>
        } />
        <Route path="kpi/workstation" element={
          <AnimatedPage>
            <PlaceholderPage title="Workstation" />
          </AnimatedPage>
        } />
        <Route path="kpi/productivity" element={
          <AnimatedPage>
            <PlaceholderPage title="Productivity" />
          </AnimatedPage>
        } />
        <Route path="kpi/intraday" element={
          <AnimatedPage>
            <PlaceholderPage title="Intraday" />
          </AnimatedPage>
        } />

        {/* Midmile routes */}
        <Route path="midmile/truck-request" element={
          <AnimatedPage>
            <PlaceholderPage title="Truck Request" />
          </AnimatedPage>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="outbound-theme">
          <AppRoutes />
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
