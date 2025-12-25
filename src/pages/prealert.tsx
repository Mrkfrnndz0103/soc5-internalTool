import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { dispatchApi } from "@/lib/api"
import { formatDateTime } from "@/lib/utils"
import { Search, Download, CheckCircle } from "lucide-react"

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
  processor_name: string
  lh_trip: string
  plate_number: string
  fleet_size: string
  assigned_ops_id: string
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
    setFilters({ ...filters, [key]: value })
    setPage(1)
  }

  const handleExportCSV = () => {
    // Mock CSV export
    toast({
      title: "Export initiated",
      description: "CSV export will be available for download shortly.",
    })
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Prealert Database</h1>
          <p className="text-muted-foreground">
            Consolidated list of all dispatch reports
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
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
                  <SelectItem value="">All regions</SelectItem>
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
                  <SelectItem value="">All statuses</SelectItem>
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Batch</th>
                      <th className="text-left p-2 font-medium">Cluster</th>
                      <th className="text-left p-2 font-medium">Station</th>
                      <th className="text-left p-2 font-medium">Region</th>
                      <th className="text-left p-2 font-medium">TO Count</th>
                      <th className="text-left p-2 font-medium">OID Loaded</th>
                      <th className="text-left p-2 font-medium">Docked</th>
                      <th className="text-left p-2 font-medium">Departed</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.dispatch_id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{entry.batch_label}</td>
                        <td className="p-2">{entry.cluster_name}</td>
                        <td className="p-2">{entry.station_name}</td>
                        <td className="p-2">
                          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                            {entry.region}
                          </span>
                        </td>
                        <td className="p-2">{entry.count_of_to}</td>
                        <td className="p-2">{entry.total_oid_loaded}</td>
                        <td className="p-2 text-xs">{formatDateTime(entry.actual_docked_time)}</td>
                        <td className="p-2 text-xs">{formatDateTime(entry.actual_depart_time)}</td>
                        <td className="p-2">
                          <span className={`status-badge ${
                            entry.status === "Completed"
                              ? "status-completed"
                              : entry.status === "Ongoing"
                              ? "status-ongoing"
                              : "status-pending"
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="p-2">
                          {entry.verified_flag ? (
                            <span className="inline-flex items-center text-green-600 dark:text-green-400">
                              <CheckCircle className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Pending</span>
                          )}
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
