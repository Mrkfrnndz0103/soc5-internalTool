
"use client"

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { loadDispatchReportCache, saveDispatchReportCache } from "@/lib/dispatch-report-cache"
import { Search, Download, MoreHorizontal, Folder, CheckCircle, Tag, Clock, UserCheck, AlertTriangle } from "lucide-react"

type Status = "Pending" | "Acknowledged" | "Pending_Edit" | "Confirmed"

type EditEntry = {
  id: string
  remarks: string
  reason: string
  editor: string
  timestamp: string
}

type Report = {
  id: string
  status: Status
  reporter: string
  hub: string
  batch: string
  lh_trip?: string
  plate?: string
  date: string
  dataTeam?: string
  dataTeamOpsId?: string
  submittedBy?: string
  submittedByOpsId?: string
  notes?: string
  createdAt: string
  statusUpdatedAt: string
  ackBy?: string
  ackAt?: string
  confirmedBy?: string
  confirmedAt?: string
  pendingEditReason?: string
  editCount?: number
  editHistory?: EditEntry[]
}

const AUTO_ASSIGN_MS = 5 * 60 * 1000

const HUBS = [
  { name: "Angongo Hub", batches: ["Batch 1", "Batch 2"] },
  { name: "Lipa Hub", batches: ["Batch 1"] },
  { name: "Sto Tomas Hub", batches: ["Batch 1", "Batch 2", "Batch 3"] },
]

function formatDateTime(value?: string) {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

function escapeCsv(value?: string) {
  if (!value) return ""
  const text = String(value)
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/\"/g, "\"\"")}"`
  }
  return text
}

function generateSampleReports(count = 50): Report[] {
  const statuses: Status[] = ["Pending", "Acknowledged", "Pending_Edit", "Confirmed"]
  const reporters = ["OpsCoor1", "PIC2", "OpsCoor3", "PIC4", "User5", "User6"]
  const dataTeams = ["Team A", "Team B", "Team C"]
  const hubs = HUBS.map((h) => h.name)

  return Array.from({ length: count }).map((_, i) => {
    const hub = hubs[i % hubs.length]
    const batches = HUBS.find((h) => h.name === hub)!.batches
    const batch = batches[i % batches.length]
    const status = statuses[i % statuses.length]
    const reporter = reporters[i % reporters.length]
    const dataTeam = status === "Pending" ? undefined : dataTeams[i % dataTeams.length]
    const lh_trip = `LH${100 + i}`
    const plate = `PLT-${(100 + i).toString().slice(-3)}`
    const date = `2026-01-${String((i % 28) + 1).padStart(2, "0")}`
    const createdAt = new Date(Date.now() - (i + 1) * 2 * 60 * 1000).toISOString()
    const statusUpdatedAt = createdAt
    const pendingEditReason = status === "Pending_Edit" ? "LH trip mismatch" : undefined
    const editHistory = status === "Pending_Edit" ? [{
      id: `edit-${i}`,
      remarks: "Updated remarks after review.",
      reason: pendingEditReason || "",
      editor: reporter,
      timestamp: createdAt,
    }] : []

    return {
      id: `r${i + 1}`,
      status,
      reporter,
      hub,
      batch,
      lh_trip,
      plate,
      date,
      dataTeam,
      submittedBy: reporter,
      notes: `Sample note for report ${i + 1}`,
      createdAt,
      statusUpdatedAt,
      ackBy: status === "Pending" ? undefined : dataTeam,
      ackAt: status === "Pending" ? undefined : createdAt,
      confirmedBy: status === "Confirmed" ? dataTeam : undefined,
      confirmedAt: status === "Confirmed" ? createdAt : undefined,
      pendingEditReason,
      editCount: editHistory.length,
      editHistory,
    }
  })
}

function loadReports(): Report[] {
  if (typeof window === "undefined") return generateSampleReports(30)
  const cached = loadDispatchReportCache<Report>()
  return cached.length ? cached : generateSampleReports(30)
}

function saveReports(reports: Report[]) {
  saveDispatchReportCache(reports)
}

export function PrealertPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [hubFilter, setHubFilter] = useState<string>("")
  const today = new Date().toISOString().slice(0, 10)
  const [dateFilter, setDateFilter] = useState<string>(today)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [reports, setReports] = useState<Report[]>(() => loadReports())
  const [selectedBatch, setSelectedBatch] = useState<{ hub: string; batch: string } | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [detailReport, setDetailReport] = useState<Report | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [editReason, setEditReason] = useState("")
  const [editRemarks, setEditRemarks] = useState("")

  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const previousStatusRef = useRef<Record<string, Status>>({})

  const { toast } = useToast()
  const { user } = useAuth()
  const pathname = usePathname()
  const isDataTeamView = pathname?.startsWith("/data-team") || user?.role === "Data Team" || user?.role === "Admin"

  useEffect(() => {
    saveReports(reports)
  }, [reports])

  const isReportForUser = useCallback((report: Report) => {
    if (!user) return false
    if (report.submittedByOpsId && user.ops_id) {
      return report.submittedByOpsId === user.ops_id
    }
    return report.submittedBy === user.name || report.reporter === user.name
  }, [user])

  const alarmActive = useMemo(() => {
    if (isDataTeamView) {
      return reports.some((report) => report.status === "Pending")
    }
    return reports.some((report) => report.status === "Pending_Edit" && isReportForUser(report))
  }, [reports, isDataTeamView, isReportForUser])

  useEffect(() => {
    if (!alarmActive) {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current)
        alarmIntervalRef.current = null
      }
      return
    }

    const playBeep = () => {
      if (typeof window === "undefined") return
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }
      const context = audioContextRef.current
      if (context.state === "suspended") {
        context.resume().catch(() => {})
      }
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = "sine"
      oscillator.frequency.value = 880
      gain.gain.value = 0.08
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.2)
    }

    playBeep()
    if (!alarmIntervalRef.current) {
      alarmIntervalRef.current = setInterval(playBeep, 1500)
    }

    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current)
        alarmIntervalRef.current = null
      }
    }
  }, [alarmActive])

  useEffect(() => {
    if (!user || !isDataTeamView) return

    const assign = () => {
      setReports((prev) => {
        let changed = false
        const now = Date.now()
        const next = prev.map((report) => {
          if (report.status !== "Pending" || report.dataTeam) return report
          const pendingSince = new Date(report.statusUpdatedAt || report.createdAt).getTime()
          if (Number.isNaN(pendingSince)) return report
          if (now - pendingSince < AUTO_ASSIGN_MS) return report
          changed = true
          return {
            ...report,
            dataTeam: user.name,
            dataTeamOpsId: user.ops_id,
          }
        })
        return changed ? next : prev
      })
    }

    assign()
    const timer = setInterval(assign, 30000)
    return () => clearInterval(timer)
  }, [user, isDataTeamView])

  useEffect(() => {
    const previous = previousStatusRef.current
    const next: Record<string, Status> = {}
    reports.forEach((report) => {
      next[report.id] = report.status
    })
    if (!isDataTeamView && user) {
      reports.forEach((report) => {
        if (!isReportForUser(report)) return
        const prevStatus = previous[report.id]
        if (prevStatus && prevStatus !== report.status && report.status === "Acknowledged" && report.ackBy) {
          toast({
            title: "Report acknowledged",
            description: `${report.id} acknowledged by ${report.ackBy}`,
          })
        }
      })
    }
    previousStatusRef.current = next
  }, [reports, isDataTeamView, isReportForUser, toast, user])

  const countsByHub = useMemo(() => {
    const map: Record<string, number> = {}
    reports.forEach((report) => (map[report.hub] = (map[report.hub] || 0) + 1))
    return map
  }, [reports])

  const dateFilteredReports = useMemo(() => {
    if (!dateFilter) return reports
    return reports.filter((report) => report.date === dateFilter)
  }, [reports, dateFilter])

  const pendingCount = dateFilteredReports.filter((report) => report.status === "Pending").length
  const acknowledgedCount = dateFilteredReports.filter((report) => report.status === "Acknowledged").length
  const confirmedCount = dateFilteredReports.filter((report) => report.status === "Confirmed").length

  const filtered = useMemo(() => {
    return reports.filter((report) => {
      if (hubFilter && report.hub !== hubFilter) return false
      if (statusFilter !== "all") {
        if (statusFilter === "Pending" && report.status !== "Pending") return false
        if (statusFilter === "Acknowledged" && report.status !== "Acknowledged") return false
        if (statusFilter === "Pending_Edit" && report.status !== "Pending_Edit") return false
        if (statusFilter === "Confirmed" && report.status !== "Confirmed") return false
      }
      if (dateFilter && report.date !== dateFilter) return false
      if (query) {
        const q = query.toLowerCase()
        if (
          !(
            report.reporter.toLowerCase().includes(q) ||
            report.hub.toLowerCase().includes(q) ||
            report.batch.toLowerCase().includes(q) ||
            (report.lh_trip || "").toLowerCase().includes(q) ||
            (report.plate || "").toLowerCase().includes(q)
          )
        )
          return false
      }
      return true
    })
  }, [reports, hubFilter, statusFilter, dateFilter, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "Pending":
        return { label: "Pending", icon: <Clock className="h-4 w-4 text-yellow-600" />, className: "bg-yellow-50 text-yellow-700 border border-yellow-200" }
      case "Acknowledged":
        return { label: "Acknowledged", icon: <UserCheck className="h-4 w-4 text-blue-600" />, className: "bg-blue-50 text-blue-700 border border-blue-200" }
      case "Pending_Edit":
        return { label: "Pending Edit", icon: <AlertTriangle className="h-4 w-4 text-red-600" />, className: "bg-red-50 text-red-700 border border-red-200" }
      case "Confirmed":
        return { label: "Confirmed", icon: <CheckCircle className="h-4 w-4 text-green-600" />, className: "bg-green-50 text-green-700 border border-green-200" }
      default:
        return { label: status, icon: null, className: "bg-muted text-muted-foreground" }
    }
  }

  const isPendingActive = statusFilter === "Pending"
  const isAcknowledgedActive = statusFilter === "Acknowledged"
  const isConfirmedActive = statusFilter === "Confirmed"

  const openBatch = (hub: string, batch: string) => {
    setSelectedBatch({ hub, batch })
    setShowBatchModal(true)
  }

  const closeBatch = () => {
    setSelectedBatch(null)
    setShowBatchModal(false)
  }

  const openDetails = (report: Report) => {
    setDetailReport(report)
    setEditReason(report.pendingEditReason || "")
    setEditRemarks("")
    setShowDetailModal(true)
  }

  const closeDetails = () => {
    setDetailReport(null)
    setShowDetailModal(false)
    setEditReason("")
    setEditRemarks("")
  }

  const updateReport = (id: string, updater: (report: Report) => Report) => {
    setReports((prev) => {
      let changed = false
      const next = prev.map((report) => {
        if (report.id !== id) return report
        const updated = updater(report)
        if (updated !== report) changed = true
        return updated
      })
      return changed ? next : prev
    })
  }

  const handleTakeOwnership = (report: Report) => {
    if (!user) {
      toast({ variant: "destructive", title: "Login required", description: "Please log in first." })
      return
    }
    updateReport(report.id, (current) => {
      if (current.dataTeam) return current
      return { ...current, dataTeam: user.name, dataTeamOpsId: user.ops_id }
    })
    toast({ title: "Ownership assigned", description: `Assigned to ${user.name}` })
  }

  const handleAcknowledge = (report: Report) => {
    if (!user) return
    const now = new Date().toISOString()
    updateReport(report.id, (current) => {
      if (current.status !== "Pending") return current
      return {
        ...current,
        status: "Acknowledged",
        ackBy: user.name,
        ackAt: now,
        dataTeam: current.dataTeam || user.name,
        dataTeamOpsId: current.dataTeamOpsId || user.ops_id,
        statusUpdatedAt: now,
      }
    })
    toast({ title: "Acknowledged", description: `${report.id} acknowledged by ${user.name}` })
  }

  const handlePendingEdit = (report: Report) => {
    if (!user) return
    if (!editReason.trim()) {
      toast({ variant: "destructive", title: "Reason required", description: "Add a reason before sending Pending Edit." })
      return
    }
    const now = new Date().toISOString()
    updateReport(report.id, (current) => ({
      ...current,
      status: "Pending_Edit",
      pendingEditReason: editReason.trim(),
      ackBy: current.ackBy || user.name,
      ackAt: current.ackAt || now,
      dataTeam: current.dataTeam || user.name,
      dataTeamOpsId: current.dataTeamOpsId || user.ops_id,
      statusUpdatedAt: now,
    }))
    toast({ title: "Pending Edit sent", description: `${report.id} returned to Ops PIC.` })
  }

  const handleConfirm = (report: Report) => {
    if (!user) return
    const now = new Date().toISOString()
    const confirmed: Report = {
      ...report,
      status: "Confirmed",
      confirmedBy: user.name,
      confirmedAt: now,
      dataTeam: report.dataTeam || user.name,
      dataTeamOpsId: report.dataTeamOpsId || user.ops_id,
      statusUpdatedAt: now,
    }
    updateReport(report.id, () => confirmed)
    const headers = ["dispatch_id", "lh_trip", "hub", "batch", "plate", "status", "confirmed_by", "confirmed_at"]
    const row = [
      confirmed.id,
      confirmed.lh_trip || "",
      confirmed.hub,
      confirmed.batch,
      confirmed.plate || "",
      confirmed.status,
      confirmed.confirmedBy || "",
      confirmed.confirmedAt || "",
    ]
    const csv = `${headers.join(",")}\n${row.map(escapeCsv).join(",")}`
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `dispatch-${confirmed.id}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    toast({ title: "Confirmed", description: "CSV downloaded. Seatalk and email dispatch queued." })
  }

  const handleResubmit = (report: Report) => {
    if (!user) return
    if (!editRemarks.trim()) {
      toast({ variant: "destructive", title: "Remarks required", description: "Add remarks before resubmitting." })
      return
    }
    const now = new Date().toISOString()
    updateReport(report.id, (current) => {
      const entry: EditEntry = {
        id: `${current.id}-${Date.now()}`,
        remarks: editRemarks.trim(),
        reason: current.pendingEditReason || "",
        editor: user.name,
        timestamp: now,
      }
      const history = current.editHistory ? [...current.editHistory, entry] : [entry]
      return {
        ...current,
        status: "Pending",
        pendingEditReason: undefined,
        editCount: (current.editCount || 0) + 1,
        editHistory: history,
        notes: editRemarks.trim(),
        statusUpdatedAt: now,
      }
    })
    toast({ title: "Resubmitted", description: `${report.id} returned to Data Team queue.` })
    setEditRemarks("")
  }

  const handleExport = () => {
    toast({ title: "Export", description: "CSV export is not yet configured." })
  }

  return (
    <div className="flex gap-6">
      <aside className="w-72">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">Hubs</CardTitle>
            <CardDescription className="text-sm">Compact list</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 relative max-h-[60vh] overflow-y-auto pr-2">
              {HUBS.map((hub) => (
                <li key={hub.name} className="relative">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      aria-expanded={!!hubFilter && hubFilter === hub.name}
                      aria-controls={`batches-${hub.name}`}
                      onClick={() => {
                        const sel = hubFilter === hub.name ? "" : hub.name
                        setHubFilter(sel)
                        setExpanded((s) => ({ ...s, [hub.name]: !s[hub.name] }))
                        setPage(1)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          const sel = hubFilter === hub.name ? "" : hub.name
                          setHubFilter(sel)
                          setExpanded((s) => ({ ...s, [hub.name]: !s[hub.name] }))
                          setPage(1)
                        }
                      }}
                      className={`flex items-center gap-3 px-3 py-3 rounded w-full text-left ${hubFilter === hub.name ? "bg-muted/20" : "hover:bg-muted/10"}`}
                    >
                      <Folder className="h-5 w-5 text-gradient" />
                      <div>
                        <div className="text-sm font-medium">{hub.name}</div>
                        <div className="text-xs text-muted-foreground">{countsByHub[hub.name] || 0} reports</div>
                      </div>
                    </button>
                  </div>

                  <div className="absolute left-6 top-12 bottom-0 w-px bg-muted/20 ml-1" aria-hidden />

                  <ul id={`batches-${hub.name}`} className={`ml-9 mt-2 text-base text-muted-foreground space-y-2 ${expanded[hub.name] ? "block" : "hidden"}`}>
                    {hub.batches.map((batch) => (
                      <li key={batch}>
                        <button
                          className="flex items-center gap-2 py-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                          onClick={() => openBatch(hub.name, batch)}
                          onKeyDown={(event) => { if (event.key === "Enter") openBatch(hub.name, batch) }}
                        >
                          <Tag className="h-4 w-4 text-blue-500 mr-1" aria-hidden />
                          <span>{batch}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </aside>

      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div
              role="button"
              tabIndex={0}
              aria-label="Pending reports"
              aria-pressed={isPendingActive}
              onClick={() => { setStatusFilter(isPendingActive ? "all" : "Pending"); setPage(1) }}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setStatusFilter(isPendingActive ? "all" : "Pending"); setPage(1) } }}
              className={`cursor-pointer bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 transform transition-all duration-150 border-r border-muted/20 pr-6 ${isPendingActive ? "ring-2 ring-yellow-300 scale-105" : "hover:scale-105"}`}
            >
              <div className={`${isPendingActive ? "inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-600 text-white" : "inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-50 text-yellow-700"}`}>
                <Clock className="h-8 w-8" aria-hidden />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-3xl font-extrabold">{pendingCount}</div>
                <div className="text-xs text-muted-foreground mt-1">{dateFilter}</div>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Acknowledged reports"
              aria-pressed={isAcknowledgedActive}
              onClick={() => { setStatusFilter(isAcknowledgedActive ? "all" : "Acknowledged"); setPage(1) }}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setStatusFilter(isAcknowledgedActive ? "all" : "Acknowledged"); setPage(1) } }}
              className={`cursor-pointer bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 transform transition-all duration-150 border-r border-muted/20 pr-6 ${isAcknowledgedActive ? "ring-2 ring-blue-300 scale-105" : "hover:scale-105"}`}
            >
              <div className={`${isAcknowledgedActive ? "inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white" : "inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 text-blue-700"}`}>
                <UserCheck className="h-8 w-8" aria-hidden />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Acknowledged</div>
                <div className="text-3xl font-extrabold">{acknowledgedCount}</div>
                <div className="text-xs text-muted-foreground mt-1">{dateFilter}</div>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Confirmed reports"
              aria-pressed={isConfirmedActive}
              onClick={() => { setStatusFilter(isConfirmedActive ? "all" : "Confirmed"); setPage(1) }}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setStatusFilter(isConfirmedActive ? "all" : "Confirmed"); setPage(1) } }}
              className={`cursor-pointer bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 transform transition-all duration-150 ${isConfirmedActive ? "ring-2 ring-green-300 scale-105" : "hover:scale-105"}`}
            >
              <div className={`${isConfirmedActive ? "inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-600 text-white" : "inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-50 text-green-700"}`}>
                <CheckCircle className="h-8 w-8" aria-hidden />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Confirmed</div>
                <div className="text-3xl font-extrabold">{confirmedCount}</div>
                <div className="text-xs text-muted-foreground mt-1">{dateFilter}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="my-6" aria-hidden>
          <div className="h-0.5 w-full rounded shadow-sm bg-gradient-to-r from-sky-400 to-indigo-600" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search reporter, hub, LHTrip, plate..."
                className="pl-11 w-96 text-base"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1) }}
                aria-label="Search reports"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="Pending_Edit">Pending Edit</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>

              <Input type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1) }} aria-label="Date" />

              <Button variant="outline" onClick={() => { setQuery(""); setHubFilter(""); setStatusFilter("all"); setDateFilter(""); setPage(1) }}>Reset</Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm">Rows</label>
              <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Dispatch Entries</CardTitle>
            <CardDescription className="text-sm">Showing {filtered.length} entries, page {page} / {totalPages}</CardDescription>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground text-base">No entries found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-base border-collapse border border-muted/20">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-center border-r border-muted/20 last:border-r-0">Status</th>
                      <th className="p-3 text-center border-r border-muted/20 last:border-r-0">Reporter</th>
                      <th className="p-3 text-center border-r border-muted/20 last:border-r-0">Hub</th>
                      <th className="p-3 text-center border-r border-muted/20 last:border-r-0">Batch</th>
                      <th className="p-3 text-center border-r border-muted/20 last:border-r-0">LHTrip</th>
                      <th className="p-3 text-center border-r border-muted/20 last:border-r-0">Plate</th>
                      <th className="p-3 text-center border-r border-muted/20 last:border-r-0">Date</th>
                      <th className="p-3 text-center border-r border-muted/20 last:border-r-0">Owner</th>
                      <th className="p-3 text-center last:border-r-0">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((report) => {
                      const badge = getStatusBadge(report.status)
                      const shouldBlink = isDataTeamView
                        ? report.status === "Pending"
                        : report.status === "Pending_Edit" && isReportForUser(report)

                      return (
                        <tr
                          key={report.id}
                          className={`border-b hover:shadow-md hover:-translate-y-0.5 transition-all group ${shouldBlink ? "blink-red ring-1 ring-red-300" : ""}`}
                          tabIndex={0}
                          onKeyDown={(event) => { if (event.key === "Enter") openDetails(report) }}
                          aria-label={`Report ${report.id} by ${report.reporter}`}
                        >
                          <td className="p-3 align-middle text-center border-r border-muted/20 last:border-r-0">
                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${badge.className}`}>
                              {badge.icon}
                              <span className="whitespace-nowrap">{badge.label}</span>
                            </span>
                          </td>

                          <td className="p-3 align-middle text-base border-r border-muted/20 last:border-r-0">{report.reporter}</td>
                          <td className="p-3 align-middle text-base border-r border-muted/20 last:border-r-0">{report.hub}</td>
                          <td className="p-3 align-middle text-base border-r border-muted/20 last:border-r-0">{report.batch}</td>
                          <td className="p-3 align-middle font-mono border-r border-muted/20 last:border-r-0">{report.lh_trip}</td>
                          <td className="p-3 align-middle font-mono border-r border-muted/20 last:border-r-0">{report.plate}</td>
                          <td className="p-3 align-middle border-r border-muted/20 last:border-r-0">{report.date}</td>
                          <td className="p-3 align-middle border-r border-muted/20 last:border-r-0">{report.dataTeam || "-"}</td>
                          <td className="p-3 align-middle">
                            <Button size="sm" variant="ghost" aria-label={`Open details for ${report.id}`} onClick={() => openDetails(report)}>
                              <MoreHorizontal />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">Showing {pageItems.length} of {filtered.length} entries</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
                    <div className="text-sm">Page {page} / {totalPages}</div>
                    <Button size="sm" variant="outline" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {showBatchModal && selectedBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-3xl bg-background rounded shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedBatch.hub} - {selectedBatch.batch}</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={closeBatch}>Close</Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">Reports in this batch</div>
                <div className="overflow-y-auto max-h-72">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Reporter</th>
                        <th className="p-2 text-left">Hub</th>
                        <th className="p-2 text-left">Batch</th>
                        <th className="p-2 text-left">LHTrip</th>
                        <th className="p-2 text-left">Plate</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Owner</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.filter(report => report.hub === selectedBatch.hub && report.batch === selectedBatch.batch).map(report => (
                        <tr key={report.id} className="border-b hover:bg-muted/10">
                          <td className="p-2">{report.reporter}</td>
                          <td className="p-2">{report.hub}</td>
                          <td className="p-2">{report.batch}</td>
                          <td className="p-2">{report.lh_trip}</td>
                          <td className="p-2">{report.plate}</td>
                          <td className="p-2">{report.date}</td>
                          <td className="p-2">{report.dataTeam || "-"}</td>
                          <td className="p-2">{report.status}</td>
                          <td className="p-2"><Button size="sm" variant="outline" onClick={() => openDetails(report)}>Details</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDetailModal && detailReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-2xl bg-background rounded shadow p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">Report Details</h3>
                  <div className="text-sm text-muted-foreground">ID: {detailReport.id} - {detailReport.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={closeDetails}>Close</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-base">
                <div>
                  <div className="text-sm text-muted-foreground">Reporter</div>
                  <div className="font-medium">{detailReport.reporter}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Hub</div>
                  <div className="font-medium">{detailReport.hub}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Batch</div>
                  <div className="font-medium">{detailReport.batch}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Owner</div>
                  <div className="font-medium">{detailReport.dataTeam || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">LH Trip</div>
                  <div className="font-mono">{detailReport.lh_trip}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Plate</div>
                  <div className="font-mono">{detailReport.plate}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium">{detailReport.status}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Acknowledged</div>
                  <div className="font-medium">{detailReport.ackBy ? `${detailReport.ackBy} (${formatDateTime(detailReport.ackAt)})` : "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Confirmed</div>
                  <div className="font-medium">{detailReport.confirmedBy ? `${detailReport.confirmedBy} (${formatDateTime(detailReport.confirmedAt)})` : "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="font-medium">{detailReport.notes || "-"}</div>
                </div>
              </div>

              {detailReport.pendingEditReason && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Pending Edit Reason: {detailReport.pendingEditReason}
                </div>
              )}

              {detailReport.editHistory && detailReport.editHistory.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">Edit History</div>
                  <div className="space-y-2">
                    {detailReport.editHistory.map((entry) => (
                      <div key={entry.id} className="rounded border border-muted/30 p-3 text-sm">
                        <div className="font-medium">{entry.editor} - {formatDateTime(entry.timestamp)}</div>
                        <div className="text-muted-foreground">Reason: {entry.reason || "-"}</div>
                        <div>Remarks: {entry.remarks}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isDataTeamView && (
                <div className="mt-6 space-y-4">
                  {!detailReport.dataTeam && (
                    <Button variant="outline" onClick={() => handleTakeOwnership(detailReport)}>Take Ownership</Button>
                  )}

                  {detailReport.status === "Pending" && (
                    <Button onClick={() => handleAcknowledge(detailReport)}>Acknowledge</Button>
                  )}

                  {(detailReport.status === "Pending" || detailReport.status === "Acknowledged") && (
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Pending Edit Reason</label>
                      <textarea
                        value={editReason}
                        onChange={(event) => setEditReason(event.target.value)}
                        className="w-full min-h-[90px] rounded border border-muted/30 p-2 text-sm"
                        placeholder="Describe the discrepancy..."
                      />
                      <Button variant="destructive" onClick={() => handlePendingEdit(detailReport)}>Send Pending Edit</Button>
                    </div>
                  )}

                  {detailReport.status === "Acknowledged" && (
                    <Button onClick={() => handleConfirm(detailReport)}>Confirm and Download CSV</Button>
                  )}
                </div>
              )}

              {!isDataTeamView && detailReport.status === "Pending_Edit" && isReportForUser(detailReport) && (
                <div className="mt-6 space-y-2">
                  <label className="text-sm text-muted-foreground">Updated Remarks</label>
                  <textarea
                    value={editRemarks}
                    onChange={(event) => setEditRemarks(event.target.value)}
                    className="w-full min-h-[90px] rounded border border-muted/30 p-2 text-sm"
                    placeholder="Update remarks and resubmit..."
                  />
                  <Button onClick={() => handleResubmit(detailReport)}>Resubmit Report</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
