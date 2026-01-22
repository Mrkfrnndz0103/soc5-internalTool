import { NextResponse } from "next/server"
import { withRequestLogging } from "@/lib/request-context"
import { checkDatabase } from "@/server/repositories/health"

export const GET = withRequestLogging("/api/health/readiness", async () => {
  try {
    await checkDatabase()
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Database check failed" },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  )
})
