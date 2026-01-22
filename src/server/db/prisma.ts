import "server-only"
import { PrismaClient } from "@prisma/client"
import type { Prisma } from "@prisma/client"
import { logger } from "@/lib/logger"
import { recordDbQuery } from "@/lib/request-context"

type PrismaEvent = "query" | "error" | "warn"
type PrismaClientWithEvents = PrismaClient<Prisma.PrismaClientOptions, PrismaEvent>

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClientWithEvents
  prismaEventsAttached?: boolean
}

const globalForPrisma = globalThis as PrismaGlobal

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient<Prisma.PrismaClientOptions, PrismaEvent>({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  })

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

if (!globalForPrisma.prismaEventsAttached) {
  const slowQueryMs = Number(process.env.DB_SLOW_QUERY_MS || "200")

  prisma.$on("query", (event: Prisma.QueryEvent) => {
    recordDbQuery(event.duration)
    if (Number.isFinite(slowQueryMs) && event.duration >= slowQueryMs) {
      logger.warn(
        { type: "db.slow_query", durationMs: event.duration, target: event.target },
        "db.slow_query"
      )
    }
  })

  prisma.$on("error", (event: Prisma.LogEvent) => {
    logger.error({ type: "db.error", message: event.message, target: event.target }, "db.error")
  })

  prisma.$on("warn", (event: Prisma.LogEvent) => {
    logger.warn({ type: "db.warn", message: event.message, target: event.target }, "db.warn")
  })

  globalForPrisma.prismaEventsAttached = true
}

export { prisma }
