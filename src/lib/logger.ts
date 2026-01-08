import pino from "pino"

const level = process.env.LOG_LEVEL || "info"

export const logger = pino({
  level,
  base: {
    service: process.env.NEXT_PUBLIC_APP_NAME || "soc5-outbound",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})
