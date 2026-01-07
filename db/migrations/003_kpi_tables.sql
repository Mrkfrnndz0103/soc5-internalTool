CREATE TABLE IF NOT EXISTS kpi_mdt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  mdt_score NUMERIC,
  target NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_workstation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  workstation TEXT,
  utilization NUMERIC,
  efficiency NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_productivity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE,
  daily_average NUMERIC,
  weekly_average NUMERIC,
  monthly_total NUMERIC,
  trend TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_intraday (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE,
  hour INTEGER,
  dispatches INTEGER,
  volume INTEGER,
  timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_mdt_date ON kpi_mdt (date);
CREATE INDEX IF NOT EXISTS idx_kpi_workstation_date ON kpi_workstation (date);
CREATE INDEX IF NOT EXISTS idx_kpi_productivity_date ON kpi_productivity (date);
CREATE INDEX IF NOT EXISTS idx_kpi_intraday_date ON kpi_intraday (date);
