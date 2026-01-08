ALTER TABLE seatalk_sessions
  ADD COLUMN IF NOT EXISTS auth_session_id UUID REFERENCES auth_sessions(session_id) ON DELETE SET NULL;
