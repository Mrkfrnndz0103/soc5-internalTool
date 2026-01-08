CREATE TABLE IF NOT EXISTS dispatch_google_sheet_rows (
  row_key TEXT PRIMARY KEY,
  dispatch_date DATE,
  origin TEXT,
  to_dest_station_name TEXT,
  trip_number TEXT NOT NULL,
  to_number TEXT,
  to_parcel_quantity INTEGER,
  loaded_timestamp TIMESTAMPTZ,
  operator_raw TEXT,
  operator_ops_id TEXT,
  operator_name TEXT,
  departure_timestamp TIMESTAMPTZ,
  truck_size TEXT,
  vehicle_number TEXT,
  driver_name TEXT,
  raw_payload JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_google_sheet_rows_trip_number
  ON dispatch_google_sheet_rows (trip_number);

CREATE INDEX IF NOT EXISTS idx_dispatch_google_sheet_rows_dispatch_date
  ON dispatch_google_sheet_rows (dispatch_date);
