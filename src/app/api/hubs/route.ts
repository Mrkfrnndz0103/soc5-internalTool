import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { enforceSessionRateLimit } from "@/lib/rate-limit"
import { parseRequestJson } from "@/lib/validation"
import { withCache, invalidateCache } from "@/lib/server-cache"
import { HUB_CACHE_CONTROL, HUB_CACHE_MS } from "@/lib/cache-control"
import { createHub, listHubs } from "@/server/repositories/outbound-map"
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

  const cacheKey = `hubs:${active ?? "all"}:${limit}:${offset}`
  const payload = await withCache(cacheKey, HUB_CACHE_MS, async () => {
    const result = await listHubs({ active, limit, offset })
    return { hubs: result.rows, total: result.total }
  })

  return NextResponse.json(payload, { headers: { "Cache-Control": HUB_CACHE_CONTROL } })
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
  const { cluster_name, hub_name, region, dock_number, active } = parsed.data
  const result = await createHub({
    clusterName: cluster_name ?? null,
    hubName: hub_name ?? null,
    region: region ?? null,
    dockNumber: dock_number ?? null,
    active,
  })

  invalidateCache("hubs:")
  invalidateCache("lookup:")

  return NextResponse.json(result)
})
