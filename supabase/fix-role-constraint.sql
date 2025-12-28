-- Check and Fix Role Constraint Issue
-- Run this in Supabase SQL Editor

-- 1. Check current role constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass AND conname = 'users_role_check';

-- 2. Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 3. Recreate constraint with correct roles
-- Update this list based on your actual roles in Google Sheets
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('Admin', 'Data', 'Ops Coor', 'PIC', 'FTE'));

-- 4. Check what roles exist in your Google Sheets data
-- (You'll need to check your Google Sheet manually)

-- 5. Alternative: Remove constraint entirely (if you want flexible roles)
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
