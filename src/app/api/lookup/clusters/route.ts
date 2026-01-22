import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { withCache } from "@/lib/server-cache"
import { LOOKUP_CACHE_CONTROL, LOOKUP_CACHE_MS } from "@/lib/cache-control"
import { listClusters } from "@/server/repositories/outbound-map"

type ClusterLookupRow = {
  clusterName: string | null
  region: string | null
}

export const GET = withRequestLogging("/api/lookup/clusters", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const region = searchParams.get("region")
  const queryText = searchParams.get("query")

  const cacheKey = `lookup:clusters:${region ?? "all"}:${queryText ?? ""}`
  const rows = await withCache(cacheKey, LOOKUP_CACHE_MS, async () => {
    const result = (await listClusters({
      region: region ?? undefined,
      query: queryText ?? undefined,
    })) as ClusterLookupRow[]
    return result.map((row) => ({
      cluster_name: row.clusterName,
      region: row.region,
    }))
  })

  return NextResponse.json(rows, { headers: { "Cache-Control": LOOKUP_CACHE_CONTROL } })
})
