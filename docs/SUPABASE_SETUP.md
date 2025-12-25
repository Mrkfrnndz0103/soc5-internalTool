# Supabase Database Schema

## Tables

### 1. users
Stores user information for authentication and authorization.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ops_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('Backroom', 'FTE', 'Admin', 'Data Team')),
  password_hash TEXT,
  must_change_password BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_ops_id ON users(ops_id);
CREATE INDEX idx_users_role ON users(role);
```

### 2. outbound_map
Master data for clusters, hubs, and routing information.

```sql
CREATE TABLE outbound_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_name TEXT NOT NULL,
  hub_name TEXT NOT NULL,
  region TEXT NOT NULL,
  dock_number TEXT,
  station_code TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outbound_map_cluster ON outbound_map(cluster_name);
CREATE INDEX idx_outbound_map_region ON outbound_map(region);
CREATE INDEX idx_outbound_map_active ON outbound_map(active);
```

### 3. dispatch_reports
Main dispatch report entries submitted by users.

```sql
CREATE TABLE dispatch_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_sequence INTEGER,
  cluster_name TEXT NOT NULL,
  station_name TEXT NOT NULL,
  region TEXT NOT NULL,
  count_of_to INTEGER DEFAULT 0 CHECK (count_of_to >= 0),
  total_oid_loaded INTEGER DEFAULT 0 CHECK (total_oid_loaded >= 0),
  actual_docked_time TIMESTAMPTZ NOT NULL,
  dock_number TEXT NOT NULL,
  dock_confirmed BOOLEAN DEFAULT false,
  actual_depart_time TIMESTAMPTZ NOT NULL,
  processor_name TEXT NOT NULL,
  lh_trip TEXT CHECK (lh_trip ~ '^LT'),
  plate_number TEXT,
  fleet_size TEXT CHECK (fleet_size IN ('4WH', '6W', '6WF', '10WH', 'CV')),
  assigned_ops_id TEXT NOT NULL,
  assigned_ops_name TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Ongoing', 'Completed')),
  submitted_by_ops_id TEXT NOT NULL,
  verified_by_ops_id TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT depart_after_dock CHECK (actual_depart_time >= actual_docked_time)
);

CREATE INDEX idx_dispatch_reports_status ON dispatch_reports(status);
CREATE INDEX idx_dispatch_reports_region ON dispatch_reports(region);
CREATE INDEX idx_dispatch_reports_created_at ON dispatch_reports(created_at);
CREATE INDEX idx_dispatch_reports_submitted_by ON dispatch_reports(submitted_by_ops_id);
```

### 4. KPI Tables (Synced from Google Sheets)

```sql
CREATE TABLE kpi_mdt (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  region TEXT,
  metric_name TEXT,
  metric_value NUMERIC,
  target_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kpi_workstation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  station_name TEXT,
  workstation_id TEXT,
  utilization_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kpi_productivity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  ops_id TEXT,
  packages_processed INTEGER,
  hours_worked NUMERIC,
  productivity_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kpi_intraday (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  metric_type TEXT,
  metric_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Database Functions

### 1. authenticate_user
Authenticates user with ops_id and password.

```sql
CREATE OR REPLACE FUNCTION authenticate_user(
  p_ops_id TEXT,
  p_password TEXT
)
RETURNS TABLE (
  user_data JSONB,
  token TEXT,
  must_change_password BOOLEAN
) AS $$
DECLARE
  v_user users;
  v_password_valid BOOLEAN;
BEGIN
  SELECT * INTO v_user FROM users WHERE ops_id = p_ops_id AND active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid credentials';
  END IF;
  
  -- Verify password (use pgcrypto for hashing)
  v_password_valid := (v_user.password_hash = crypt(p_password, v_user.password_hash));
  
  IF NOT v_password_valid THEN
    RAISE EXCEPTION 'Invalid credentials';
  END IF;
  
  RETURN QUERY SELECT 
    jsonb_build_object(
      'ops_id', v_user.ops_id,
      'name', v_user.name,
      'email', v_user.email,
      'role', v_user.role
    ),
    encode(gen_random_bytes(32), 'hex'),
    v_user.must_change_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. change_user_password
Changes user password.

```sql
CREATE OR REPLACE FUNCTION change_user_password(
  p_ops_id TEXT,
  p_old_password TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user users;
  v_password_valid BOOLEAN;
BEGIN
  SELECT * INTO v_user FROM users WHERE ops_id = p_ops_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  v_password_valid := (v_user.password_hash = crypt(p_old_password, v_user.password_hash));
  
  IF NOT v_password_valid THEN
    RAISE EXCEPTION 'Invalid old password';
  END IF;
  
  UPDATE users 
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      must_change_password = false,
      updated_at = NOW()
  WHERE ops_id = p_ops_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. verify_dispatch_rows
Verifies dispatch rows and triggers webhook to Google Sheets.

```sql
CREATE OR REPLACE FUNCTION verify_dispatch_rows(
  p_rows TEXT[],
  p_verified_by_ops_id TEXT,
  p_send_csv BOOLEAN DEFAULT false,
  p_send_mode TEXT DEFAULT 'per_batch'
)
RETURNS JSONB AS $$
DECLARE
  v_verified_count INTEGER := 0;
BEGIN
  UPDATE dispatch_reports
  SET status = 'Completed',
      verified_by_ops_id = p_verified_by_ops_id,
      verified_at = NOW(),
      updated_at = NOW()
  WHERE id = ANY(p_rows::UUID[])
    AND status = 'Pending';
  
  GET DIAGNOSTICS v_verified_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'verified_count', v_verified_count,
    'message', format('Successfully verified %s rows', v_verified_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Row Level Security (RLS)

Enable RLS for all tables:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_reports ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- All authenticated users can read outbound_map
CREATE POLICY outbound_map_select ON outbound_map
  FOR SELECT TO authenticated USING (true);

-- Users can insert dispatch reports
CREATE POLICY dispatch_reports_insert ON dispatch_reports
  FOR INSERT TO authenticated WITH CHECK (true);

-- Users can read dispatch reports
CREATE POLICY dispatch_reports_select ON dispatch_reports
  FOR SELECT TO authenticated USING (true);

-- Only Data Team can update dispatch reports
CREATE POLICY dispatch_reports_update ON dispatch_reports
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.ops_id = auth.jwt()->>'ops_id' 
      AND users.role = 'Data Team'
    )
  );
```

## Setup Instructions

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Copy project URL and anon key

2. **Run SQL Schema**
   - Open SQL Editor in Supabase Dashboard
   - Copy and paste all table creation scripts
   - Execute the scripts

3. **Enable Extensions**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

4. **Create Initial Admin User**
   ```sql
   INSERT INTO users (ops_id, name, role, password_hash, active)
   VALUES (
     'ADMIN001',
     'System Admin',
     'Admin',
     crypt('SOC5-Outbound', gen_salt('bf')),
     true
   );
   ```

5. **Update Environment Variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key

6. **Test Connection**
   - Run `npm install`
   - Run `npm run dev`
   - Try logging in with admin credentials
