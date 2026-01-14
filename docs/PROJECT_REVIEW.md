# Project Review - soc5-internalTool

Review date: 2026-01-09

This review summarizes potential errors, risks, and improvement opportunities observed in the current codebase. It also includes fix recommendations and general suggestions.

## Key Findings (Potential Errors / Risks)

1. **Client-supplied identity fields are trusted**
   - `src/app/api/dispatch/submit/route.ts` accepts `submitted_by_ops_id` from the request body.
   - `src/app/api/dispatch/verify/route.ts` accepts `verified_by_ops_id` from the request body.
   - Risk: authenticated users can spoof who submitted or verified a dispatch.

2. **Dispatch submission validates fields that are never persisted**
   - UI submits and API validates `count_of_to`, `total_oid_loaded`, `dock_number`, `dock_confirmed`, `fleet_size`, `assigned_ops_id`.
   - `dispatch_reports` table (per `db/migrations/002_dispatch_reports.sql`) does not include those columns, and insert only stores a subset.
   - Risk: data loss and inconsistent behavior between UI and backend.

3. **Hub mutation endpoints lack role-based authorization**
   - `src/app/api/hubs/route.ts` and `src/app/api/hubs/[id]/route.ts` only check for a session.
   - Risk: any authenticated user can create/update/soft-delete hubs.

4. **Google Sheets sync webhook may be open**
   - `src/app/api/sync/google-sheets/route.ts` only checks `WEBHOOK_SECRET` if it is set.
   - Risk: endpoint is public if secret is not configured.

5. **Status naming mismatch in monitoring**
   - Backend sets `Confirmed` while monitoring UI counts `Completed`/`Verified`.
   - Risk: confirmed rows are not reflected in monitoring stats/badges.

6. **Submit error shape mismatch**
   - UI expects `response.details.rows`, API returns `results`.
   - Risk: per-row validation errors are not displayed in the UI.

7. **Stray glyph in dispatch monitoring UI**
   - `src/screens/dispatch-monitoring.tsx` contains a corrupted delimiter string.
   - Risk: user-facing UI artifact, possible encoding issue.

8. **Duplicate migration prefixes**
   - `db/migrations/002_auth_sessions.sql` and `db/migrations/002_dispatch_reports.sql` share the same prefix.
   - Risk: confusion when tracking migration order; minor operational risk.

## Fix Recommendations

1. **Derive identity from session**
   - In dispatch submit and verify routes, use `getSession()` for `submitted_by_ops_id` and `verified_by_ops_id`.
   - Ignore or reject client-supplied values for those fields.

2. **Align dispatch schema, API, and UI**
   - Option A: add missing columns to `dispatch_reports` and update insert logic to persist all validated fields.
   - Option B: remove unused fields from UI payload and validation if they are not meant to be stored.

3. **Enforce role-based access control**
   - Add role checks for hub management and dispatch verification routes (for example: Admin or Data Team).

4. **Fail closed for webhook**
   - Require `WEBHOOK_SECRET` in production and return 500 if unset.
   - Alternatively disable the route unless a secret is configured.

5. **Normalize status enums**
   - Decide on the canonical status name (Confirmed vs Completed/Verified).
   - Update UI and API to use the same values consistently.

6. **Match error response shape**
   - Update UI to read `response.data.results` or update API to include `details.rows`.
   - Ensure per-row validation errors surface properly.

7. **Clean UI artifacts**
   - Replace corrupted delimiter string in `dispatch-monitoring.tsx` with a plain separator.

8. **Standardize migration naming**
   - Rename duplicate-numbered migrations and adjust documentation to avoid ordering ambiguity.

## Suggestions (Quality, Reliability, and Maintainability)

1. Add tests around auth and role gating for API routes that mutate data.
2. Add integration tests for dispatch submit/verify flows and error handling.
3. Consider rate limiting for other high-traffic routes beyond auth and dispatch submit.
4. Add structured error codes for UI to handle known validation failures cleanly.
5. Add seed fixtures or a dev data script for UI testing.
6. Document environment variables and required secrets clearly in `README.md`.

## Notes

This review is based on static inspection only. No runtime tests or migrations were executed.

Last Updated: 2026-01-14
