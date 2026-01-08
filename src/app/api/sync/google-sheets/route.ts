import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { query } from "@/lib/db"

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

const SHEET_UPSERT_SQL = `
  INSERT INTO dispatch_google_sheet_rows
  (row_key, dispatch_date, origin, to_dest_station_name, trip_number, to_number, to_parcel_quantity, loaded_timestamp, operator_raw, operator_ops_id, operator_name, departure_timestamp, truck_size, vehicle_number, driver_name, raw_payload, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
  ON CONFLICT (row_key) DO UPDATE SET
    dispatch_date = EXCLUDED.dispatch_date,
    origin = EXCLUDED.origin,
    to_dest_station_name = EXCLUDED.to_dest_station_name,
    trip_number = EXCLUDED.trip_number,
    to_number = EXCLUDED.to_number,
    to_parcel_quantity = EXCLUDED.to_parcel_quantity,
    loaded_timestamp = EXCLUDED.loaded_timestamp,
    operator_raw = EXCLUDED.operator_raw,
    operator_ops_id = COALESCE(EXCLUDED.operator_ops_id, dispatch_google_sheet_rows.operator_ops_id),
    operator_name = COALESCE(EXCLUDED.operator_name, dispatch_google_sheet_rows.operator_name),
    departure_timestamp = EXCLUDED.departure_timestamp,
    truck_size = EXCLUDED.truck_size,
    vehicle_number = EXCLUDED.vehicle_number,
    driver_name = EXCLUDED.driver_name,
    raw_payload = EXCLUDED.raw_payload,
    updated_at = NOW();
`

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function toStringValue(value: unknown) {
  if (value === null || value === undefined) return ""
  return String(value).trim()
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
  let operatorRaw = operatorValue || null

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

  const response = await fetch(url.toString())
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

function rowsFromBody(body: any): RawRow[] | null {
  if (!body || !Array.isArray(body.rows)) return null
  const rows = body.rows as unknown[]
  if (rows.length === 0) return []

  if (Array.isArray(rows[0])) {
    const headerSource = Array.isArray(body.headers) ? body.headers : (rows[0] as unknown[])
    const headers = headerSource.map((header) => toStringValue(header))
    const dataRows = Array.isArray(body.headers) ? rows : rows.slice(1)
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
  for (const row of rows) {
    await query(SHEET_UPSERT_SQL, [
      row.rowKey,
      row.dispatchDate,
      row.origin,
      row.toDestStationName,
      row.tripNumber,
      row.toNumber,
      row.toParcelQuantity,
      row.loadedTimestamp,
      row.operatorRaw,
      row.operatorOpsId,
      row.operatorName,
      row.departureTimestamp,
      row.truckSize,
      row.vehicleNumber,
      row.driverName,
      JSON.stringify(row.rawPayload),
    ])
  }
}

export async function POST(request: Request) {
  if (process.env.FEATURE_GOOGLE_SHEETS_SYNC === "false") {
    return NextResponse.json({ error: "Google Sheets sync is disabled" }, { status: 403 })
  }

  const secret = process.env.WEBHOOK_SECRET
  const { searchParams } = new URL(request.url)
  const providedSecret = request.headers.get("x-webhook-secret") || searchParams.get("secret")
  if (secret && providedSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
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

  return NextResponse.json({
    synced: sheetRows.length,
    ignored: rawRows.length - sheetRows.length,
  })
}
