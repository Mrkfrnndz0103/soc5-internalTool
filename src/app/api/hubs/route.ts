import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { enforceSessionRateLimit } from "@/lib/rate-limit"
import { parseRequestJson } from "@/lib/validation"
import { z } from "zod"

const hubPayloadSchema = z
  .object({
    cluster_name: z.string().trim().min(1).optional(),
    hub_name: z.string().trim().min(1).optional(),
    region: z.string().trim().min(1).optional(),
    dock_number: z.string().trim().min(1).optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "hub data is required" })

export const GET = withRequestLogging("/api/hubs", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit") || "10")
  const offset = Number(searchParams.get("offset") || "0")
  const activeParam = searchParams.get("active")
  const active = activeParam === null ? undefined : activeParam === "true"

  const filters: string[] = []
  const params: any[] = []

  if (active !== undefined) {
    params.push(active)
    filters.push(`active = $${params.length}`)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : ""

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM outbound_map
     ${whereClause}`,
    params
  )

  const rowsResult = await query(
    `SELECT *
     FROM outbound_map
     ${whereClause}
     ORDER BY hub_name
     LIMIT $${params.length + 1}
     OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  return NextResponse.json(
    { hubs: rowsResult.rows, total: countResult.rows[0]?.total || 0 },
    { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } }
  )
})

export const POST = withRequestLogging("/api/hubs", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const allowedRoles = new Set(["Admin", "Data Team"])
  if (!allowedRoles.has(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rateLimit = await enforceSessionRateLimit(session.sessionId)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  const parsed = await parseRequestJson(request, hubPayloadSchema)
  if (parsed.errorResponse) return parsed.errorResponse
  const entries = Object.entries(parsed.data)

  const columns = entries.map(([key]) => `"${key}"`).join(", ")
  const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ")
  const values = entries.map(([, value]) => value)

  const result = await query(
    `INSERT INTO outbound_map (${columns})
     VALUES (${placeholders})
     RETURNING *`,
    values
  )

  return NextResponse.json(result.rows[0])
})
