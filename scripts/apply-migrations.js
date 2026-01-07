#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { Pool } from "pg"

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env")
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const index = trimmed.indexOf("=")
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

async function applyMigrations() {
  loadEnv()

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }

  const sslEnabled = process.env.DATABASE_SSL === "true"
  const pool = new Pool({
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  })

  const client = await pool.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    const migrationsDir = path.join(process.cwd(), "db", "migrations")
    if (!fs.existsSync(migrationsDir)) {
      throw new Error("Migrations directory not found: db/migrations")
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort()

    const appliedResult = await client.query("SELECT filename FROM schema_migrations")
    const applied = new Set(appliedResult.rows.map((row) => row.filename))

    let appliedCount = 0

    for (const file of files) {
      if (applied.has(file)) continue
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, "utf8").trim()
      if (!sql) continue

      console.log(`Applying ${file}...`)
      try {
        await client.query("BEGIN")
        await client.query(sql)
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file])
        await client.query("COMMIT")
        appliedCount += 1
      } catch (error) {
        await client.query("ROLLBACK")
        throw error
      }
    }

    if (appliedCount === 0) {
      console.log("No pending migrations.")
    } else {
      console.log(`Applied ${appliedCount} migration(s).`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

applyMigrations().catch((error) => {
  console.error("Migration failed:", error)
  process.exitCode = 1
})
