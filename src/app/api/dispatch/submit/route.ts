import { NextResponse } from "next/server"
import { withTransaction } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { enforceSessionRateLimit } from "@/lib/rate-limit"
import { parseRequestJson } from "@/lib/validation"
import { z } from "zod"

const MAX_ROWS = 10
const LH_TRIP_REGEX = /^LT[A-Z0-9]+$/
const PLATE_REGEX = /^[A-Z0-9\s-]+$/

const submitSchema = z
  .object({
    rows: z
      .array(z.any(), { required_error: "rows are required" })
      .min(1, "rows are required")
      .max(MAX_ROWS, `rows must be <= ${MAX_ROWS}`),
    submitted_by_ops_id: z
      .string({ required_error: "submitted_by_ops_id is required" })
      .trim()
      .min(1, "submitted_by_ops_id is required"),
  })
  .strict()

function pickValue(row: any, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key]
    }
  }
  return null
}

function toTrimmedString(value: unknown) {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

function parseBoolean(value: unknown) {
  if (value === true) return true
  if (value === false) return false
  if (value === 1 || value === "1") return true
  if (value === 0 || value === "0") return false
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }
  return false
}

function parseInteger(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const normalized = typeof value === "string" ? value.replace(/,/g, "").trim() : value
  const numberValue = typeof normalized === "number" ? normalized : Number(normalized)
  if (!Number.isFinite(numberValue) || !Number.isInteger(numberValue)) return null
  return numberValue
}

function parseDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const parsed = new Date(value as string)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export const POST = withRequestLogging("/api/dispatch/submit", async (request: Request) => {
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

  const parsed = await parseRequestJson(request, submitSchema)
  if (parsed.errorResponse) return parsed.errorResponse
  const rows = parsed.data.rows
  const submittedBy = parsed.data.submitted_by_ops_id

  const normalizedRows: Array<{
    clusterName: string
    stationName: string
    region: string
    status: string
    lhTrip: string | null
    dockedTime: Date
    departTime: Date | null
    processor: string | null
    plate: string | null
  }> = []
  const validationErrors: Array<{ rowIndex: number; id?: string; errors: Record<string, string> }> = []

  rows.forEach((row, index) => {
    const rowErrors: Record<string, string> = {}
    const rowId = typeof row?.id === "string" ? row.id : undefined

    const clusterName = toTrimmedString(pickValue(row, ["cluster_name", "clusterName"]))
    if (!clusterName) {
      rowErrors.cluster_name = "cluster_name is required"
    }

    const stationName = toTrimmedString(pickValue(row, ["station_name", "station", "stationName"]))
    if (!stationName) {
      rowErrors.station_name = "station_name is required"
    }

    const region = toTrimmedString(pickValue(row, ["region"]))
    if (!region) {
      rowErrors.region = "region is required"
    }

    const countOfTo = toTrimmedString(pickValue(row, ["count_of_to", "countTO", "countTo"]))
    if (!countOfTo) {
      rowErrors.count_of_to = "count_of_to is required"
    }

    const totalOidRaw = pickValue(row, ["total_oid_loaded", "totalOIDLoaded", "totalOidLoaded"])
    const totalOid = parseInteger(totalOidRaw)
    if (totalOidRaw === null || totalOidRaw === "" || totalOidRaw === undefined) {
      rowErrors.total_oid_loaded = "total_oid_loaded is required"
    } else if (totalOid === null || totalOid < 0) {
      rowErrors.total_oid_loaded = "total_oid_loaded must be an integer >= 0"
    }

    const dockNumber = toTrimmedString(pickValue(row, ["dock_number", "dockNumber"]))
    if (!dockNumber) {
      rowErrors.dock_number = "dock_number is required"
    }

    const dockConfirmedRaw = pickValue(row, ["dock_confirmed", "dockConfirmed"])
    if (!parseBoolean(dockConfirmedRaw)) {
      rowErrors.dock_confirmed = "dock_confirmed must be true"
    }

    const assignedOpsId = toTrimmedString(pickValue(row, ["assigned_ops_id", "assignedPIC", "assignedOpsId"]))
    if (!assignedOpsId) {
      rowErrors.assigned_ops_id = "assigned_ops_id is required"
    }

    const dockedTimeRaw = pickValue(row, ["actual_docked_time", "actualDockedTime"])
    const dockedTime = parseDate(dockedTimeRaw)
    if (!dockedTime) {
      rowErrors.actual_docked_time = "actual_docked_time is required"
    }

    const departTimeRaw = pickValue(row, ["actual_depart_time", "actualDepartTime"])
    const departTime = parseDate(departTimeRaw)
    if (departTimeRaw && !departTime) {
      rowErrors.actual_depart_time = "actual_depart_time must be a valid datetime"
    }
    if (dockedTime && departTime && departTime < dockedTime) {
      rowErrors.actual_depart_time = "actual_depart_time must be >= actual_docked_time"
    }

    const status = toTrimmedString(pickValue(row, ["status"])) || "Pending"

    const lhTripRaw = toTrimmedString(pickValue(row, ["lh_trip_number", "lh_trip", "lHTripNumber"]))
    const lhTrip = lhTripRaw ? lhTripRaw.toUpperCase() : ""
    if (lhTrip && !LH_TRIP_REGEX.test(lhTrip)) {
      rowErrors.lh_trip_number = "lh_trip_number must match ^LT[A-Z0-9]+$"
    }

    const plateRaw = toTrimmedString(pickValue(row, ["plate_number", "plateNumber"]))
    const plate = plateRaw ? plateRaw.toUpperCase() : ""
    if (plate && !PLATE_REGEX.test(plate)) {
      rowErrors.plate_number = "plate_number must match ^[A-Z0-9\\s-]+$"
    }

    const processor = toTrimmedString(pickValue(row, ["processor_name", "processorName"]))

    if (Object.keys(rowErrors).length > 0) {
      validationErrors.push({ rowIndex: index, id: rowId, errors: rowErrors })
      return
    }

    normalizedRows.push({
      clusterName,
      stationName,
      region,
      status,
      lhTrip: lhTrip || null,
      dockedTime: dockedTime as Date,
      departTime: departTime || null,
      processor: processor || null,
      plate: plate || null,
    })
  })

  if (validationErrors.length > 0) {
    const results = validationErrors.map((detail) => ({
      rowIndex: detail.rowIndex,
      status: "error",
      errors: detail.errors,
    }))
    return NextResponse.json({
      ok: false,
      error: "Validation failed",
      submitted: 0,
      failed: validationErrors.length,
      errors_count: validationErrors.length,
      results,
    })
  }

  const values: Array<string | Date | null> = []
  const rowValues = normalizedRows
    .map((row, rowIndex) => {
      const base = rowIndex * 10
      values.push(
        row.clusterName,
        row.stationName,
        row.region,
        row.status,
        row.lhTrip,
        row.dockedTime,
        row.departTime,
        row.processor,
        row.plate,
        submittedBy
      )
      const placeholders = Array.from({ length: 10 }, (_, index) => `$${base + index + 1}`).join(", ")
      return `(${placeholders}, NOW(), NOW())`
    })
    .join(", ")

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO dispatch_reports
       (cluster_name, station_name, region, status, lh_trip_number, actual_docked_time, actual_depart_time, processor_name, plate_number, submitted_by_ops_id, created_at, status_updated_at)
       VALUES ${rowValues}`,
      values
    )
  })

  const results = normalizedRows.map((_, index) => ({
    rowIndex: index,
    status: "created",
  }))

  return NextResponse.json({
    ok: true,
    submitted: normalizedRows.length,
    failed: 0,
    created_count: normalizedRows.length,
    errors_count: 0,
    results,
  })
})
