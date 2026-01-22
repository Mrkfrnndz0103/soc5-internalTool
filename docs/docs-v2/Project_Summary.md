# Internal Tool System — Project Summary

## Project Goal
Build a **zero-cost**, **high-performance**, **reliable internal web application** using **only free tools**, **no Docker**, and **no admin rights**, with strong engineering and DevOps discipline.

The system must be:
- Fast (low latency, optimized database + frontend)
- Stable (linting, tests, controlled deployments)
- Secure (RBAC-ready, audit-friendly)
- Maintainable (clear structure, phased implementation)

---

## Constraints
- ❌ No Docker
- ❌ No admin/system installs
- ✅ User-space installations only
- ✅ Free tools only
- ✅ Latest stable dependency versions
- ✅ Step-by-step execution with tests after every step

---

## Tech Stack

### Runtime & Framework
- **Node.js** (user-space install, latest LTS)
- **Next.js** (App Router, TypeScript, latest stable)
- **React** (latest stable)

### Styling
- **Tailwind CSS**

### Database
- **SQLite**
- **Prisma ORM**
- Prisma schema in `prisma/schema.prisma` (source of truth)
- Prisma Client generated from `prisma/schema.prisma`

### Validation & Safety
- **Zod** (schema validation)
- **TypeScript** (strict typing)

### Testing
- **Jest**
- **@testing-library/react**
- **Playwright** (installed, not yet used)

### Code Quality
- **ESLint**
- **Prettier**
- Exact dependency versions enforced

### CI/CD
- **GitHub Actions (free tier)**

### Error Tracking
- **Sentry (free tier)**

---

## Project Structure

internal-tool/
|- prisma/
|  |- schema.prisma
|- src/
|  |- app/
|- .env
|- package.json
|- package-lock.json

---

## Database Schema

Core tables:
- users (ops_id PK, name, role, department, is_fte, email)
- outbound_map (hub/cluster map, active flag)
- auth_sessions + seatalk_sessions
- dispatch_reports + dispatch_report_edits
- dispatch_google_sheet_rows
- kpi_mdt, kpi_workstation, kpi_productivity, kpi_intraday

---

## Engineering Rules (Enforced)
- All dependencies installed using **latest stable versions**
- `npm outdated` used as a verification gate
- Tests must pass before moving to the next step
- No skipped phases
- No Docker, no admin installs
- Reproducible local setup

---

## Phased Implementation Plan

### Phase 0 — Foundation (IN PROGRESS)
- Node, Git, VS Code setup (user-level)
- Next.js project creation
- Prisma + SQLite integration
- Database schema defined
- ESLint, Prettier, Jest configured

**Status:**
Ready for CI checks (lint/typecheck/tests/build).

### Phase 1 — System Design
- Functional requirements definition
- Role-based access control design
- Module boundaries
- API and data flow design

---

### Phase 2 — Core Application
- Authentication (SSO or credentials)
- RBAC middleware
- Core CRUD workflows
- Zod validation
- Standard UI components

---

### Phase 3 — Reliability & Error Handling
- Centralized error handling
- Logging strategy
- Sentry integration
- Backup strategy

---

### Phase 4 — Performance Hardening
- Database indexing
- Query optimization
- Pagination
- HTTP caching
- Background jobs

---

### Phase 5 — Security
- Session hardening
- CSRF protection
- Rate limiting
- Audit logs

---

### Phase 6 — CI/CD
- GitHub Actions pipeline
- Lint + test gates
- Automated builds
- Safe deployment rules

---

### Phase 7 — Deployment
- Preferred: Render (free tier)
- Alternative: internal user-level Node process

---

### Phase 8 — Operations
- Monitoring
- Error budgets
- Release discipline
- Documentation

---

## Current Blocking Item
Before moving to Phase 1:

- Ensure CI (lint, typecheck, tests, build) passes.
