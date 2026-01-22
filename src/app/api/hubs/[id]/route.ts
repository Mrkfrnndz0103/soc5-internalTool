import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { enforceSessionRateLimit } from "@/lib/rate-limit"
import { parseRequestJson } from "@/lib/validation"
import { invalidateCache } from "@/lib/server-cache"
import { deactivateHub, updateHub } from "@/server/repositories/outbound-map"
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

    const parsed = await parseRequestJson(request, hubUpdateSchema)
    if (parsed.errorResponse) return parsed.errorResponse
    const { cluster_name, hub_name, region, dock_number, active } = parsed.data
    const result = await updateHub(params.id, {
      clusterName: cluster_name ?? null,
      hubName: hub_name ?? null,
      region: region ?? null,
      dockNumber: dock_number ?? null,
      active,
    })

    if (!result) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 })
    }

    invalidateCache("hubs:")
    invalidateCache("lookup:")

    return NextResponse.json(result)
  }
)

export const DELETE = withRequestLogging(
  "/api/hubs/[id]",
  async (_request: Request, { params }: { params: { id: string } }) => {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const allowedRoles = new Set(["Admin", "Data Team"])
    if (!allowedRoles.has(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await deactivateHub(params.id)
    if (!result) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 })
    }

    invalidateCache("hubs:")
    invalidateCache("lookup:")

    return NextResponse.json(result)
  }
)
