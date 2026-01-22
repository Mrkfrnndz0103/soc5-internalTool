import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { withCache } from "@/lib/server-cache"
import { LOOKUP_CACHE_CONTROL, LOOKUP_CACHE_MS } from "@/lib/cache-control"
import { listProcessors } from "@/server/repositories/users"

type ProcessorLookupRow = {
  name: string
  opsId: string
}

export const GET = withRequestLogging("/api/lookup/processors", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const queryText = searchParams.get("query")

  const cacheKey = `lookup:processors:${queryText ?? "all"}`
  const rows = await withCache(cacheKey, LOOKUP_CACHE_MS, async () => {
    const result = (await listProcessors(queryText ?? undefined)) as ProcessorLookupRow[]
    return result.map((row) => ({ name: row.name, ops_id: row.opsId }))
  })

  return NextResponse.json(rows, { headers: { "Cache-Control": LOOKUP_CACHE_CONTROL } })
})
