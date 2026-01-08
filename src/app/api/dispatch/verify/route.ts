import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { enforceSessionRateLimit } from "@/lib/rate-limit"
import { parseRequestJson } from "@/lib/validation"
import { z } from "zod"

const verifySchema = z
  .object({
    rows: z.array(z.string().min(1), { required_error: "rows are required" }).min(1, "rows are required"),
    verified_by_ops_id: z
      .string({ required_error: "verified_by_ops_id is required" })
      .trim()
      .min(1, "verified_by_ops_id is required"),
    send_csv: z.boolean().optional(),
    send_mode: z.enum(["per_batch", "all"]).optional(),
  })
  .strict()

export const POST = withRequestLogging("/api/dispatch/verify", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
  const verifiedBy = parsed.data.verified_by_ops_id

  await query(
    `UPDATE dispatch_reports
     SET status = 'Confirmed',
         confirmed_by_ops_id = $2,
         confirmed_at = NOW(),
         status_updated_at = NOW()
     WHERE dispatch_id::text = ANY($1::text[])`,
    [rows, verifiedBy]
  )

  const results = rows.map((rowId: string) => ({
    dispatch_ids: [rowId],
    csv_link: null,
    seatalk_status: "pending",
  }))

  return NextResponse.json({ results })
})
