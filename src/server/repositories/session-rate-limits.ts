import "server-only"
import { prisma } from "@/server/db/prisma"

export type RateLimitRecord = {
  count: number
  expiresAt: Date
}

export async function getSessionRateLimit(sessionId: string): Promise<RateLimitRecord | null> {
  const record = await prisma.sessionRateLimit.findUnique({
    where: { sessionId },
    select: { count: true, expiresAt: true },
  })
  return record ? { count: record.count, expiresAt: record.expiresAt } : null
}

export async function resetSessionRateLimit(sessionId: string, expiresAt: Date) {
  await prisma.sessionRateLimit.upsert({
    where: { sessionId },
    create: { sessionId, count: 1, expiresAt },
    update: { count: 1, expiresAt },
  })
}

export async function incrementSessionRateLimit(sessionId: string) {
  const updated = await prisma.sessionRateLimit.update({
    where: { sessionId },
    data: { count: { increment: 1 } },
    select: { count: true, expiresAt: true },
  })
  return updated
}
