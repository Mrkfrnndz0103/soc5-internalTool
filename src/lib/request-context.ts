import "server-only"
import { AsyncLocalStorage } from "node:async_hooks"
import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { captureException } from "@/lib/monitoring"

type RequestContext = {
  route: string
  requestId: string
}

const requestContext = new AsyncLocalStorage<RequestContext>()

export function getRequestContext() {
  return requestContext.getStore()
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

    return requestContext.run({ route, requestId }, async () => {
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
        logger.info({ type: "api.request", route, method, status, ms, requestId }, "api.request")
      }
    })
  }
}
