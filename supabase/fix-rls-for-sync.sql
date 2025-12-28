-- Fix RLS Policies for Google Sheets Sync
-- Run this in Supabase SQL Editor

-- 1. Create policy to allow Google Sheets sync to insert/update users
CREATE POLICY "Allow anon to sync users from Google Sheets"
ON users
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- 2. Create policy to allow Google Sheets sync to insert/update outbound_map
CREATE POLICY "Allow anon to sync outbound_map from Google Sheets"
ON outbound_map
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- 3. Fix role constraint to match valid roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('Admin', 'Data', 'Ops Coor', 'PIC', 'FTE'));

-- 4. Verify policies are created
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('users', 'outbound_map');
