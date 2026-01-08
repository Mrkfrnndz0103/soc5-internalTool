import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { enforceSessionRateLimit } from "@/lib/rate-limit"
import { parseRequestJson } from "@/lib/validation"
import { z } from "zod"

const hubUpdateSchema = z
  .object({
    cluster_name: z.string().trim().min(1).optional(),
    hub_name: z.string().trim().min(1).optional(),
    region: z.string().trim().min(1).optional(),
    dock_number: z.string().trim().min(1).optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "hub data is required" })

export const PATCH = withRequestLogging(
  "/api/hubs/[id]",
  async (request: Request, { params }: { params: { id: string } }) => {
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

    const parsed = await parseRequestJson(request, hubUpdateSchema)
    if (parsed.errorResponse) return parsed.errorResponse
    const entries = Object.entries(parsed.data)

    const assignments = entries.map(([key], index) => `"${key}" = $${index + 1}`).join(", ")
    const values = entries.map(([, value]) => value)
    values.push(params.id)

    const result = await query(
      `UPDATE outbound_map
       SET ${assignments}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  }
)

export const DELETE = withRequestLogging(
  "/api/hubs/[id]",
  async (_request: Request, { params }: { params: { id: string } }) => {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await query(
      `UPDATE outbound_map
       SET active = false
       WHERE id = $1
       RETURNING *`,
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  }
)
