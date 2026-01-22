import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/server/db/prisma"

export type DateRangeFilter = {
  startDate?: string | null
  endDate?: string | null
}

function buildDateFilter(params: DateRangeFilter, field: "date" | "timestamp") {
  const filter: Prisma.DateTimeFilter = {}
  if (params.startDate) {
    const parsed = new Date(params.startDate)
    if (!Number.isNaN(parsed.getTime())) {
      filter.gte = parsed
    }
  }
  if (params.endDate) {
    const parsed = new Date(params.endDate)
    if (!Number.isNaN(parsed.getTime())) {
      filter.lte = parsed
    }
  }
  return Object.keys(filter).length ? { [field]: filter } : {}
}

export async function listKpiMdt(params: DateRangeFilter & { limit: number; offset: number }) {
  const where: Prisma.KpiMdtWhereInput = {
    ...buildDateFilter(params, "date"),
  }

  const [total, rows] = await prisma.$transaction([
    prisma.kpiMdt.count({ where }),
    prisma.kpiMdt.findMany({
      where,
      select: { date: true, mdtScore: true, target: true },
      orderBy: { date: "desc" },
      take: params.limit,
      skip: params.offset,
    }),
  ])

  return { total, rows }
}

export async function listKpiWorkstation(params: DateRangeFilter & { limit: number; offset: number }) {
  const where: Prisma.KpiWorkstationWhereInput = {
    ...buildDateFilter(params, "date"),
  }

  const [total, rows] = await prisma.$transaction([
    prisma.kpiWorkstation.count({ where }),
    prisma.kpiWorkstation.findMany({
      where,
      select: { date: true, workstation: true, utilization: true, efficiency: true },
      orderBy: { date: "desc" },
      take: params.limit,
      skip: params.offset,
    }),
  ])

  return { total, rows }
}

export async function listKpiProductivity(params: DateRangeFilter & { limit: number; offset: number }) {
  const where: Prisma.KpiProductivityWhereInput = {
    ...buildDateFilter(params, "date"),
  }

  const [total, rows] = await prisma.$transaction([
    prisma.kpiProductivity.count({ where }),
    prisma.kpiProductivity.findMany({
      where,
      select: { date: true, dailyAverage: true, weeklyAverage: true, monthlyTotal: true, trend: true },
      orderBy: { date: "desc" },
      take: params.limit,
      skip: params.offset,
    }),
  ])

  return { total, rows }
}

export async function listKpiIntraday(params: { date?: string | null; limit: number; offset: number }) {
  const where: Prisma.KpiIntradayWhereInput = {}
  if (params.date) {
    const parsed = new Date(params.date)
    if (!Number.isNaN(parsed.getTime())) {
      where.date = parsed
    }
  }

  const [total, rows] = await prisma.$transaction([
    prisma.kpiIntraday.count({ where }),
    prisma.kpiIntraday.findMany({
      where,
      select: { date: true, hour: true, dispatches: true, volume: true, timestamp: true },
      orderBy: { timestamp: "desc" },
      take: params.limit,
      skip: params.offset,
    }),
  ])

  return { total, rows }
}
