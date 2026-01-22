import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { withCache } from "@/lib/server-cache"
import { KPI_CACHE_CONTROL, KPI_CACHE_MS } from "@/lib/cache-control"
import { listKpiMdt } from "@/server/repositories/kpi"

type MdtRow = {
  date: Date | null
  mdtScore: unknown
  target: unknown
}

export const GET = withRequestLogging("/api/kpi/mdt", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const DEFAULT_LIMIT = 50
  const MAX_LIMIT = 500

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const limitRaw = Number(searchParams.get("limit") || String(DEFAULT_LIMIT))
  const offsetRaw = Number(searchParams.get("offset") || "0")
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0

  const cacheKey = `kpi:mdt:${startDate ?? "all"}:${endDate ?? "all"}:${limit}:${offset}`
  const payload = await withCache(cacheKey, KPI_CACHE_MS, async () => {
    const result = await listKpiMdt({ startDate, endDate, limit, offset })
    return {
      rows: (result.rows as MdtRow[]).map((row) => ({
        date: row.date,
        mdt_score: row.mdtScore === null ? null : Number(row.mdtScore),
        target: row.target === null ? null : Number(row.target),
      })),
      total: result.total,
      limit,
      offset,
    }
  })

  return NextResponse.json(payload, { headers: { "Cache-Control": KPI_CACHE_CONTROL } })
})
