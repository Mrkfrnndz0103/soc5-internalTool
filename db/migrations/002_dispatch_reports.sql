CREATE TABLE IF NOT EXISTS dispatch_reports (
  dispatch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_name TEXT,
  station_name TEXT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  lh_trip_number TEXT,
  actual_docked_time TIMESTAMPTZ,
  actual_depart_time TIMESTAMPTZ,
  processor_name TEXT,
  plate_number TEXT,
  submitted_by_ops_id TEXT,
  assigned_data_team_ops_id TEXT,
  acknowledged_by_ops_id TEXT,
  acknowledged_at TIMESTAMPTZ,
  confirmed_by_ops_id TEXT,
  confirmed_at TIMESTAMPTZ,
  pending_edit_reason TEXT,
  edit_count INTEGER NOT NULL DEFAULT 0,
  status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_reports_status ON dispatch_reports (status);
CREATE INDEX IF NOT EXISTS idx_dispatch_reports_created_at ON dispatch_reports (created_at);
CREATE INDEX IF NOT EXISTS idx_dispatch_reports_region ON dispatch_reports (region);
