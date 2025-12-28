# Google Sheets Sync Troubleshooting Guide

## Issue: Data not syncing from Google Sheets to Supabase

### Step 1: Check Sheet Names
Your Google Sheets must have tabs named exactly:
- `Users` (case-sensitive)
- `Outbound Map` (case-sensitive)

### Step 2: Check Column Headers in Users Sheet
The first row must contain headers that match your Supabase table structure:
- `ops_id` or `Ops ID`
- `name` or `Name`
- `role` or `Role`
- `password` (optional, will be hashed)
- Any other columns from your users table

### Step 3: Run Test Function
1. Open your Google Sheet
2. Go to Extensions → Apps Script
3. Copy the improved script from `google-sheets-sync-improved.gs`
4. Run the `testSheetStructure()` function first
5. Check the logs (View → Logs or Ctrl+Enter)

### Step 4: Run Sync with Detailed Logging
1. Run the `syncUsers()` function
2. Check the execution log for:
   - ✅ Success messages
   - ❌ Error messages
   - 📡 HTTP response codes

### Common Issues & Solutions

#### Issue 1: "Users sheet not found"
**Solution:** Rename your sheet tab to exactly `Users`

#### Issue 2: HTTP 400 Bad Request
**Possible causes:**
- Column names don't match Supabase table
- Data type mismatch (e.g., text in number field)
- Missing required fields

**Solution:** Check your Supabase table schema and ensure headers match

#### Issue 3: HTTP 401 Unauthorized
**Solution:** Verify your SUPABASE_KEY is correct

#### Issue 4: HTTP 409 Conflict
**Possible cause:** Duplicate primary key (ops_id)
**Solution:** Ensure ops_id values are unique in your sheet

#### Issue 5: No error but data not appearing
**Possible causes:**
- RLS (Row Level Security) policies blocking inserts
- Table doesn't exist

**Solution:** Check Supabase table policies

### Step 5: Check Supabase RLS Policies

Run this in Supabase SQL Editor to allow inserts:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Temporarily disable RLS for testing (NOT for production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Or create a policy to allow inserts
CREATE POLICY "Allow service role to insert users"
ON users
FOR INSERT
TO anon, authenticated
USING (true)
WITH CHECK (true);
```

### Step 6: Manual Test via Supabase API

Test the API directly using curl or Postman:

```bash
curl -X POST 'https://odhwninwonguhkbbeeza.supabase.co/rest/v1/users' \
-H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaHduaW53b25ndWhrYmJlZXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTMyMjEsImV4cCI6MjA4MjE2OTIyMX0.F41DUv8hBdE08H5i09ofkvTywa8t7OnbrpdHW9Hjb-A" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaHduaW53b25ndWhrYmJlZXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTMyMjEsImV4cCI6MjA4MjE2OTIyMX0.F41DUv8hBdE08H5i09ofkvTywa8t7OnbrpdHW9Hjb-A" \
-H "Content-Type: application/json" \
-H "Prefer: resolution=merge-duplicates" \
-d '[{"ops_id":"TEST001","name":"Test User","role":"Backroom"}]'
```

### Step 7: Check Execution Logs

In Google Apps Script:
1. Click on "Executions" (clock icon on left sidebar)
2. Check recent executions for errors
3. Look for detailed error messages

### Quick Fix: Use Improved Script

Replace your current script with `google-sheets-sync-improved.gs` which includes:
- ✅ Detailed logging
- ✅ Better error handling
- ✅ Response code checking
- ✅ Test functions

### Need More Help?

Run these diagnostic functions in order:
1. `testSheetStructure()` - Verify sheet setup
2. `syncUsers()` - Sync with detailed logs
3. Check Supabase Table Editor to see if data appeared

### Expected Log Output (Success)

```
🚀 Starting sync at [timestamp]
📊 Found 10 rows in Users sheet
📋 Headers: ops_id, name, role, password
✅ Processed 10 valid users
📡 Users sync response: 201
📄 Response body: [{"ops_id":"..."}]
✅ Users synced successfully!
✅ Sync completed at [timestamp]
```
