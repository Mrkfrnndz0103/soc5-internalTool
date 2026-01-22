import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { withCache } from "@/lib/server-cache"
import { KPI_CACHE_CONTROL, KPI_CACHE_MS } from "@/lib/cache-control"
import { listKpiIntraday } from "@/server/repositories/kpi"

type IntradayRow = {
  date: Date | null
  hour: number | null
  dispatches: unknown
  volume: unknown
  timestamp: Date | null
}

export const GET = withRequestLogging("/api/kpi/intraday", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const DEFAULT_LIMIT = 100
  const MAX_LIMIT = 1000

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")
  const limitRaw = Number(searchParams.get("limit") || String(DEFAULT_LIMIT))
  const offsetRaw = Number(searchParams.get("offset") || "0")
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0

  const cacheKey = `kpi:intraday:${date ?? "all"}:${limit}:${offset}`
  const payload = await withCache(cacheKey, KPI_CACHE_MS, async () => {
    const result = await listKpiIntraday({ date, limit, offset })
    return {
      rows: (result.rows as IntradayRow[]).map((row) => ({
        date: row.date,
        hour: row.hour,
        dispatches: row.dispatches === null ? null : Number(row.dispatches),
        volume: row.volume === null ? null : Number(row.volume),
        timestamp: row.timestamp,
      })),
      total: result.total,
      limit,
      offset,
    }
  })

  return NextResponse.json(payload, { headers: { "Cache-Control": KPI_CACHE_CONTROL } })
})
