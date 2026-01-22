import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { withCache } from "@/lib/server-cache"
import { LH_TRIP_CACHE_CONTROL, LH_TRIP_CACHE_MS } from "@/lib/cache-control"
import { getLhTripSummary } from "@/server/repositories/dispatch-google-sheet"

export const GET = withRequestLogging("/api/lookup/lh-trip", async (request: Request) => {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const lhTripRaw = searchParams.get("lhTrip") || searchParams.get("lh_trip")
  const lhTrip = lhTripRaw?.trim().toUpperCase()

  if (!lhTrip) {
    return NextResponse.json({ error: "lhTrip is required" }, { status: 400 })
  }

  const cacheKey = `lookup:lh-trip:${lhTrip}`
  const row = await withCache(cacheKey, LH_TRIP_CACHE_MS, async () => {
    return getLhTripSummary(lhTrip)
  })

  return NextResponse.json({ row }, { headers: { "Cache-Control": LH_TRIP_CACHE_CONTROL } })
})
