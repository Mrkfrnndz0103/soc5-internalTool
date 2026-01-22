import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { DEFAULT_DISPATCH_FIELDS, DISPATCH_FIELD_MAP, type DispatchField, listDispatchReports } from "@/server/repositories/dispatch-reports"

export const GET = withRequestLogging("/api/dispatch", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ALLOWED_FIELDS = new Set<DispatchField>([
    ...DEFAULT_DISPATCH_FIELDS,
    "count_of_to",
    "total_oid_loaded",
    "dock_number",
    "dock_confirmed",
    "lh_trip_number",
    "submitted_by_ops_id",
    "assigned_ops_id",
    "fleet_size",
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
        .filter((field): field is DispatchField => Boolean(field) && field in DISPATCH_FIELD_MAP)
    : [...DEFAULT_DISPATCH_FIELDS]
  const selectedFields = requestedFields.filter((field) => ALLOWED_FIELDS.has(field))

  const parsedStartDate = startDate ? new Date(startDate) : null
  const parsedEndDate = endDate ? new Date(endDate) : null
  const result = await listDispatchReports(
    {
      status: status ?? undefined,
      region: region ?? undefined,
      startDate: parsedStartDate && !Number.isNaN(parsedStartDate.getTime()) ? parsedStartDate : undefined,
      endDate: parsedEndDate && !Number.isNaN(parsedEndDate.getTime()) ? parsedEndDate : undefined,
    },
    {
      limit,
      offset,
      fields: selectedFields.length ? selectedFields : [...DEFAULT_DISPATCH_FIELDS],
    }
  )

  return NextResponse.json({
    rows: result.rows,
    total: result.total,
    limit,
    offset,
  })
})
