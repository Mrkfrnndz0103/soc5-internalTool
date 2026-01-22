# Render Deployment Guide (No Docker)

This project targets Render’s **Node** runtime (no Docker). Use the steps below to deploy safely and keep the service awake.

## 1) Service Setup

- **Runtime:** Node
- **Build command:** `npm run prisma:generate && npm run build`
- **Start command:** `npm run start`

## 2) Database Migrations (SQL)

Schema changes are tracked in `db/migrations`.

On deploy:
1) Set `DATABASE_URL` and `DATABASE_SSL`.
2) Run migrations:
   ```bash
   npm run db:migrate
   ```
3) Ensure Prisma client is generated:
   ```bash
   npm run prisma:generate
   ```

> Tip: You can add a Render “Shell” command or a one-time manual run to execute migrations after deploy.

## 3) Required Environment Variables

Required:
- `DATABASE_URL`
- `DATABASE_SSL` (true/false)
- `SESSION_TTL_HOURS`
- `SESSION_REFRESH_MINUTES`
- `COOKIE_SECURE` (true in production)
- `COOKIE_DOMAIN` (your Render domain)

Recommended:
- `SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_ENVIRONMENT`
- `LOG_LEVEL`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX_REQUESTS`
- `WEBHOOK_RATE_LIMIT_WINDOW_MS`
- `WEBHOOK_RATE_LIMIT_MAX_REQUESTS`
- `METRICS_TOKEN` (protect `/api/metrics`)

Optional:
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_VERSION`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS`
- `NEXT_PUBLIC_SEATALK_ENABLED`
- `NEXT_PUBLIC_MODULES_DISABLED`

## 4) Keep‑Awake Ping (Prevent Render Sleep)

Use a **Render Cron Job** or an external uptime monitor to hit a lightweight endpoint.

Preferred (Render Cron Job):
- Endpoint: `GET /api/ping` or `GET /api/health/liveness`
- Schedule: every 10–15 minutes

Alternative (External Monitor):
- Use a service like UptimeRobot to ping the same endpoint.

Endpoints are safe and lightweight, returning only `{ status: "ok", timestamp }`.

## 5) Health & Metrics

- **Readiness:** `GET /api/health` or `GET /api/health/readiness` (DB check)
- **Liveness:** `GET /api/health/liveness`
- **Metrics:** `GET /api/metrics` (requires Admin session or `METRICS_TOKEN`)

## 6) Deploy Hook (Optional CI/CD)

If you enable a Render Deploy Hook:
- Add the hook URL as `RENDER_DEPLOY_HOOK` in GitHub Secrets.
- The workflow `.github/workflows/deploy-render.yml` will trigger deploys on `main`.

Last Updated: 2026-01-22
