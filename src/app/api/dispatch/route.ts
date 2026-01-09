import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"

export const GET = withRequestLogging("/api/dispatch", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const DEFAULT_FIELDS = [
    "dispatch_id",
    "cluster_name",
    "station_name",
    "region",
    "status",
    "actual_docked_time",
    "actual_depart_time",
    "processor_name",
    "plate_number",
    "created_at",
    "status_updated_at",
  ]
  const ALLOWED_FIELDS = new Set([
    ...DEFAULT_FIELDS,
    "lh_trip_number",
    "submitted_by_ops_id",
    "assigned_data_team_ops_id",
    "acknowledged_by_ops_id",
    "acknowledged_at",
    "confirmed_by_ops_id",
    "confirmed_at",
    "pending_edit_reason",
    "edit_count",
  ])
  const DEFAULT_LIMIT = 20
  const MAX_LIMIT = 200

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const region = searchParams.get("region")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const limitRaw = Number(searchParams.get("limit") || String(DEFAULT_LIMIT))
  const offsetRaw = Number(searchParams.get("offset") || "0")
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0
  const fieldsParam = searchParams.get("fields")
  const requestedFields = fieldsParam
    ? fieldsParam
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean)
    : DEFAULT_FIELDS
  const selectedFields = requestedFields.filter((field) => ALLOWED_FIELDS.has(field))
  const selectClause = (selectedFields.length ? selectedFields : DEFAULT_FIELDS).join(", ")

  const filters: string[] = []
  const params: any[] = []

  if (status) {
    params.push(status)
    filters.push(`status = $${params.length}`)
  }

  if (region) {
    params.push(region)
    filters.push(`region = $${params.length}`)
  }

  if (startDate) {
    params.push(startDate)
    filters.push(`created_at >= $${params.length}`)
  }

  if (endDate) {
    params.push(endDate)
    filters.push(`created_at <= $${params.length}`)
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : ""

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM dispatch_reports
     ${whereClause}`,
    params
  )

  const rowsResult = await query(
    `SELECT ${selectClause}
     FROM dispatch_reports
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1}
     OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  )

  return NextResponse.json({
    rows: rowsResult.rows,
    total: countResult.rows[0]?.total || 0,
    limit,
    offset,
  })
})
