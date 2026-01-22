import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRequestLogging } from "@/lib/request-context"
import { getMetricsSnapshot } from "@/server/metrics"

export const GET = withRequestLogging("/api/metrics", async (request: Request) => {
  const token = process.env.METRICS_TOKEN
  const { searchParams } = new URL(request.url)
  const provided = request.headers.get("authorization")?.replace("Bearer ", "") || searchParams.get("token")

  if (token) {
    if (provided !== token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return NextResponse.json(getMetricsSnapshot(), {
    headers: { "Cache-Control": "no-store" },
  })
})
