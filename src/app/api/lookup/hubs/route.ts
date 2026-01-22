import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { withCache } from "@/lib/server-cache"
import { LOOKUP_CACHE_CONTROL, LOOKUP_CACHE_MS } from "@/lib/cache-control"
import { listHubLookups } from "@/server/repositories/outbound-map"

type HubLookupRow = {
  hubName: string | null
  dockNumber: string | null
}

export const GET = withRequestLogging("/api/lookup/hubs", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cluster = searchParams.get("cluster")

  const cacheKey = `lookup:hubs:${cluster ?? "all"}`
  const rows = await withCache(cacheKey, LOOKUP_CACHE_MS, async () => {
    const result = (await listHubLookups({ cluster: cluster ?? undefined })) as HubLookupRow[]
    return result.map((row) => ({
      hub_name: row.hubName,
      dock_number: row.dockNumber,
    }))
  })

  return NextResponse.json(rows, { headers: { "Cache-Control": LOOKUP_CACHE_CONTROL } })
})
