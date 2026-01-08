CREATE TABLE IF NOT EXISTS session_rate_limits (
  session_id UUID PRIMARY KEY REFERENCES auth_sessions(session_id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_rate_limits_expires_at
  ON session_rate_limits (expires_at);
