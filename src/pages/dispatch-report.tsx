import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { dispatchApi, lookupApi } from "@/lib/api"
import { Plus, Trash2, Save, Send, Loader2, Eye, EyeOff } from "lucide-react"

interface DispatchRow {
  id: string
  batch_sequence?: number
  cluster_name: string
  station_name: string
  region: string
  count_of_to: number
  total_oid_loaded: number
  actual_docked_time: string
  dock_number: string
  dock_confirmed: boolean
  actual_depart_time: string
  processor_name: string
  lh_trip: string
  plate_number: string
  fleet_size: string
  assigned_ops_id: string
  assigned_ops_name: string
}

const emptyRow = (): DispatchRow => ({
  id: crypto.randomUUID(),
  cluster_name: "",
  station_name: "",
  region: "",
  count_of_to: 0,
  total_oid_loaded: 0,
  actual_docked_time: "",
  dock_number: "",
  dock_confirmed: false,
  actual_depart_time: "",
  processor_name: "",
  lh_trip: "",
  plate_number: "",
  fleet_size: "4WH",
  assigned_ops_id: "",
  assigned_ops_name: "",
})

const FLEET_SIZES = ["4WH", "6W", "6WF", "10WH", "CV"]
const MAX_ROWS = 10
const AUTOSAVE_INTERVAL = 10000

export function DispatchReportPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rows, setRows] = useState<DispatchRow[]>([emptyRow()])
  const [loading, setLoading] = useState(false)
  const [clusterSuggestions, setClusterSuggestions] = useState<any[]>([])
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const [showLHTrip, setShowLHTrip] = useState(true)
  const [showPlate, setShowPlate] = useState(true)
  const [showFleet, setShowFleet] = useState(true)

  const getDraftKey = () => {
    const sessionId = sessionStorage.getItem("session_id") || crypto.randomUUID()
    sessionStorage.setItem("session_id", sessionId)
    return `drafts:${user?.ops_id}:submit_report:${sessionId}`
  }

  useEffect(() => {
    const draftKey = getDraftKey()
    const savedDraft = localStorage.getItem(draftKey)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        if (draft.rows && Array.isArray(draft.rows)) {
          setRows(draft.rows)
          toast({
            title: "Draft loaded",
            description: `Loaded draft from ${new Date(draft.last_saved_at).toLocaleString()}`,
          })
        }
      } catch (error) {
        console.error("Failed to load draft:", error)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft()
    }, AUTOSAVE_INTERVAL)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const saveDraft = useCallback(() => {
    const draftKey = getDraftKey()
    const draft = {
      rows,
      last_saved_at: new Date().toISOString(),
    }
    localStorage.setItem(draftKey, JSON.stringify(draft))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const addRow = () => {
    if (rows.length >= MAX_ROWS) {
      toast({
        variant: "destructive",
        title: "Maximum rows reached",
        description: `You can only add up to ${MAX_ROWS} rows per session.`,
      })
      return
    }
    setRows([...rows, emptyRow()])
  }

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      toast({
        variant: "destructive",
        title: "Cannot remove last row",
        description: "At least one row must be present.",
      })
      return
    }
    setRows(rows.filter((row) => row.id !== id))
  }

  const updateRow = (id: string, field: keyof DispatchRow, value: any) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id !== id) return row
        const updatedRow = { ...row, [field]: value }
        if (field === "lh_trip" && typeof value === "string") {
          if (value && !value.startsWith("LT")) {
            updatedRow.lh_trip = "LT" + value.replace(/^LT/i, "").toUpperCase()
          } else {
            updatedRow.lh_trip = value.toUpperCase()
          }
        }
        if (field === "plate_number" && typeof value === "string") {
          updatedRow.plate_number = value.toUpperCase()
        }
        if (field === "assigned_ops_id" && typeof value === "string") {
          updatedRow.assigned_ops_id = value.toUpperCase()
        }
        return updatedRow
      })
    )
  }

  const handleClusterSearch = async (id: string, value: string) => {
    updateRow(id, "cluster_name", value)
    if (value.length >= 3) {
      const response = await lookupApi.getClusters(undefined, value)
      if (response.data) {
        setClusterSuggestions(response.data)
        setActiveCell(id)
      }
    } else {
      setClusterSuggestions([])
    }
  }

  const handleClusterSelect = async (id: string, cluster: any) => {
    updateRow(id, "cluster_name", cluster.cluster_name)
    updateRow(id, "region", cluster.region)
    const hubResponse = await lookupApi.getHubs(cluster.cluster_name)
    if (hubResponse.data && Array.isArray(hubResponse.data)) {
      const hubs = hubResponse.data
      if (hubs.length > 0) {
        updateRow(id, "station_name", hubs[0].hub_name)
        updateRow(id, "dock_number", hubs[0].dock_number || "")
      }
    }
    setClusterSuggestions([])
    setActiveCell(null)
  }

  const handleOpsIdChange = async (id: string, value: string) => {
    const upperValue = value.toUpperCase()
    updateRow(id, "assigned_ops_id", upperValue)
    if (upperValue.length >= 3) {
      const response = await lookupApi.getUser(upperValue)
      if (response.data) {
        updateRow(id, "assigned_ops_name", response.data.name)
      }
    }
  }

  const validateRows = (): boolean => {
    for (const row of rows) {
      if (!row.cluster_name || !row.station_name || !row.region) {
        toast({
          variant: "destructive",
          title: "Validation failed",
          description: "Cluster name, station, and region are required.",
        })
        return false
      }
      if (!row.dock_confirmed) {
        toast({
          variant: "destructive",
          title: "Validation failed",
          description: "Please confirm dock number for all rows.",
        })
        return false
      }
      if (!row.actual_docked_time || !row.actual_depart_time) {
        toast({
          variant: "destructive",
          title: "Validation failed",
          description: "Docked and depart times are required.",
        })
        return false
      }
      if (new Date(row.actual_depart_time) < new Date(row.actual_docked_time)) {
        toast({
          variant: "destructive",
          title: "Validation failed",
          description: "Depart time must be after docked time.",
        })
        return false
      }
      if (!row.processor_name || !row.assigned_ops_id) {
        toast({
          variant: "destructive",
          title: "Validation failed",
          description: "Processor name and assigned OPS ID are required.",
        })
        return false
      }
      if (row.lh_trip && !row.lh_trip.startsWith("LT")) {
        toast({
          variant: "destructive",
          title: "Validation failed",
          description: "LH Trip must start with LT.",
        })
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateRows()) return
    setLoading(true)
    const response = await dispatchApi.submitRows(rows, user?.ops_id || "")
    setLoading(false)
    if (response.error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: response.error,
      })
      return
    }
    if (response.data) {
      toast({
        title: "Submission successful",
        description: `${response.data.created_count} row(s) created successfully.`,
      })
      localStorage.removeItem(getDraftKey())
      setRows([emptyRow()])
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dispatch Entries</h1>
        <p className="text-muted-foreground">Add up to {MAX_ROWS} dispatch entries per session</p>
      </div>
      <Card className="card-shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLHTrip(!showLHTrip)}>
                {showLHTrip ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                LH Trip
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPlate(!showPlate)}>
                {showPlate ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                Plate #
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowFleet(!showFleet)}>
                {showFleet ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                Fleet
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={saveDraft}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider">#</th>
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider min-w-[180px]">Cluster</th>
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider min-w-[150px]">Station</th>
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider">Region</th>
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider">TO Count</th>
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider">OID Loaded</th>
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider min-w-[180px]">Docked Time</th>
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider">Dock #</th>
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider min-w-[180px]">Depart Time</th>
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider min-w-[150px]">Processor</th>
                  {showLHTrip && <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider">LH Trip</th>}
                  {showPlate && <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider">Plate #</th>}
                  {showFleet && <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider">Fleet</th>}
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider">Ops ID</th>
                  <th className="p-2.5 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-2.5 text-sm font-medium">{index + 1}</td>
                    <td className="p-2.5 relative">
                      <Input
                        value={row.cluster_name}
                        onChange={(e) => handleClusterSearch(row.id, e.target.value)}
                        placeholder="Type to search..."
                        className="h-8 text-sm"
                      />
                      {clusterSuggestions.length > 0 && activeCell === row.id && (
                        <div className="absolute z-10 mt-1 w-full border rounded-md bg-popover p-2 space-y-1 max-h-40 overflow-y-auto shadow-lg animate-scale-in">
                          {clusterSuggestions.map((cluster, idx) => (
                            <div
                              key={idx}
                              className="p-2 text-sm hover:bg-accent cursor-pointer rounded transition-colors"
                              onClick={() => handleClusterSelect(row.id, cluster)}
                            >
                              {cluster.cluster_name} - {cluster.region}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5">
                      <Input value={row.station_name} readOnly className="h-8 text-sm bg-muted" />
                    </td>
                    <td className="p-2.5">
                      <Input value={row.region} readOnly className="h-8 text-sm bg-muted" />
                    </td>
                    <td className="p-2.5">
                      <Input
                        type="number"
                        min="0"
                        value={row.count_of_to}
                        onChange={(e) => updateRow(row.id, "count_of_to", parseInt(e.target.value) || 0)}
                        className="h-8 w-24 text-sm"
                      />
                    </td>
                    <td className="p-2.5">
                      <Input
                        type="number"
                        min="0"
                        value={row.total_oid_loaded}
                        onChange={(e) => updateRow(row.id, "total_oid_loaded", parseInt(e.target.value) || 0)}
                        className="h-8 w-24 text-sm"
                      />
                    </td>
                    <td className="p-2.5">
                      <Input
                        type="datetime-local"
                        value={row.actual_docked_time}
                        onChange={(e) => updateRow(row.id, "actual_docked_time", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="p-2.5">
                      <div className="flex gap-1">
                        <Input
                          value={row.dock_number}
                          onChange={(e) => updateRow(row.id, "dock_number", e.target.value)}
                          className="h-8 w-16 text-sm"
                        />
                        <Button
                          variant={row.dock_confirmed ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateRow(row.id, "dock_confirmed", !row.dock_confirmed)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {row.dock_confirmed ? "✓" : "?"}
                        </Button>
                      </div>
                    </td>
                    <td className="p-2.5">
                      <Input
                        type="datetime-local"
                        value={row.actual_depart_time}
                        onChange={(e) => updateRow(row.id, "actual_depart_time", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="p-2.5">
                      <Input
                        value={row.processor_name}
                        onChange={(e) => updateRow(row.id, "processor_name", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </td>
                    {showLHTrip && (
                      <td className="p-2.5">
                        <Input
                          value={row.lh_trip}
                          onChange={(e) => updateRow(row.id, "lh_trip", e.target.value)}
                          placeholder="LT..."
                          className="h-8 w-24 text-sm"
                        />
                      </td>
                    )}
                    {showPlate && (
                      <td className="p-2.5">
                        <Input
                          value={row.plate_number}
                          onChange={(e) => updateRow(row.id, "plate_number", e.target.value)}
                          className="h-8 w-24 text-sm"
                        />
                      </td>
                    )}
                    {showFleet && (
                      <td className="p-2.5">
                        <Select value={row.fleet_size} onValueChange={(value) => updateRow(row.id, "fleet_size", value)}>
                          <SelectTrigger className="h-8 w-20 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FLEET_SIZES.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    )}
                    <td className="p-2.5">
                      <Input
                        value={row.assigned_ops_id}
                        onChange={(e) => handleOpsIdChange(row.id, e.target.value)}
                        className="h-8 w-24 text-sm"
                        placeholder="OPS ID"
                      />
                      {row.assigned_ops_name && (
                        <div className="text-xs text-muted-foreground mt-1">{row.assigned_ops_name}</div>
                      )}
                    </td>
                    <td className="p-2.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <Button variant="outline" onClick={addRow} disabled={rows.length >= MAX_ROWS}>
              <Plus className="mr-2 h-4 w-4" />
              Add Row ({rows.length}/{MAX_ROWS})
            </Button>
            <Button onClick={handleSubmit} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit All Rows
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
