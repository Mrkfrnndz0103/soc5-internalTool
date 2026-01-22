import { NextResponse } from "next/server"
import { withRequestLogging } from "@/lib/request-context"
import { checkDatabase } from "@/server/repositories/health"

export const GET = withRequestLogging("/api/health", async (_request: Request) => {
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
      app: process.env.NEXT_PUBLIC_APP_NAME ?? "Outbound Internal Tool",
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
    },
    { headers: { "Cache-Control": "no-store" } }
  )
})
