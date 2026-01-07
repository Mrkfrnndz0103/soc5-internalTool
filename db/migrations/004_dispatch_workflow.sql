ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE dispatch_reports
  ADD COLUMN IF NOT EXISTS assigned_data_team_ops_id TEXT,
  ADD COLUMN IF NOT EXISTS acknowledged_by_ops_id TEXT,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_by_ops_id TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pending_edit_reason TEXT,
  ADD COLUMN IF NOT EXISTS edit_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS dispatch_report_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES dispatch_reports(dispatch_id) ON DELETE CASCADE,
  editor_ops_id TEXT,
  edit_reason TEXT,
  edit_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_report_edits_dispatch_id ON dispatch_report_edits (dispatch_id);
