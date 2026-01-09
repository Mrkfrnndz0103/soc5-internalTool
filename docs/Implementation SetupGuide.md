# Implementation SetupGuide

This guide is written for beginners. Follow the phases in order. Each phase ends with tests to confirm the work is correct before moving on.

## Phase 1 - Project Foundation

Goal: Create a clean Next.js base, confirm tooling works, and verify the app boots.

Step 1 - Install dependencies
1) Open a terminal at the project root.
2) Run: `npm install`

Step 2 - Verify project structure
1) Confirm these folders exist:
   - `src/app`
   - `src/components`
   - `src/screens`
   - `docs`
2) If any are missing, create them before continuing.

Step 3 - Verify base config
1) Confirm these files exist:
   - `next.config.mjs`
   - `tsconfig.json`
   - `tailwind.config.js`
   - `jest.config.cjs`
2) Open each file once to ensure they are not empty.

Step 4 - Run the dev server
1) Start dev server: `npm run dev`
2) Open `http://localhost:3000` in your browser.
3) You should be redirected to `/dashboard`.

Step 5 - Check the health endpoint
1) Open `http://localhost:3000/api/health`
2) You should see a JSON response with `status` and `timestamp`.

Tests for Phase 1
- `npm run build` (expect a successful build when env vars are set)
- `npm run test` (expect tests to pass or show a clear failure to fix)

---

## Phase 2 - Environment and Secrets

Goal: Configure runtime settings and ensure build-time variables are available.

Step 1 - Create environment file
1) Copy `.env.example` to `.env`.
2) Confirm the file exists at the project root.

Step 2 - Configure public variables
1) Set these values in `.env`:
   - `NEXT_PUBLIC_APP_NAME`
   - `NEXT_PUBLIC_APP_VERSION`
2) Use your real values (placeholders will cause runtime failures).

Step 3 - Configure server-only variables
1) Add `DATABASE_URL` for PostgreSQL connections.
2) Keep server-only values without the `NEXT_PUBLIC_` prefix.

Tests for Phase 2
- `npm run build` (should complete without missing env errors)
- Open `/api/health` (should return app name and version)

---

## Phase 3 - Layout and Routing Shell

Goal: Ensure the shared layout, navigation, and routing structure are stable.

Step 1 - Verify route structure
1) Check `src/app/(app)` for page folders.
2) Each route should contain a `page.tsx` file.

Step 2 - Confirm the main layout
1) Open `src/app/(app)/layout.tsx`.
2) It should wrap pages using the shared `Layout` component.

Step 3 - Validate navigation links
1) Open `src/components/sidebar.tsx`.
2) Confirm routes match the folders under `src/app/(app)`.

Step 4 - Confirm route content
1) Open a few pages:
   - `/dashboard`
   - `/outbound/dispatch-report`
   - `/outbound/dispatch-monitoring`
2) Each should render without a 404.

Tests for Phase 3
- `npm run build`
- Manual navigation through all sidebar links

---

## Phase 4 - Authentication and Session State

Goal: Ensure auth context is stable and persisted.

Step 1 - Review auth context
1) Open `src/contexts/auth-context.tsx`.
2) Confirm `user` and `token` are stored and loaded from localStorage.

Step 2 - Verify login modal behavior
1) Open the login screen component in `src/screens/login.tsx`.
2) Confirm the modal opens on every app load after a 1 second delay.
3) Confirm form inputs and error handling are present.

Step 3 - Verify layout user display
1) Open `src/components/layout.tsx`.
2) Confirm user name and role are shown in the header.

Tests for Phase 4
- `npm run test`
- Manual check: simulate login via mocked API or real auth

---

## Workflow Decisions (Confirmed)

- Login modal always appears on app load (after a 1 second delay), even if a session exists.
- `Pending` reports trigger alarm/blink for Data Team; `Pending_Edit` triggers alarm/blink for Ops PIC.
- `Pending_Edit` can happen multiple times and must be tracked with edit count/history.
- Data Team can take ownership; auto-assign when a report stays `Pending` for 5 minutes and Data Team users are logged in.
- CSV download is automatic for Data Team on `Confirm`, followed by Seatalk + email dispatch.

---

## Phase 5 - Dispatch Reporting

Goal: Implement the dispatch report workflow.

Step 1 - Review the dispatch report screen
1) Open `src/screens/dispatch-report.tsx`.
2) Confirm it renders the report table.

Step 2 - Review the table component
1) Open `src/components/dispatch-report-table.tsx`.
2) Confirm validation rules and autosave behavior.

Step 3 - Verify submit flow
1) Ensure `dispatchApi.submitRows` is used.
2) Confirm success and error notifications show correctly.
3) Confirm `Pending_Edit` resubmission returns the report to the Data Team queue.

Tests for Phase 5
- `npm run test`
- Manual submit with sample rows

---

## Phase 6 - Dispatch Monitoring

Goal: Display live dispatch status and summary cards.

Step 1 - Review monitoring screen
1) Open `src/screens/dispatch-monitoring.tsx`.
2) Confirm it fetches dispatches and renders status.

Step 2 - Verify status mapping
1) Check the status icon and badge color logic.
2) Ensure all expected statuses are covered.

Step 3 - Confirm refresh interval
1) Verify the polling interval is set.
2) Ensure the refresh button works.

Tests for Phase 6
- `npm run test`
- Manual refresh and status display check

---

## Phase 7 - Prealert and Data Team Workflows

Goal: Ensure prealert screens and data team tools render.

Step 1 - Open the prealert screen
1) Visit `/outbound/prealert`.
2) Confirm table and filters render.

Step 2 - Confirm data team routes
1) Visit `/data-team/prealert`.
2) Visit `/data-team/validation/stuckup` and `/data-team/validation/shortlanded`.

Step 3 - Validate Data Team actions
1) Confirm `Pending` rows show alarm/blink until acknowledged.
2) Confirm "Take Ownership" is available and persists the assignee.
3) Confirm auto-assign triggers after 5 minutes of `Pending` (with a logged-in Data Team user).
4) Confirm `Pending_Edit` sends the report back to Ops PIC and triggers alarm/blink for Ops PIC.
5) Confirm `Confirm` auto-downloads CSV.

Tests for Phase 7
- `npm run test`
- Manual route checks for each data team page

---

## Phase 8 - KPI and Admin Tools

Goal: Ensure KPI and Admin pages are present and ready for data integration.

Step 1 - KPI pages
1) Visit `/kpi/mdt`.
2) Visit `/kpi/workstation`.
3) Visit `/kpi/productivity`.
4) Visit `/kpi/intraday`.

Step 2 - Admin pages
1) Visit `/admin/attendance`.
2) Visit `/admin/masterfile`.
3) Visit `/admin/breaktime`.
4) Visit `/admin/leave`.
5) Visit `/admin/workstation`.

Tests for Phase 8
- `npm run test`
- Manual navigation to confirm each page renders

---

## Phase 9 - Database Integration (PostgreSQL + pgAdmin4)

Goal: Connect real data to the UI.

Step 1 - Configure database connection
1) Set `DATABASE_URL` in `.env`.
2) Restart the dev server.

Step 2 - Build a server-side data layer
1) Add a database helper file (for example `src/lib/db.ts`).
2) Define connection pooling and query helpers.

Step 3 - Replace legacy data access
1) Update API methods to call PostgreSQL API routes.
2) Keep the API method names consistent.

Tests for Phase 9
- `npm run test`
- Manual check: data-driven pages show real records

---

## Phase 10 - Testing, QA, and Release

Goal: Ensure the system is stable and ready for deployment.

Step 1 - Run unit tests
1) `npm run test`
2) Fix failures before continuing.

Step 2 - Run a full build
1) `npm run build`
2) Confirm no missing env errors.

Step 3 - Smoke test in production mode
1) `npm run start`
2) Visit key pages and confirm layout renders.

Tests for Phase 10
- `npm run test`
- `npm run build`
- Manual smoke test with `npm run start`

---

## Checklist Summary

- Phase 1: Base project runs
- Phase 2: Env configured
- Phase 3: Routing stable
- Phase 4: Auth stable
- Phase 5: Dispatch report works
- Phase 6: Monitoring works
- Phase 7: Prealert and data team routes render
- Phase 8: KPI and admin routes render
- Phase 9: Database integration complete
- Phase 10: Build + tests green

Last Updated: 2026-01-09
