import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/server/db/prisma"

export const userSummarySelect = {
  opsId: true,
  name: true,
  role: true,
  email: true,
  department: true,
} satisfies Prisma.UserSelect

export type UserSummary = Prisma.UserGetPayload<{ select: typeof userSummarySelect }>

export async function getUserByOpsId(opsId: string) {
  return prisma.user.findUnique({
    where: { opsId },
    select: userSummarySelect,
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email },
    select: userSummarySelect,
  })
}

export async function listProcessors(queryText?: string) {
  return prisma.user.findMany({
    where: {
      role: "Processor",
      ...(queryText
        ? { name: { contains: queryText, mode: "insensitive" } }
        : undefined),
    },
    select: { name: true, opsId: true },
    orderBy: { name: "asc" },
    take: 10,
  })
}
