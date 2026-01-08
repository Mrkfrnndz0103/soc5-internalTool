# Outbound Internal Tool

SOC5's outbound internal tool rebuilt as a full-stack Next.js application. The system centralizes dispatch reporting, real-time monitoring, KPI visibility, and admin workflows for the outbound operation.

![App overview](docs/images/overview.svg)

## What this product does

- Consolidates outbound reporting, monitoring, and operational visibility in one interface.
- Supports multi-role workflows (Outbound, Data Team, Admin, KPI/Compliance, Midmile).
- Provides real-time operational views with validated data entry and audit-friendly flows.
- Maintains a configurable theming system for day/night operations.

## Core capabilities

- Dispatch report entry with validation, autosave, and row-based submission flows.
- Live dispatch monitoring with status-driven KPIs.
- Prealert database search and filtering.
- KPI dashboards for MDT, workstation, productivity, and intraday analysis.
- Admin tools for attendance, masterfile, breaktime, leave, and workstation management.

## Architecture at a glance

- Frontend: Next.js App Router with client components for interactive sections.
- Backend: PostgreSQL with server-side access and typed client calls.
- Auth: Role-aware session handling with secure tokens.
- Observability: Health endpoint and structured logging hooks.

![Dispatch monitoring](docs/images/dispatch.svg)

## Status

- Core UI and navigation are in place.
- Data integration paths are defined in the API layer.
- Feature expansion continues per the phased plan.

Last Updated: 2026-01-08
