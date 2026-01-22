import { getUserByEmail, getUserByOpsId } from "@/server/repositories/users"
import { prisma } from "@/server/db/prisma"

jest.mock("@/server/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

const mockedPrisma = prisma as jest.Mocked<typeof prisma>

describe("users repository", () => {
  beforeEach(() => {
    mockedPrisma.user.findUnique.mockReset()
    mockedPrisma.user.findFirst.mockReset()
  })

  it("fetches user by opsId", async () => {
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null)
    await getUserByOpsId("OPS123")
    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { opsId: "OPS123" },
      select: expect.any(Object),
    })
  })

  it("fetches user by email", async () => {
    mockedPrisma.user.findFirst.mockResolvedValueOnce(null)
    await getUserByEmail("user@example.com")
    expect(mockedPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: expect.any(Object),
    })
  })
})
