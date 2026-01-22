import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/server/db/prisma"

export type HubPayload = {
  clusterName?: string | null
  hubName?: string | null
  region?: string | null
  dockNumber?: string | null
  active?: boolean
}

export type HubRecord = {
  id: string
  cluster_name: string | null
  hub_name: string | null
  region: string | null
  dock_number: string | null
  active: boolean
}

function toHubRecord(row: { id: string; clusterName: string | null; hubName: string | null; region: string | null; dockNumber: string | null; active: boolean }): HubRecord {
  return {
    id: row.id,
    cluster_name: row.clusterName,
    hub_name: row.hubName,
    region: row.region,
    dock_number: row.dockNumber,
    active: row.active,
  }
}

export async function listHubs(params: { active?: boolean; limit: number; offset: number }) {
  const where: Prisma.OutboundMapWhereInput = {}
  if (params.active !== undefined) {
    where.active = params.active
  }

  const [total, rows] = await prisma.$transaction([
    prisma.outboundMap.count({ where }),
    prisma.outboundMap.findMany({
      where,
      orderBy: { hubName: "asc" },
      skip: params.offset,
      take: params.limit,
    }),
  ])

  return { total, rows: rows.map(toHubRecord) }
}

export async function createHub(data: HubPayload) {
  const created = await prisma.outboundMap.create({ data })
  return toHubRecord(created)
}

export async function updateHub(id: string, data: HubPayload) {
  const updated = await prisma.outboundMap.updateMany({
    where: { id },
    data,
  })
  if (updated.count === 0) return null
  const result = await prisma.outboundMap.findUnique({ where: { id } })
  return result ? toHubRecord(result) : null
}

export async function deactivateHub(id: string) {
  const updated = await prisma.outboundMap.updateMany({
    where: { id },
    data: { active: false },
  })
  if (updated.count === 0) return null
  const result = await prisma.outboundMap.findUnique({ where: { id } })
  return result ? toHubRecord(result) : null
}

export async function listClusters(params: { region?: string; query?: string }) {
  const where: Prisma.OutboundMapWhereInput = { active: true }
  if (params.region) {
    where.region = params.region
  }
  if (params.query) {
    where.clusterName = { contains: params.query, mode: "insensitive" }
  }

  return prisma.outboundMap.findMany({
    where,
    select: { clusterName: true, region: true },
    distinct: ["clusterName", "region"],
    orderBy: { clusterName: "asc" },
  })
}

export async function listHubLookups(params: { cluster?: string }) {
  const where: Prisma.OutboundMapWhereInput = { active: true }
  if (params.cluster) {
    where.clusterName = params.cluster
  }
  return prisma.outboundMap.findMany({
    where,
    select: { hubName: true, dockNumber: true },
    orderBy: { hubName: "asc" },
  })
}
