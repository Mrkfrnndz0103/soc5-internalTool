import "server-only"
import { Pool } from "pg"
import { getRequestContext } from "@/lib/request-context"

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const sslEnabled = process.env.DATABASE_SSL === "true"

const pool =
  globalThis.__pgPool ||
  new Pool({
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  })

if (!globalThis.__pgPool) {
  globalThis.__pgPool = pool
}

export async function query<T = any>(text: string, params?: any[]) {
  const start = Date.now()
  const route = getRequestContext()?.route ?? "unknown"

  try {
    const result = await pool.query<T>(text, params)
    const rowCount = (result as { rowCount?: number | null }).rowCount
    const rows = typeof rowCount === "number" ? rowCount : result.rows?.length ?? 0
    const ms = Date.now() - start
    console.log(JSON.stringify({ type: "db.query", route, ms, rows }))
    return result
  } catch (error) {
    const ms = Date.now() - start
    const message = error instanceof Error ? error.message : String(error)
    console.error(JSON.stringify({ type: "db.query.error", route, ms, error: message }))
    throw error
  }
}
