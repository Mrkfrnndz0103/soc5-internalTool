import "server-only"
import { prisma } from "@/server/db/prisma"
import { userSummarySelect } from "@/server/repositories/users"

export async function createAuthSession(opsId: string, expiresAt: Date) {
  return prisma.authSession.create({
    data: {
      opsId,
      expiresAt,
    },
  })
}

export async function getAuthSessionWithUser(sessionId: string, now: Date) {
  return prisma.authSession.findFirst({
    where: {
      sessionId,
      expiresAt: { gt: now },
    },
    include: {
      user: {
        select: userSummarySelect,
      },
    },
  })
}

export async function getActiveAuthSession(sessionId: string, now: Date) {
  return prisma.authSession.findFirst({
    where: {
      sessionId,
      expiresAt: { gt: now },
    },
    select: { sessionId: true },
  })
}

export async function deleteAuthSession(sessionId: string) {
  await prisma.authSession.deleteMany({ where: { sessionId } })
}

export async function updateAuthSessionLastSeen(sessionId: string, lastSeenAt: Date) {
  await prisma.authSession.updateMany({
    where: { sessionId },
    data: { lastSeenAt },
  })
}
