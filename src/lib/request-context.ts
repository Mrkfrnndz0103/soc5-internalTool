import "server-only"
import { AsyncLocalStorage } from "node:async_hooks"
import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { captureException } from "@/lib/monitoring"

type RequestContext = {
  route: string
  requestId: string
  metrics: {
    dbMs: number
    dbQueries: number
  }
}

const requestContext = new AsyncLocalStorage<RequestContext>()

export function getRequestContext() {
  return requestContext.getStore()
}

export function recordDbQuery(durationMs: number) {
  const context = requestContext.getStore()
  if (!context) return
  context.metrics.dbMs += durationMs
  context.metrics.dbQueries += 1
}

type RouteHandler<TContext> = (request: Request, context: TContext) => Promise<Response> | Response

export function withRequestLogging(route: string, handler: RouteHandler<void>): (request: Request) => Promise<Response>
export function withRequestLogging<TContext>(
  route: string,
  handler: RouteHandler<TContext>
): (request: Request, context: TContext) => Promise<Response>
export function withRequestLogging<TContext>(
  route: string,
  handler: RouteHandler<TContext>
): (request: Request, context?: TContext) => Promise<Response> {
  return async function wrapped(request: Request, context?: TContext) {
    const start = Date.now()
    const method = request.method
    const requestId = request.headers.get("x-request-id") || randomUUID()
    const requestBudgetMs = Number(process.env.REQUEST_BUDGET_MS || "2000")
    const dbBudgetMs = Number(process.env.DB_BUDGET_MS || "1000")
    const dbQueryBudget = Number(process.env.DB_QUERY_BUDGET || "20")

    return requestContext.run({ route, requestId, metrics: { dbMs: 0, dbQueries: 0 } }, async () => {
      let status = 500
      try {
        const response = await handler(request, context as TContext)
        status = response.status
        response.headers.set("x-request-id", requestId)
        return response
      } catch (error) {
        logger.error({ err: error, route, method, requestId }, "api.error")
        captureException(error, { route, method, requestId })
        const response = NextResponse.json(
          { error: "Internal server error", request_id: requestId },
          { status: 500 }
        )
        response.headers.set("x-request-id", requestId)
        status = 500
        return response
      } finally {
        const ms = Date.now() - start
        const metrics = requestContext.getStore()?.metrics
        const dbMs = metrics?.dbMs || 0
        const dbQueries = metrics?.dbQueries || 0
        logger.info({ type: "api.request", route, method, status, ms, dbMs, dbQueries, requestId }, "api.request")

        if (
          (Number.isFinite(requestBudgetMs) && ms > requestBudgetMs) ||
          (Number.isFinite(dbBudgetMs) && dbMs > dbBudgetMs) ||
          (Number.isFinite(dbQueryBudget) && dbQueries > dbQueryBudget)
        ) {
          logger.warn(
            {
              type: "api.performance_budget",
              route,
              method,
              status,
              ms,
              dbMs,
              dbQueries,
              requestId,
              budget: {
                requestMs: requestBudgetMs,
                dbMs: dbBudgetMs,
                dbQueries: dbQueryBudget,
              },
            },
            "api.performance_budget"
          )
        }
      }
    })
  }
}
