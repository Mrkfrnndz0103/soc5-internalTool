import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/server/db/prisma"
import {
  DEFAULT_DISPATCH_FIELDS,
  DISPATCH_FIELD_MAP,
  type DispatchField,
  serializeDispatchRow,
} from "@/server/repositories/dispatch-report-fields"
export { DEFAULT_DISPATCH_FIELDS, DISPATCH_FIELD_MAP, type DispatchField } from "@/server/repositories/dispatch-report-fields"

export type DispatchFilters = {
  status?: string
  region?: string
  startDate?: Date
  endDate?: Date
}

export type DispatchListOptions = {
  limit: number
  offset: number
  fields?: DispatchField[]
}

function buildDispatchSelect(fields?: DispatchField[]) {
  const requested = fields && fields.length > 0 ? fields : [...DEFAULT_DISPATCH_FIELDS]
  const select: Prisma.DispatchReportSelect = {}
  requested.forEach((field) => {
    const prismaKey = DISPATCH_FIELD_MAP[field] as keyof Prisma.DispatchReportSelect
    select[prismaKey] = true
  })
  return { select, fields: requested }
}

function buildWhere(filters: DispatchFilters) {
  const where: Prisma.DispatchReportWhereInput = {}
  if (filters.status) {
    where.status = filters.status
  }
  if (filters.region) {
    where.region = filters.region
  }
  if (filters.startDate || filters.endDate) {
    where.createdAt = {
      ...(filters.startDate ? { gte: filters.startDate } : undefined),
      ...(filters.endDate ? { lte: filters.endDate } : undefined),
    }
  }
  return where
}

export async function listDispatchReports(filters: DispatchFilters, options: DispatchListOptions) {
  const where = buildWhere(filters)
  const { select, fields } = buildDispatchSelect(options.fields)
  const [total, rows] = await prisma.$transaction([
    prisma.dispatchReport.count({ where }),
    prisma.dispatchReport.findMany({
      where,
      select,
      orderBy: { createdAt: "desc" },
      take: options.limit,
      skip: options.offset,
    }),
  ])

  const serialized = rows.map((row: Record<string, unknown>) =>
    serializeDispatchRow(row as Record<string, unknown>, fields)
  )
  return { total, rows: serialized }
}

export type DispatchSubmitRow = {
  clusterName: string
  stationName: string
  region: string
  countOfTo: string
  totalOidLoaded: number
  dockNumber: string
  dockConfirmed: boolean
  status: string
  lhTrip: string | null
  dockedTime: Date
  departTime: Date | null
  processor: string | null
  plate: string | null
  fleetSize: string | null
  assignedOpsId: string
}

export async function createDispatchReports(rows: DispatchSubmitRow[], submittedByOpsId: string) {
  if (rows.length === 0) return { created: 0 }
  const data = rows.map((row) => ({
    clusterName: row.clusterName,
    stationName: row.stationName,
    region: row.region,
    countOfTo: row.countOfTo,
    totalOidLoaded: row.totalOidLoaded,
    dockNumber: row.dockNumber,
    dockConfirmed: row.dockConfirmed,
    status: row.status,
    lhTripNumber: row.lhTrip,
    actualDockedTime: row.dockedTime,
    actualDepartTime: row.departTime,
    processorName: row.processor,
    plateNumber: row.plate,
    fleetSize: row.fleetSize,
    assignedOpsId: row.assignedOpsId,
    submittedByOpsId,
  }))

  const result = await prisma.dispatchReport.createMany({
    data,
  })
  return { created: result.count }
}

export async function confirmDispatchReports(ids: string[], confirmedByOpsId: string) {
  if (ids.length === 0) return { updated: 0 }
  const result = await prisma.dispatchReport.updateMany({
    where: { dispatchId: { in: ids } },
    data: {
      status: "Confirmed",
      confirmedByOpsId,
      confirmedAt: new Date(),
      statusUpdatedAt: new Date(),
    },
  })
  return { updated: result.count }
}
