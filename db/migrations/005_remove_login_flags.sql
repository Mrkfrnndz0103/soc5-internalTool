ALTER TABLE users
  DROP COLUMN IF EXISTS is_first_time,
  DROP COLUMN IF EXISTS must_change_password;
