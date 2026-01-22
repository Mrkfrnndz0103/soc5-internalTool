import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { getUserByOpsId } from "@/server/repositories/users"

export const GET = withRequestLogging(
  "/api/users/ops/[ops_id]",
  async (_request: Request, { params }: { params: { ops_id: string } }) => {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByOpsId(params.ops_id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      ops_id: user.opsId,
      name: user.name,
      role: user.role,
      email: user.email,
      department: user.department,
    })
  }
)
