# Database_Setup_Guide

This guide is for SQLite (via Prisma).

## What You Need

- Node.js + npm
- SQLite (no server required)
- A terminal

## Local Setup

Step 1 - Set your database URL
Create `.env` and set:

```
DATABASE_URL="file:./dev.db"
```

Notes:
- The path in `file:...` is relative to `prisma/schema.prisma`.
- With `file:./dev.db`, the database file will be `prisma/dev.db`.

Step 2 - Generate Prisma client
```
npm run prisma:generate
```

Step 3 - Create the SQLite schema
Choose one of these approaches:

Option A (no migrations, fast local setup):
```
npx prisma db push
```

Option B (migrations):
```
npx prisma migrate dev --name init
```

## Prisma Notes

- This project uses Prisma Client for runtime access.
- Treat `prisma/schema.prisma` as the source of truth for the schema.

Last Updated: 2026-01-22
