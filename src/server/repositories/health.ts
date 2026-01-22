import "server-only"
import { prisma } from "@/server/db/prisma"

export async function checkDatabase() {
  await prisma.$queryRaw`SELECT 1`
}
