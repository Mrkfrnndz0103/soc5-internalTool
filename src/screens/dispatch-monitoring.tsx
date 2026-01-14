"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { dispatchApi } from "@/lib/api"
import { formatDateTime } from "@/lib/utils"
import { Truck, Package, Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DispatchEntry {
  dispatch_id: string
  cluster_name: string
  station_name: string
  region: string
  status: string
  actual_docked_time: string
  actual_depart_time: string
  processor_name: string
  plate_number: string
}

export function DispatchMonitoringPage() {
  const [dispatches, setDispatches] = useState<DispatchEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    ongoing: 0,
    completed: 0,
  })

  useEffect(() => {
    loadDispatches()
    const interval = setInterval(loadDispatches, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDispatches = async () => {
    setLoading(true)
    const response = await dispatchApi.getDispatches<DispatchEntry>({
      limit: 20,
      fields: [
        "dispatch_id",
        "cluster_name",
        "station_name",
        "region",
        "status",
        "actual_docked_time",
        "actual_depart_time",
        "processor_name",
        "plate_number",
      ],
    })
    setLoading(false)

    if (response.data) {
      const rows = response.data.rows || []
      setDispatches(rows)
      setStats({
        total: rows.length,
        pending: rows.filter((d: DispatchEntry) => d.status === "Pending").length,
        ongoing: rows.filter((d: DispatchEntry) => d.status === "Ongoing").length,
        completed: rows.filter((d: DispatchEntry) => d.status === "Completed" || d.status === "Confirmed" || d.status === "Verified").length,
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
      case "Confirmed":
      case "Verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "Ongoing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
      case "Confirmed":
      case "Verified":
        return "bg-green-100 text-green-700 border-green-200"
      case "Ongoing":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      default:
        return "bg-blue-100 text-blue-700 border-blue-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Dispatches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.ongoing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Live Dispatch Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Live Dispatch Feed
              </CardTitle>
              <CardDescription>Real-time dispatch monitoring (auto-refreshes every 30s)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadDispatches} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && dispatches.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : dispatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No dispatches found
            </div>
          ) : (
            <div className="space-y-3">
              {dispatches.map((dispatch) => (
                <div
                  key={dispatch.dispatch_id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(dispatch.status)}
                    <div>
                      <div className="font-medium">{dispatch.cluster_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {dispatch.station_name} - {dispatch.processor_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">{dispatch.plate_number}</div>
                      <div className="text-xs">{formatDateTime(dispatch.actual_docked_time)}</div>
                    </div>
                    <Badge className={getStatusColor(dispatch.status)}>
                      {dispatch.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
