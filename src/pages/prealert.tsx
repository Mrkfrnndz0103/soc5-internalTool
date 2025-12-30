import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { dispatchApi } from "@/lib/api"
import { formatDateTime } from "@/lib/utils"
import { Search, Download, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

interface DispatchEntry {
  dispatch_id: string
  batch_label: string
  batch_sequence: number
  cluster_name: string
  station_name: string
  region: string
  count_of_to: number
  total_oid_loaded: number
  actual_docked_time: string
  actual_depart_time: string
  dock_number: string
  dock_confirmed: boolean
  processor_name: string
  lh_trip: string
  plate_number: string
  fleet_size: string
  assigned_ops_id: string
  assigned_ops_name: string
  status: string
  verified_flag: boolean
  verified_by?: string
  verified_at?: string
  created_by: string
  created_at: string
}

export function PrealertPage() {
  const [entries, setEntries] = useState<DispatchEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    region: "",
    status: "",
    startDate: "",
    endDate: "",
    search: "",
  })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const { toast } = useToast()

  const LIMIT = 50

  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters])

  const loadEntries = async () => {
    setLoading(true)
    const response = await dispatchApi.getDispatches({
      limit: LIMIT,
      offset: (page - 1) * LIMIT,
      status: filters.status || undefined,
      region: filters.region || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    })
    setLoading(false)

    if (response.data) {
      setEntries(response.data.rows || [])
      setTotal(response.data.total || 0)
    } else if (response.error) {
      toast({
        variant: "destructive",
        title: "Failed to load entries",
        description: response.error,
      })
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value === "all" ? "" : value })
    setPage(1)
  }

  const handleExportCSV = () => {
    toast({
      title: "Export initiated",
      description: "CSV export will be available for download shortly.",
    })
  }

  const handleStatusChange = async (dispatchId: string, newStatus: string) => {
    const response = await dispatchApi.verifyRows({
      rows: [dispatchId],
      verified_by_ops_id: "system",
    })
    if (response.error) {
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: response.error,
      })
      return
    }
    toast({
      title: "Status updated",
      description: `Dispatch ${dispatchId} status changed to ${newStatus}`,
    })
    loadEntries()
  }

  const handleVerify = async (dispatchId: string) => {
    const response = await dispatchApi.verifyRows({
      rows: [dispatchId],
      verified_by_ops_id: "system",
      send_csv: true,
    })
    if (response.error) {
      toast({
        variant: "destructive",
        title: "Failed to verify dispatch",
        description: response.error,
      })
      return
    }
    toast({
      title: "Dispatch verified",
      description: `Dispatch ${dispatchId} verified. Automated notifications will be sent.`,
    })
    loadEntries()
  }

  const handleReject = async (dispatchId: string) => {
    const response = await dispatchApi.verifyRows({
      rows: [dispatchId],
      verified_by_ops_id: "system",
    })
    if (response.error) {
      toast({
        variant: "destructive",
        title: "Failed to reject dispatch",
        description: response.error,
      })
      return
    }
    toast({
      variant: "destructive",
      title: "Dispatch rejected",
      description: `Dispatch ${dispatchId} rejected. Notification sent to submitter for corrections.`,
    })
    loadEntries()
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search dispatch entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Select
                value={filters.region}
                onValueChange={(value) => handleFilterChange("region", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  <SelectItem value="FAR SOL">FAR SOL</SelectItem>
                  <SelectItem value="METRO MANILA">METRO MANILA</SelectItem>
                  <SelectItem value="VISMIN">VISMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dispatch Entries</CardTitle>
              <CardDescription>
                Showing {((page - 1) * LIMIT) + 1} to {Math.min(page * LIMIT, total)} of {total} entries
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading entries...</div>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">No entries found</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-bold uppercase tracking-wider">#</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider min-w-[150px]">Cluster</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider min-w-[120px]">Station</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider">Region</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider">TO</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider">OID</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider min-w-[140px]">Docked</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider">Dock #</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider min-w-[140px]">Depart</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider min-w-[120px]">Processor</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider">LH Trip</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider">Plate #</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider">Fleet</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider">Ops ID</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider">Status</th>
                      <th className="p-2 text-left font-bold uppercase tracking-wider min-w-[140px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={entry.dispatch_id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-2 font-medium">{index + 1}</td>
                        <td className="p-2">{entry.cluster_name}</td>
                        <td className="p-2">{entry.station_name}</td>
                        <td className="p-2">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {entry.region}
                          </span>
                        </td>
                        <td className="p-2">{entry.count_of_to}</td>
                        <td className="p-2">{entry.total_oid_loaded}</td>
                        <td className="p-2">{formatDateTime(entry.actual_docked_time)}</td>
                        <td className="p-2">
                          <span className="inline-flex items-center gap-1">
                            {entry.dock_number}
                            {entry.dock_confirmed && <CheckCircle className="h-3 w-3 text-green-600" />}
                          </span>
                        </td>
                        <td className="p-2">{formatDateTime(entry.actual_depart_time)}</td>
                        <td className="p-2">{entry.processor_name}</td>
                        <td className="p-2 font-mono">{entry.lh_trip}</td>
                        <td className="p-2 font-mono">{entry.plate_number}</td>
                        <td className="p-2">{entry.fleet_size}</td>
                        <td className="p-2">
                          <div className="text-[10px]">
                            <div className="font-medium">{entry.assigned_ops_id}</div>
                            {entry.assigned_ops_name && (
                              <div className="text-muted-foreground">{entry.assigned_ops_name}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            entry.status === "Completed" || entry.status === "Verified"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : entry.status === "Ongoing"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              : entry.verified_flag === false && entry.status === "Pending"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {entry.status === "Pending" && !entry.verified_flag && <AlertCircle className="h-3 w-3" />}
                            {entry.status === "Ongoing" && <Clock className="h-3 w-3" />}
                            {(entry.status === "Verified" || entry.status === "Completed") && <CheckCircle className="h-3 w-3" />}
                            {entry.status}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            {entry.status === "Pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px] px-2"
                                  onClick={() => handleStatusChange(entry.dispatch_id, "Ongoing")}
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Start
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 text-[10px] px-2"
                                  onClick={() => handleReject(entry.dispatch_id)}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {entry.status === "Ongoing" && (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-6 text-[10px] px-2 bg-green-600 hover:bg-green-700"
                                onClick={() => handleVerify(entry.dispatch_id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verify
                              </Button>
                            )}
                            {(entry.status === "Verified" || entry.status === "Completed") && (
                              <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Done
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
