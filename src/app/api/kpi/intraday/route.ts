import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"

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

  const filters: string[] = []
  const params: string[] = []

  if (date) {
    params.push(date)
    filters.push(`date = $${params.length}`)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : ""

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM kpi_intraday
     ${whereClause}`,
    params
  )

  const result = await query(
    `SELECT date, hour, dispatches, volume, timestamp
     FROM kpi_intraday
     ${whereClause}
     ORDER BY timestamp DESC
     LIMIT $${params.length + 1}
     OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  return NextResponse.json(
    {
      rows: result.rows,
      total: countResult.rows[0]?.total || 0,
      limit,
      offset,
    },
    {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
    }
  )
})
