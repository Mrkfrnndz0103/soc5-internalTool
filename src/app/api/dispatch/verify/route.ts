import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { enforceSessionRateLimit } from "@/lib/rate-limit"
import { parseRequestJson } from "@/lib/validation"
import { confirmDispatchReports } from "@/server/repositories/dispatch-reports"
import { z } from "zod"

const verifySchema = z
  .object({
    rows: z.array(z.string().min(1), { required_error: "rows are required" }).min(1, "rows are required"),
    verified_by_ops_id: z
      .string()
      .trim()
      .min(1, "verified_by_ops_id is required")
      .optional(),
    send_csv: z.boolean().optional(),
    send_mode: z.enum(["per_batch", "all"]).optional(),
  })
  .strict()

export const POST = withRequestLogging("/api/dispatch/verify", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!session.user.ops_id) {
    return NextResponse.json({ error: "User ops_id is missing" }, { status: 403 })
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

  const parsed = await parseRequestJson(request, verifySchema)
  if (parsed.errorResponse) return parsed.errorResponse
  const rows = parsed.data.rows
  const verifiedBy = session.user.ops_id
  await confirmDispatchReports(rows, verifiedBy)

  const results = rows.map((rowId: string) => ({
    dispatch_ids: [rowId],
    csv_link: null,
    seatalk_status: "pending",
  }))

  return NextResponse.json({ results })
})
