import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { withRequestLogging } from "@/lib/request-context"
import { parseRequestJson } from "@/lib/validation"
import { invalidateCache } from "@/lib/server-cache"
import { upsertDispatchSheetRows } from "@/server/repositories/dispatch-google-sheet"
import { enforceIpRateLimit } from "@/server/ip-rate-limit"
import { WEBHOOK_RATE_LIMIT_MAX_REQUESTS, WEBHOOK_RATE_LIMIT_WINDOW_MS } from "@/server/rate-limit-config"
import type { JsonValue } from "@/lib/json-types"
import { z } from "zod"

type RawRow = Record<string, unknown>

type SheetRow = {
  rowKey: string
  dispatchDate?: Date | null
  origin?: string | null
  toDestStationName?: string | null
  tripNumber: string
  toNumber?: string | null
  toParcelQuantity?: number | null
  loadedTimestamp?: Date | null
  operatorRaw?: string | null
  operatorOpsId?: string | null
  operatorName?: string | null
  departureTimestamp?: Date | null
  truckSize?: string | null
  vehicleNumber?: string | null
  driverName?: string | null
  rawPayload: RawRow
}

const syncPayloadSchema = z
  .object({
    rows: z.array(z.unknown()).optional(),
    headers: z.array(z.unknown()).optional(),
  })
  .passthrough()

const HEADER_ALIASES: Record<string, string> = {
  dispatchdate: "dispatch_date",
  origin: "origin",
  todeststationname: "to_dest_station_name",
  tripnumber: "trip_number",
  tripno: "trip_number",
  tonumber: "to_number",
  toparcelquantity: "to_parcel_quantity",
  loadedtimestamp: "loaded_timestamp",
  operator: "operator",
  departuretimestamp: "departure_timestamp",
  trucksize: "truck_size",
  vehiclenumber: "vehicle_number",
  drivername: "driver_name",
}

const FETCH_TIMEOUT_MS = 15000

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function toStringValue(value: unknown) {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue
}

function parseInteger(value?: string) {
  if (!value) return null
  const normalized = value.replace(/,/g, "").trim()
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null
}

function parseDateTime(value?: string) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const serial = Number(trimmed)
    if (Number.isFinite(serial)) {
      const date = new Date((serial - 25569) * 86400 * 1000)
      if (!Number.isNaN(date.getTime())) return date
    }
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function buildRowKey(
  tripNumber: string,
  dispatchDate?: Date | null,
  toNumber?: string | null,
  loadedTimestamp?: Date | null,
  rawRow?: RawRow
) {
  const datePart = dispatchDate ? dispatchDate.toISOString().slice(0, 10) : ""
  const timePart = loadedTimestamp ? loadedTimestamp.toISOString() : ""
  const base = [datePart, tripNumber, toNumber || "", timePart].filter(Boolean).join("|")
  if (base) return base
  const payload = rawRow ? JSON.stringify(rawRow) : tripNumber
  return createHash("sha256").update(payload).digest("hex")
}

function parseRow(rawRow: RawRow): SheetRow | null {
  const normalized: Record<string, string> = {}
  Object.entries(rawRow).forEach(([key, value]) => {
    const normalizedKey = normalizeHeader(key)
    if (!normalizedKey) return
    normalized[normalizedKey] = toStringValue(value)
  })

  const canonical: Record<string, string> = {}
  Object.entries(normalized).forEach(([key, value]) => {
    const canonicalKey = HEADER_ALIASES[key]
    if (!canonicalKey) return
    canonical[canonicalKey] = value
  })

  const tripNumber = canonical.trip_number?.toUpperCase()
  if (!tripNumber) return null

  const operatorValue = canonical.operator || ""
  let operatorOpsId: string | null = null
  let operatorName: string | null = null
  
  const operatorRaw = operatorValue || null

  if (operatorValue) {
    const match = operatorValue.match(/\[([^\]]+)\]\s*(.+)/)
    if (match) {
      operatorOpsId = match[1].trim()
      operatorName = match[2].trim() || null
    } else {
      operatorName = operatorValue
    }
  }

  const dispatchDate = parseDateTime(canonical.dispatch_date)
  const toNumber = canonical.to_number || null
  const toParcelQuantity = parseInteger(canonical.to_parcel_quantity)
  const loadedTimestamp = parseDateTime(canonical.loaded_timestamp)
  const departureTimestamp = parseDateTime(canonical.departure_timestamp)
  const rowKey = buildRowKey(tripNumber, dispatchDate, toNumber, loadedTimestamp, rawRow)

  return {
    rowKey,
    dispatchDate,
    origin: canonical.origin || null,
    toDestStationName: canonical.to_dest_station_name || null,
    tripNumber,
    toNumber,
    toParcelQuantity,
    loadedTimestamp,
    operatorRaw,
    operatorOpsId,
    operatorName,
    departureTimestamp,
    truckSize: canonical.truck_size || null,
    vehicleNumber: canonical.vehicle_number || null,
    driverName: canonical.driver_name || null,
    rawPayload: rawRow,
  }
}

async function fetchSheetRows(): Promise<RawRow[]> {
  const sheetId = process.env.GOOGLE_SHEETS_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY
  const range = process.env.GOOGLE_SHEETS_RANGE || "dispatch_sync!A:L"

  if (!sheetId || !apiKey) {
    throw new Error("GOOGLE_SHEETS_ID and GOOGLE_SHEETS_API_KEY are required")
  }

  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`)
  url.searchParams.set("key", apiKey)
  url.searchParams.set("valueRenderOption", "FORMATTED_VALUE")
  url.searchParams.set("dateTimeRenderOption", "FORMATTED_STRING")

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let response: Response

  try {
    response = await fetch(url.toString(), { signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Google Sheets request timed out")
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    throw new Error(`Google Sheets fetch failed: ${response.status}`)
  }

  const payload = (await response.json()) as { values?: unknown[][] }
  const values = Array.isArray(payload.values) ? payload.values : []
  if (values.length === 0) return []

  const [headerRow, ...dataRows] = values
  const headers = (Array.isArray(headerRow) ? headerRow : []).map((header) => toStringValue(header))
  if (headers.length === 0) return []

  return dataRows
    .filter((row) => Array.isArray(row))
    .map((row) => {
      const obj: RawRow = {}
      headers.forEach((header, index) => {
        if (!header) return
        obj[header] = (row as unknown[])[index]
      })
      return obj
    })
}

function rowsFromBody(body: unknown): RawRow[] | null {
  if (!body || typeof body !== "object") return null
  const record = body as { rows?: unknown; headers?: unknown }
  if (!Array.isArray(record.rows)) return null
  const rows = record.rows as unknown[]
  if (rows.length === 0) return []

  if (Array.isArray(rows[0])) {
    const headerSource = Array.isArray(record.headers) ? record.headers : (rows[0] as unknown[])
    const headers: string[] = headerSource.map((header: unknown) => toStringValue(header))
    const dataRows = Array.isArray(record.headers) ? rows : rows.slice(1)
    return dataRows
      .filter((row) => Array.isArray(row))
      .map((row) => {
        const obj: RawRow = {}
        headers.forEach((header, index) => {
          if (!header) return
          obj[header] = (row as unknown[])[index]
        })
        return obj
      })
  }

  if (typeof rows[0] === "object" && rows[0] !== null) {
    return rows as RawRow[]
  }

  return []
}

async function upsertSheetRows(rows: SheetRow[]) {
  return upsertDispatchSheetRows(
    rows.map((row) => ({
      rowKey: row.rowKey,
      dispatchDate: row.dispatchDate ?? null,
      origin: row.origin ?? null,
      toDestStationName: row.toDestStationName ?? null,
      tripNumber: row.tripNumber,
      toNumber: row.toNumber ?? null,
      toParcelQuantity: row.toParcelQuantity ?? null,
      loadedTimestamp: row.loadedTimestamp ?? null,
      operatorRaw: row.operatorRaw ?? null,
      operatorOpsId: row.operatorOpsId ?? null,
      operatorName: row.operatorName ?? null,
      departureTimestamp: row.departureTimestamp ?? null,
      truckSize: row.truckSize ?? null,
      vehicleNumber: row.vehicleNumber ?? null,
      driverName: row.driverName ?? null,
      rawPayload: toJsonValue(row.rawPayload),
    }))
  )
}

export const POST = withRequestLogging("/api/sync/google-sheets", async (request: Request) => {
  const rateLimit = enforceIpRateLimit(request, "webhook-google-sheets", {
    windowMs: WEBHOOK_RATE_LIMIT_WINDOW_MS,
    limit: WEBHOOK_RATE_LIMIT_MAX_REQUESTS,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    )
  }

  if (process.env.FEATURE_GOOGLE_SHEETS_SYNC === "false") {
    return NextResponse.json({ error: "Google Sheets sync is disabled" }, { status: 403 })
  }

  const secret = process.env.WEBHOOK_SECRET
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 })
  }
  const { searchParams } = new URL(request.url)
  const providedSecret = request.headers.get("x-webhook-secret") || searchParams.get("secret")
  if (secret && providedSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = await parseRequestJson(request, syncPayloadSchema)
  if (parsed.errorResponse) return parsed.errorResponse
  const body = parsed.data
  let rawRows = rowsFromBody(body)

  if (!rawRows) {
    try {
      rawRows = await fetchSheetRows()
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to fetch sheet data" },
        { status: 500 }
      )
    }
  }

  const sheetRows = rawRows.map(parseRow).filter((row): row is SheetRow => Boolean(row))

  if (sheetRows.length === 0) {
    return NextResponse.json({ synced: 0, ignored: rawRows.length })
  }

  await upsertSheetRows(sheetRows)
  invalidateCache("lookup:lh-trip:")

  return NextResponse.json({
    synced: sheetRows.length,
    ignored: rawRows.length - sheetRows.length,
  })
})
