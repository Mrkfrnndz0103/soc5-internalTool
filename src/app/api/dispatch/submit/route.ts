import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { enforceSessionRateLimit } from "@/lib/rate-limit"
import { parseRequestJson } from "@/lib/validation"
import { createDispatchReports } from "@/server/repositories/dispatch-reports"
import { normalizeDispatchRows } from "@/server/services/dispatch-submit"
import { z } from "zod"

const MAX_ROWS = 10

const submitSchema = z
  .object({
    rows: z
      .array(z.record(z.unknown()), { required_error: "rows are required" })
      .min(1, "rows are required")
      .max(MAX_ROWS, `rows must be <= ${MAX_ROWS}`),
    submitted_by_ops_id: z
      .string()
      .trim()
      .min(1, "submitted_by_ops_id is required")
      .optional(),
  })
  .strict()

export const POST = withRequestLogging("/api/dispatch/submit", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!session.user.ops_id) {
    return NextResponse.json({ error: "User ops_id is missing" }, { status: 403 })
  }

  const rateLimit = await enforceSessionRateLimit(session.sessionId)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  const parsed = await parseRequestJson(request, submitSchema)
  if (parsed.errorResponse) return parsed.errorResponse
  const rows = parsed.data.rows
  const submittedBy = session.user.ops_id

  const { normalizedRows, validationErrors } = normalizeDispatchRows(rows)

  if (validationErrors.length > 0) {
    const results = validationErrors.map((detail) => ({
      rowIndex: detail.rowIndex,
      status: "error",
      errors: detail.errors,
    }))
    return NextResponse.json(
      {
        error: "Validation failed",
        details: { rows: results },
      },
      { status: 400 }
    )
  }

  await createDispatchReports(
    normalizedRows.map((row) => ({
      clusterName: row.clusterName,
      stationName: row.stationName,
      region: row.region,
      countOfTo: row.countOfTo,
      totalOidLoaded: row.totalOidLoaded,
      dockNumber: row.dockNumber,
      dockConfirmed: row.dockConfirmed,
      status: row.status,
      lhTrip: row.lhTrip,
      dockedTime: row.dockedTime,
      departTime: row.departTime,
      processor: row.processor,
      plate: row.plate,
      fleetSize: row.fleetSize,
      assignedOpsId: row.assignedOpsId,
    })),
    submittedBy
  )

  const results = normalizedRows.map((_, index) => ({
    rowIndex: index,
    status: "created",
  }))

  return NextResponse.json({
    ok: true,
    submitted: normalizedRows.length,
    failed: 0,
    created_count: normalizedRows.length,
    errors_count: 0,
    results,
  })
})
