import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"

export const GET = withRequestLogging("/api/kpi/productivity", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const filters: string[] = []
  const params: string[] = []

  if (startDate) {
    params.push(startDate)
    filters.push(`date >= $${params.length}`)
  }

  if (endDate) {
    params.push(endDate)
    filters.push(`date <= $${params.length}`)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : ""

  const result = await query(
    `SELECT *
     FROM kpi_productivity
     ${whereClause}
     ORDER BY date DESC`,
    params
  )

  return NextResponse.json(result.rows, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
  })
})
