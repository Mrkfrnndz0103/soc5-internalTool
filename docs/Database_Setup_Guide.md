# Database_Setup_Guide

This guide is for **PostgreSQL + pgAdmin4** only. Supabase has been removed from the codebase. Use this document as the source of truth for database configuration.

## What You Need

- PostgreSQL 14+ (local or hosted)
- pgAdmin4
- A terminal

## Recommended Naming

- Database name: `soc5_outbound`
- App user: `soc5_app`
- App schema: `public` (default)

## Local Installation (Windows)

Step 1 - Install PostgreSQL
1) Download PostgreSQL from https://www.postgresql.org/download/windows/
2) Run the installer.
3) Set a **superuser password** (for the `postgres` user).
4) Keep default port `5432` unless you already use it.
5) Finish installation.

Step 2 - Install pgAdmin4
1) Download pgAdmin4 from https://www.pgadmin.org/download/
2) Install and open it.

## Local Database Setup

Step 1 - Create a database user
1) Open pgAdmin4.
2) Go to **Servers** -> **PostgreSQL** -> **Login/Group Roles**.
3) Right click -> **Create** -> **Login/Group Role**.
4) Name: `soc5_app`.
5) Set a strong password.
6) Permissions tab:
   - `Can login`: Yes
   - `Create DB`: No
   - `Superuser`: No
7) Save.

Step 2 - Create the database
1) Right click **Databases** -> **Create** -> **Database**.
2) Name: `soc5_outbound`.
3) Owner: `soc5_app`.
4) Save.

Step 3 - Confirm access
1) Open **Query Tool** on `soc5_outbound`.
2) Run:
   ```sql
   SELECT current_user, current_database();
   ```
3) Confirm the user and database are correct.

## Connection Details

- Host: `localhost`
- Port: `5432`
- Database: `soc5_outbound`
- User: `soc5_app`
- Password: your chosen password

## Environment Variables (Local)

Create `.env` and set:

```
DATABASE_URL=postgres://soc5_app:YOUR_PASSWORD@localhost:5432/soc5_outbound
DATABASE_SSL=false
```

Notes:
- `DATABASE_URL` is **server-only**. Do not use `NEXT_PUBLIC_` for it.
- Set `DATABASE_SSL=true` only if your provider requires SSL.
- If using a hosted database, replace `localhost` with your provider host.

## Prisma (Hybrid) Setup

This project uses **Prisma Client** for all runtime DB access, while keeping the existing SQL migrations in `db/migrations` as the source of truth.

Workflow:
1) Apply SQL migrations (manual or `npm run db:migrate`).
2) Keep `prisma/schema.prisma` aligned to the live schema (edit manually or run `npx prisma db pull`).
3) Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

> Note: We intentionally do **not** use Prisma migrations in this codebase yet to avoid double‑tracking schema changes. If you switch to Prisma migrations later, remove the SQL migration runner and adopt `prisma migrate`.

## Schema Plan (Detailed)

### users
- ops_id (text, primary key)
- name (text)
- role (text)
- department (text)
- is_fte (boolean)
- email (text)
Note: headers for CSV import should be `ops_id,name,role,department,is_fte,email`.

### dispatch_reports
- dispatch_id (uuid, primary key)
- cluster_name (text)
- station_name (text)
- region (text)
- status (text) -- Pending, Acknowledged, Pending_Edit, Confirmed
- lh_trip_number (text)
- actual_docked_time (timestamp)
- actual_depart_time (timestamp)
- processor_name (text)
- plate_number (text)
- count_of_to (text)
- total_oid_loaded (integer)
- dock_number (text)
- dock_confirmed (boolean)
- fleet_size (text)
- assigned_ops_id (text)
- submitted_by_ops_id (text)
- assigned_data_team_ops_id (text)
- acknowledged_by_ops_id (text)
- acknowledged_at (timestamp)
- confirmed_by_ops_id (text)
- confirmed_at (timestamp)
- pending_edit_reason (text)
- edit_count (integer)
- status_updated_at (timestamp)
- created_at (timestamp)

### dispatch_report_edits
- id (uuid, primary key)
- dispatch_id (uuid, foreign key to dispatch_reports.dispatch_id)
- editor_ops_id (text)
- edit_reason (text)
- edit_remarks (text)
- created_at (timestamp)

### outbound_map
- id (uuid, primary key)
- cluster_name (text)
- hub_name (text)
- region (text)
- dock_number (text)
- active (boolean)

### seatalk_sessions
- id (uuid, primary key)
- session_id (text, unique)
- email (text)
- authenticated (boolean)

### auth_sessions
- session_id (uuid, primary key)
- ops_id (text, foreign key to users.ops_id)
- created_at (timestamp)
- expires_at (timestamp)
- last_seen_at (timestamp)

### kpi_mdt, kpi_workstation, kpi_productivity, kpi_intraday
- use consistent date fields for filtering
- use numeric columns for metrics

## Migrations

Recommended structure:

```
db/
  migrations/
    001_init.sql
    002_dispatch_reports.sql
    003_kpi_tables.sql
    004_dispatch_workflow.sql
    005_remove_login_flags.sql
    006_remove_password_hash.sql
    007_users_ops_id_pk.sql
```

How to apply (manual):
1) Open pgAdmin Query Tool.
2) Run each file in order.
3) Record applied migration in a simple `schema_migrations` table.

How to apply (scripted):
1) Ensure `DATABASE_URL` is set in `.env`.
2) Run: `npm run db:migrate`

Non-transactional migrations:
- For operations that cannot run inside a transaction (e.g., `CREATE INDEX CONCURRENTLY`), add the filename to the allowlist in `scripts/apply-migrations.js`.
- The migration runner will skip `BEGIN/COMMIT` for those files.

Suggested updates for `004_dispatch_workflow.sql`:
- add `department` to `users`
- add ownership/ack/confirm fields + `status_updated_at` + `edit_count` to `dispatch_reports`
- create `dispatch_report_edits` for edit history (remarks, reason, timestamp, editor)

## Access Roles

Create a read-only role if needed:

```sql
CREATE ROLE soc5_readonly;
GRANT CONNECT ON DATABASE soc5_outbound TO soc5_readonly;
GRANT USAGE ON SCHEMA public TO soc5_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO soc5_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO soc5_readonly;
```

## Backups

Local backup with `pg_dump`:
```
pg_dump -U soc5_app -h localhost -p 5432 soc5_outbound > backup.sql
```

Restore:
```
psql -U soc5_app -h localhost -p 5432 soc5_outbound < backup.sql
```

## Common Errors

### Password authentication failed
- Confirm the user password in pgAdmin.
- Ensure `DATABASE_URL` is correct.

### Connection refused
- PostgreSQL service may be stopped.
- Start the PostgreSQL service and retry.

### Permission denied
- Ensure the user owns the database or has privileges.

Last Updated: 2026-01-22
