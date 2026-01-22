import "server-only"
import { type DispatchSubmitRow } from "@/server/repositories/dispatch-reports"

const LH_TRIP_REGEX = /^LT[A-Z0-9]+$/
const PLATE_REGEX = /^[A-Z0-9\s-]+$/
const ALLOWED_STATUSES = new Set(["Pending", "Acknowledged", "Pending_Edit", "Confirmed", "Ongoing"])

export type DispatchValidationError = {
  rowIndex: number
  id?: string
  errors: Record<string, string>
}

function pickValue(row: Record<string, unknown>, keys: string[]) {
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
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export function normalizeDispatchRows(rows: Record<string, unknown>[]) {
  const normalizedRows: DispatchSubmitRow[] = []
  const validationErrors: DispatchValidationError[] = []

  rows.forEach((row, index) => {
    const rowErrors: Record<string, string> = {}
    const rowId = typeof row.id === "string" ? row.id : undefined

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

    const statusRaw = toTrimmedString(pickValue(row, ["status"]))
    const status = ALLOWED_STATUSES.has(statusRaw) ? statusRaw : "Pending"

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
    const fleetSize = toTrimmedString(pickValue(row, ["fleet_size", "fleetSize"]))

    if (Object.keys(rowErrors).length > 0) {
      validationErrors.push({ rowIndex: index, id: rowId, errors: rowErrors })
      return
    }

    normalizedRows.push({
      clusterName,
      stationName,
      region,
      countOfTo,
      totalOidLoaded: totalOid as number,
      dockNumber,
      dockConfirmed: parseBoolean(dockConfirmedRaw),
      status,
      lhTrip: lhTrip || null,
      dockedTime: dockedTime as Date,
      departTime: departTime || null,
      processor: processor || null,
      plate: plate || null,
      fleetSize: fleetSize || null,
      assignedOpsId,
    })
  })

  return { normalizedRows, validationErrors }
}
