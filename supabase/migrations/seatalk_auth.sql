-- SeaTalk Authentication Sessions Table
CREATE TABLE IF NOT EXISTS seatalk_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  email TEXT,
  authenticated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Index for fast session lookup
CREATE INDEX idx_seatalk_sessions_session_id ON seatalk_sessions(session_id);
CREATE INDEX idx_seatalk_sessions_expires_at ON seatalk_sessions(expires_at);

-- Auto-delete expired sessions
CREATE OR REPLACE FUNCTION delete_expired_seatalk_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM seatalk_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE seatalk_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for QR generation) and reads (for polling)
CREATE POLICY "Allow anonymous session creation" ON seatalk_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous session read" ON seatalk_sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous session update" ON seatalk_sessions
  FOR UPDATE TO anon USING (true);
