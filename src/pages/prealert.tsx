import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Search, Download, MoreHorizontal, Folder, CheckCircle, XCircle, Tag, Clock, Monitor } from "lucide-react"

type Status = "Pending" | "Pending-Inaccurate" | "Ongoing" | "Done"

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
  submittedBy?: string
  notes?: string
}

const HUBS = [
  { name: "Angongo Hub", batches: ["Batch 1", "Batch 2"] },
  { name: "Lipa Hub", batches: ["Batch 1"] },
  { name: "Sto Tomas Hub", batches: ["Batch 1", "Batch 2", "Batch 3"] },
]

function generateSampleReports(count = 50): Report[] {
  const statuses: Status[] = ["Pending", "Pending-Inaccurate", "Ongoing", "Done"]
  const reporters = ["OpsCoor1", "PIC2", "OpsCoor3", "PIC4", "User5", "User6"]
  const dataTeams = ["Team A", "Team B", "Team C"]
  const hubs = HUBS.map((h) => h.name)

  return Array.from({ length: count }).map((_, i) => {
    const hub = hubs[i % hubs.length]
    const batches = HUBS.find((h) => h.name === hub)!.batches
    const batch = batches[i % batches.length]
    const status = statuses[i % statuses.length]
    const reporter = reporters[i % reporters.length]
    const dataTeam = dataTeams[i % dataTeams.length]
    const lh_trip = `LH${100 + i}`
    const plate = `PLT-${(100 + i).toString().slice(-3)}`
    const date = `2026-01-${String((i % 28) + 1).padStart(2, "0")}`

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
    }
  })
}

export function PrealertPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [hubFilter, setHubFilter] = useState<string>("")
  const today = new Date().toISOString().slice(0, 10)
  const [dateFilter, setDateFilter] = useState<string>(today)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [reports, setReports] = useState<Report[]>(() => generateSampleReports(50))
  const [selectedBatch, setSelectedBatch] = useState<{ hub: string; batch: string } | null>(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [detailReport, setDetailReport] = useState<Report | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const { toast } = useToast()

  const countsByHub = useMemo(() => {
    const map: Record<string, number> = {}
    reports.forEach((r) => (map[r.hub] = (map[r.hub] || 0) + 1))
    return map
  }, [reports])

  // Reports filtered by the selected date only (used by the scorecards)
  const dateFilteredReports = useMemo(() => {
    if (!dateFilter) return reports
    return reports.filter((r) => r.date === dateFilter)
  }, [reports, dateFilter])

  const pendingCount = dateFilteredReports.filter((r) => r.status === "Pending" || r.status === "Pending-Inaccurate").length
  const ongoingCount = dateFilteredReports.filter((r) => r.status === "Ongoing").length
  const doneCount = dateFilteredReports.filter((r) => r.status === "Done").length

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (hubFilter && r.hub !== hubFilter) return false
      if (statusFilter !== "all") {
        if (statusFilter === "Pending") {
          if (!(r.status === "Pending" || r.status === "Pending-Inaccurate")) return false
        } else {
          if (statusFilter === "Pending-Green" && r.status !== "Pending") return false
          if (statusFilter === "Pending-Red" && r.status !== "Pending-Inaccurate") return false
          if (statusFilter === "Ongoing" && r.status !== "Ongoing") return false
          if (statusFilter === "Done" && r.status !== "Done") return false
        }
      }
      if (dateFilter && r.date !== dateFilter) return false
      if (query) {
        const q = query.toLowerCase()
        if (
          !(
            r.reporter.toLowerCase().includes(q) ||
            r.hub.toLowerCase().includes(q) ||
            r.batch.toLowerCase().includes(q) ||
            (r.lh_trip || "").toLowerCase().includes(q) ||
            (r.plate || "").toLowerCase().includes(q)
          )
        )
          return false
      }
      return true
    })
  }, [reports, hubFilter, statusFilter, dateFilter, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  const setStatusForReport = (id: string, newStatus: Status) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)))
    toast({ title: "Status updated", description: `Report ${id} set to ${newStatus}` })
  }

  const toggleStatusFilter = (key: 'Pending' | 'Ongoing' | 'Done') => {
    if (key === 'Pending') {
      if (statusFilter === 'Pending') setStatusFilter('all')
      else setStatusFilter('Pending')
    } else {
      if (statusFilter === key) setStatusFilter('all')
      else setStatusFilter(key)
    }
    setPage(1)
  }

  const isPendingActive = statusFilter === 'Pending' || statusFilter === 'Pending-Green' || statusFilter === 'Pending-Red'
  const isOngoingActive = statusFilter === 'Ongoing'
  const isDoneActive = statusFilter === 'Done'

  const openBatch = (hub: string, batch: string) => {
    setSelectedBatch({ hub, batch })
    setShowBatchModal(true)
  }

  const closeBatch = () => {
    setSelectedBatch(null)
    setShowBatchModal(false)
  }

  const openDetails = (r: Report) => {
    setDetailReport(r)
    setShowDetailModal(true)
  }

  const closeDetails = () => {
    setDetailReport(null)
    setShowDetailModal(false)
  }

  const handleExport = () => {
    toast({ title: "Export", description: "CSV export is not yet configured." })
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-72">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">Hubs</CardTitle>
            <CardDescription className="text-sm">Compact list</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 relative max-h-[60vh] overflow-y-auto pr-2">
              {HUBS.map((h) => (
                <li key={h.name} className="relative">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      aria-expanded={!!hubFilter && hubFilter === h.name}
                      aria-controls={`batches-${h.name}`}
                      onClick={() => { const sel = hubFilter === h.name ? "" : h.name; setHubFilter(sel); setExpanded((s) => ({ ...s, [h.name]: !s[h.name] })); setPage(1); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const sel = hubFilter === h.name ? "" : h.name; setHubFilter(sel); setExpanded((s) => ({ ...s, [h.name]: !s[h.name] })); setPage(1); } }}
                      className={`flex items-center gap-3 px-3 py-3 rounded w-full text-left ${hubFilter === h.name ? "bg-muted/20" : "hover:bg-muted/10"}`}
                    >
                      <Folder className="h-5 w-5 text-gradient" />
                      <div>
                        <div className="text-sm font-medium">{h.name}</div>
                        <div className="text-xs text-muted-foreground">{countsByHub[h.name] || 0} reports</div>
                      </div>
                    </button>
                  </div>

                  {/* connector line */}
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-muted/20 ml-1" aria-hidden />

                  <ul id={`batches-${h.name}`} className={`ml-9 mt-2 text-base text-muted-foreground space-y-2 ${expanded[h.name] ? 'block' : 'hidden'}`}>
                    {h.batches.map((b) => (
                      <li key={b}>
                        <button
                          className="flex items-center gap-2 py-2 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                          onClick={() => openBatch(h.name, b)}
                          onKeyDown={(e) => { if (e.key === 'Enter') openBatch(h.name, b) }}
                        >
                          <Tag className="h-4 w-4 text-blue-500 mr-1" aria-hidden />
                          <span>{b}</span>
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

      {/* Main content */}
      <div className="flex-1 space-y-4">
          {/* Scorecards - status overview (date-aware, clickable) */}
        <div className="flex items-center justify-between">
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div
              role="button"
              tabIndex={0}
              aria-label="Pending reports"
              aria-pressed={isPendingActive}
              onClick={() => toggleStatusFilter('Pending')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStatusFilter('Pending') } }}
              className={`cursor-pointer bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 transform transition-all duration-150 border-r border-muted/20 pr-6 ${isPendingActive ? 'ring-2 ring-yellow-300 scale-105' : 'hover:scale-105'}`}
            >
              <div className={`${isPendingActive ? 'inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-600 text-white' : 'inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-50 text-yellow-700'}`}>
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
              aria-label="Ongoing reports"
              aria-pressed={isOngoingActive}
              onClick={() => toggleStatusFilter('Ongoing')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStatusFilter('Ongoing') } }}
              className={`cursor-pointer bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 transform transition-all duration-150 border-r border-muted/20 pr-6 ${isOngoingActive ? 'ring-2 ring-blue-300 scale-105' : 'hover:scale-105'}`}
            >
              <div className={`${isOngoingActive ? 'inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white' : 'inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 text-blue-700'}`}>
                <Monitor className="h-8 w-8" aria-hidden />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Ongoing</div>
                <div className="text-3xl font-extrabold">{ongoingCount}</div>
                <div className="text-xs text-muted-foreground mt-1">{dateFilter}</div>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Done reports"
              aria-pressed={isDoneActive}
              onClick={() => toggleStatusFilter('Done')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStatusFilter('Done') } }}
              className={`cursor-pointer bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 transform transition-all duration-150 ${isDoneActive ? 'ring-2 ring-green-300 scale-105' : 'hover:scale-105'}`}
            >
              <div className={`${isDoneActive ? 'inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-600 text-white' : 'inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-50 text-green-700'}`}>
                <CheckCircle className="h-8 w-8" aria-hidden />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Done</div>
                <div className="text-3xl font-extrabold">{doneCount}</div>
                <div className="text-xs text-muted-foreground mt-1">{dateFilter}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="my-6" aria-hidden>
          <div className="h-0.5 bg-muted/60 w-full rounded shadow-sm" />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search reporter, hub, LHTrip, plate..."
                className="pl-11 w-96 text-base"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                aria-label="Search reports"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Pending">Pending (All)</SelectItem>
                  <SelectItem value="Pending-Green">Pending (New)</SelectItem>
                  <SelectItem value="Pending-Red">Pending (Inaccurate)</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>

              <Input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1) }} aria-label="Date" />

              <Button variant="outline" onClick={() => { setQuery(""); setHubFilter(""); setStatusFilter("all"); setDateFilter(""); setPage(1) }}>Reset</Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm">Rows</label>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
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
            <CardDescription className="text-sm">Showing {filtered.length} entries — page {page} / {totalPages}</CardDescription>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground text-base">No entries found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-base border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Reporter</th>
                      <th className="p-3 text-center">Hub</th>
                      <th className="p-3 text-center">Batch #</th>
                      <th className="p-3 text-center">LHTrip #</th>
                      <th className="p-3 text-center">Plate #</th>
                      <th className="p-3 text-center">Date</th>
                      <th className="p-3 text-center">Data Team</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((r) => (
                      <tr key={r.id} className="border-b hover:shadow-md hover:-translate-y-0.5 transition-all group" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') openDetails(r) }} aria-label={`Report ${r.id} by ${r.reporter}`}>
                        <td className="p-3 align-middle text-center">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                            r.status === "Pending" ? "bg-green-50 text-green-700 border border-green-200" :
                            r.status === "Pending-Inaccurate" ? "bg-red-50 text-red-700 border border-red-200" :
                            r.status === "Ongoing" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                            "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {r.status === "Pending" && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {r.status === "Pending-Inaccurate" && <XCircle className="h-4 w-4 text-red-600" />}
                            <span className="whitespace-nowrap">{r.status === "Pending-Inaccurate" ? "Pending (Inaccurate)" : r.status}</span>
                          </span>
                        </td>

                        <td className="p-3 align-middle text-base">{r.reporter}</td>
                        <td className="p-3 align-middle text-base">{r.hub}</td>
                        <td className="p-3 align-middle text-base">{r.batch}</td>
                        <td className="p-3 align-middle font-mono">{r.lh_trip}</td>
                        <td className="p-3 align-middle font-mono">{r.plate}</td>
                        <td className="p-3 align-middle">{r.date}</td>
                        <td className="p-3 align-middle">{r.dataTeam}</td>
                        <td className="p-3 align-middle">
                          <Button size="sm" variant="ghost" aria-label={`Open details for ${r.id}`} onClick={() => openDetails(r)} onKeyDown={(e) => { if (e.key === 'Enter') openDetails(r) }}>
                            <MoreHorizontal />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination controls */}
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

        {/* Batch modal */}
        {showBatchModal && selectedBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-3xl bg-background rounded shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedBatch.hub} — {selectedBatch.batch}</h3>
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
                        <th className="p-2 text-left">Data Team</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.filter(r => r.hub === selectedBatch.hub && r.batch === selectedBatch.batch).map(r => (
                        <tr key={r.id} className="border-b hover:bg-muted/10">
                          <td className="p-2">{r.reporter}</td>
                          <td className="p-2">{r.hub}</td>
                          <td className="p-2">{r.batch}</td>
                          <td className="p-2">{r.lh_trip}</td>
                          <td className="p-2">{r.plate}</td>
                          <td className="p-2">{r.date}</td>
                          <td className="p-2">{r.dataTeam}</td>
                          <td className="p-2">{r.status}</td>
                          <td className="p-2"><Button size="sm" variant="outline" onClick={() => openDetails(r)}>Details</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail modal */}
        {showDetailModal && detailReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-2xl bg-background rounded shadow p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">Report Details</h3>
                  <div className="text-sm text-muted-foreground">ID: {detailReport.id} • {detailReport.date}</div>
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
                  <div className="text-sm text-muted-foreground">Data Team</div>
                  <div className="font-medium">{detailReport.dataTeam}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">LH Trip</div>
                  <div className="font-mono">{detailReport.lh_trip}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Plate</div>
                  <div className="font-mono">{detailReport.plate}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">Notes</div>
                  <div className="font-medium">{detailReport.notes}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <Button variant="destructive" onClick={() => { setStatusForReport(detailReport.id, "Pending-Inaccurate"); closeDetails() }}>Mark Inaccurate</Button>
                <Button onClick={() => { setStatusForReport(detailReport.id, "Done"); closeDetails() }}>Mark Complete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

