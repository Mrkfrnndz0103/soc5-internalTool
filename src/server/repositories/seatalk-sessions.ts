import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/server/db/prisma"

const seatalkSessionSelect = {
  sessionId: true,
  email: true,
  authenticated: true,
  authSessionId: true,
} satisfies Prisma.SeatalkSessionSelect

export type SeatalkSessionSummary = Prisma.SeatalkSessionGetPayload<{ select: typeof seatalkSessionSelect }>

export async function getAuthenticatedSeatalkSession(sessionId: string) {
  return prisma.seatalkSession.findFirst({
    where: {
      sessionId,
      authenticated: true,
    },
    select: seatalkSessionSelect,
  })
}

export async function upsertSeatalkSession(sessionId: string) {
  return prisma.seatalkSession.upsert({
    where: { sessionId },
    create: {
      sessionId,
      authenticated: false,
    },
    update: {
      authenticated: false,
      email: null,
      authSessionId: null,
    },
  })
}

export async function linkSeatalkAuthSession(sessionId: string, authSessionId: string) {
  return prisma.seatalkSession.update({
    where: { sessionId },
    data: { authSessionId },
  })
}
