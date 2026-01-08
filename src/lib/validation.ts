import { NextResponse } from "next/server"
import { z } from "zod"

type ParsedJson<T> = { data: T; errorResponse?: undefined } | { data?: undefined; errorResponse: Response }

export async function parseRequestJson<T>(request: Request, schema: z.ZodSchema<T>): Promise<ParsedJson<T>> {
  const body = await request.json().catch(() => undefined)
  const parsed = schema.safeParse(body ?? {})
  if (!parsed.success) {
    const flattened = parsed.error.flatten()
    const message = parsed.error.errors[0]?.message || "Invalid request"
    return {
      errorResponse: NextResponse.json({ error: message, details: flattened }, { status: 400 }),
    }
  }
  return { data: parsed.data }
}
