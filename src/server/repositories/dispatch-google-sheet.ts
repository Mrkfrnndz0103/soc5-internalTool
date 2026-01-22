import "server-only"
import { prisma } from "@/server/db/prisma"
import type { JsonValue } from "@/lib/json-types"

export type DispatchSheetRowInput = {
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
  rawPayload: JsonValue
}

export async function upsertDispatchSheetRows(rows: DispatchSheetRowInput[]) {
  if (rows.length === 0) return 0
  const batchSize = 100
  for (let start = 0; start < rows.length; start += batchSize) {
    const chunk = rows.slice(start, start + batchSize)
    await prisma.$transaction(
      chunk.map((row) =>
        prisma.dispatchGoogleSheetRow.upsert({
          where: { rowKey: row.rowKey },
          create: {
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
            rawPayload: row.rawPayload,
            updatedAt: new Date(),
          },
          update: {
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
            rawPayload: row.rawPayload,
            updatedAt: new Date(),
          },
        })
      )
    )
  }
  return rows.length
}

export type LhTripSummary = {
  lh_trip_number: string
  cluster_name: string | null
  station_name: string | null
  region: string | null
  count_of_to: string | null
  total_oid_loaded: number
  actual_docked_time: string | null
  dock_number: string | null
  actual_depart_time: string | null
  processor_name: string | null
  plate_number: string | null
  fleet_size: string | null
  assigned_ops_id: string | null
  source_updated_at: string | null
  updated_at: string | null
}

export async function getLhTripSummary(lhTrip: string): Promise<LhTripSummary | null> {
  type LhTripRow = {
    toDestStationName: string | null
    toNumber: string | null
    toParcelQuantity: number | null
    departureTimestamp: Date | null
    vehicleNumber: string | null
    truckSize: string | null
    dispatchDate: Date | null
    updatedAt: Date | null
  }

  const rows = (await prisma.dispatchGoogleSheetRow.findMany({
    where: { tripNumber: lhTrip },
    select: {
      toDestStationName: true,
      toNumber: true,
      toParcelQuantity: true,
      departureTimestamp: true,
      vehicleNumber: true,
      truckSize: true,
      dispatchDate: true,
      updatedAt: true,
    },
  })) as LhTripRow[]

  if (rows.length === 0) return null

  const uniqueToNumbers = new Set<string>()
  let totalOidLoaded = 0
  let stationName: string | null = null
  let departureTime: Date | null = null
  let plateNumber: string | null = null
  let fleetSize: string | null = null
  let sourceUpdatedAt: Date | null = null
  let updatedAt: Date | null = null

  const formatDate = (value: Date | null) => (value ? value.toISOString() : null)

  rows.forEach((row) => {
    if (row.toNumber) {
      uniqueToNumbers.add(row.toNumber)
    }
    if (typeof row.toParcelQuantity === "number") {
      totalOidLoaded += row.toParcelQuantity
    }
    if (!stationName && row.toDestStationName) {
      stationName = row.toDestStationName
    }
    if (!departureTime && row.departureTimestamp) {
      departureTime = row.departureTimestamp
    }
    if (!plateNumber && row.vehicleNumber) {
      plateNumber = row.vehicleNumber
    }
    if (!fleetSize && row.truckSize) {
      fleetSize = row.truckSize
    }
    if (!sourceUpdatedAt && row.dispatchDate) {
      sourceUpdatedAt = row.dispatchDate
    }
    if (!updatedAt && row.updatedAt) {
      updatedAt = row.updatedAt
    }
  })

  return {
    lh_trip_number: lhTrip,
    cluster_name: null,
    station_name: stationName,
    region: null,
    count_of_to: uniqueToNumbers.size ? Array.from(uniqueToNumbers).join(", ") : null,
    total_oid_loaded: totalOidLoaded,
    actual_docked_time: null,
    dock_number: null,
    actual_depart_time: formatDate(departureTime),
    processor_name: null,
    plate_number: plateNumber,
    fleet_size: fleetSize,
    assigned_ops_id: null,
    source_updated_at: formatDate(sourceUpdatedAt),
    updated_at: formatDate(updatedAt),
  }
}
