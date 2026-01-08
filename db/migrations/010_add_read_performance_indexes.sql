-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dispatch_reports_created_status_region
  ON dispatch_reports (created_at, status, region);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpi_productivity_date
  ON kpi_productivity (date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outbound_map_active_hub_name
  ON outbound_map (active, hub_name);
