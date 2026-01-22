import { buildCacheControl, toCacheSeconds } from "@/lib/http-cache"

export const LOOKUP_CACHE_MS = 60_000
export const LOOKUP_CACHE_CONTROL = buildCacheControl({
  maxAgeSeconds: toCacheSeconds(LOOKUP_CACHE_MS),
  staleWhileRevalidateSeconds: toCacheSeconds(LOOKUP_CACHE_MS * 5),
})

export const LH_TRIP_CACHE_MS = 60_000
export const LH_TRIP_CACHE_CONTROL = buildCacheControl({
  maxAgeSeconds: toCacheSeconds(LH_TRIP_CACHE_MS),
  staleWhileRevalidateSeconds: toCacheSeconds(LH_TRIP_CACHE_MS * 2),
})

export const KPI_CACHE_MS = 30_000
export const KPI_CACHE_CONTROL = buildCacheControl({
  maxAgeSeconds: toCacheSeconds(KPI_CACHE_MS),
  staleWhileRevalidateSeconds: toCacheSeconds(KPI_CACHE_MS * 2),
})

export const HUB_CACHE_MS = 30_000
export const HUB_CACHE_CONTROL = buildCacheControl({
  maxAgeSeconds: toCacheSeconds(HUB_CACHE_MS),
  staleWhileRevalidateSeconds: toCacheSeconds(HUB_CACHE_MS * 2),
})
