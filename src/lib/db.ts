import "server-only"
import { Pool } from "pg"
import { getRequestContext } from "@/lib/request-context"
import { logger } from "@/lib/logger"

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const sslEnabled = process.env.DATABASE_SSL === "true"

type DbClient = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number | null }>
  release: () => void
}

type PoolWithConnect = Pool & { connect: () => Promise<DbClient> }

const pool =
  globalThis.__pgPool ||
  new Pool({
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  })

const poolWithConnect = pool as PoolWithConnect

if (!globalThis.__pgPool) {
  globalThis.__pgPool = pool
}

export async function query<T = any>(text: string, params?: any[]) {
  const start = Date.now()
  const requestContext = getRequestContext()
  const route = requestContext?.route ?? "unknown"
  const requestId = requestContext?.requestId

  try {
    const result = await pool.query<T>(text, params)
    const rowCount = (result as { rowCount?: number | null }).rowCount
    const rows = typeof rowCount === "number" ? rowCount : result.rows?.length ?? 0
    const ms = Date.now() - start
    logger.info({ type: "db.query", route, requestId, ms, rows }, "db.query")
    return result
  } catch (error) {
    const ms = Date.now() - start
    const message = error instanceof Error ? error.message : String(error)
    logger.error({ type: "db.query.error", route, requestId, ms, error: message }, "db.query.error")
    throw error
  }
}

function createLoggedClient(client: DbClient) {
  return {
    query: async (text: string, params?: any[]) => {
      const start = Date.now()
      const requestContext = getRequestContext()
      const route = requestContext?.route ?? "unknown"
      const requestId = requestContext?.requestId
      try {
        const result = await client.query(text, params)
        const rowCount = (result as { rowCount?: number | null }).rowCount
        const rows = typeof rowCount === "number" ? rowCount : result.rows?.length ?? 0
        const ms = Date.now() - start
        logger.info({ type: "db.query", route, requestId, ms, rows }, "db.query")
        return result
      } catch (error) {
        const ms = Date.now() - start
        const message = error instanceof Error ? error.message : String(error)
        logger.error({ type: "db.query.error", route, requestId, ms, error: message }, "db.query.error")
        throw error
      }
    },
    release: () => client.release(),
  }
}

export async function withTransaction<T>(fn: (client: DbClient) => Promise<T>) {
  const client = await poolWithConnect.connect()
  const loggedClient = createLoggedClient(client)

  try {
    await loggedClient.query("BEGIN")
    const result = await fn(loggedClient)
    await loggedClient.query("COMMIT")
    return result
  } catch (error) {
    try {
      await loggedClient.query("ROLLBACK")
    } catch {}
    throw error
  } finally {
    client.release()
  }
}
