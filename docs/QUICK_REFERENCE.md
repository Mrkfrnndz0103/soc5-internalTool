# Quick Reference Guide

## Installation

```bash
# Install dependencies
npm install

# Install Supabase CLI (optional, for local development)
npm install -g supabase
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
# Add your Supabase URL and anon key
```

## Supabase Commands

```bash
# Login to Supabase (if using CLI)
supabase login

# Link to remote project
supabase link --project-ref your-project-ref

# Pull remote schema
supabase db pull

# Push local migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

## Database Operations

### Create Admin User
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

### Create Test User
```sql
INSERT INTO users (ops_id, name, role, password_hash, active)
VALUES (
  'TEST001',
  'Test User',
  'Backroom',
  crypt('test123', gen_salt('bf')),
  true
);
```

### View Dispatch Reports
```sql
SELECT * FROM dispatch_reports 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Sync Status
```sql
SELECT 
  'users' as table_name, 
  COUNT(*) as row_count 
FROM users
UNION ALL
SELECT 
  'outbound_map', 
  COUNT(*) 
FROM outbound_map
UNION ALL
SELECT 
  'dispatch_reports', 
  COUNT(*) 
FROM dispatch_reports;
```

## Google Apps Script

### Test Sync Manually
```javascript
// In Apps Script editor
syncAllData()
```

### Check Last Sync Time
```javascript
// In Apps Script editor
Logger.log('Last sync: ' + PropertiesService.getScriptProperties().getProperty('lastSync'))
```

### Test Webhook
```javascript
// In Apps Script editor
testWebhook()
```

## Troubleshooting

### Clear Local Storage
```javascript
// In browser console
localStorage.clear()
location.reload()
```

### Check Supabase Connection
```javascript
// In browser console
import { supabase } from './src/lib/supabase'
const { data, error } = await supabase.from('users').select('count')
console.log(data, error)
```

### View Network Requests
```
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "supabase"
4. Perform action
5. Check request/response
```

## Common Tasks

### Add New User
1. Open Google Sheets
2. Go to "Users" tab
3. Add row with: ops_id, name, email, role, active
4. Wait for hourly sync OR run `syncAllData()` manually

### Update Outbound Map
1. Open Google Sheets
2. Go to "Outbound Map" tab
3. Edit cluster/hub information
4. Wait for hourly sync OR run `syncAllData()` manually

### View Dispatch Reports
1. Open Google Sheets
2. Go to "Dispatch Reports" tab
3. All submitted reports appear here automatically

### Reset Password
```sql
UPDATE users 
SET password_hash = crypt('new_password', gen_salt('bf')),
    must_change_password = true
WHERE ops_id = 'USER001';
```

## Deployment

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

## Monitoring

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Click on your project
3. Go to "Logs" section
4. Filter by table or function

### Check Apps Script Logs
1. Open Apps Script editor
2. Click "Executions" (clock icon)
3. View execution history and errors

### Check Webhook Status
```sql
-- View recent dispatch reports
SELECT id, cluster_name, status, created_at 
FROM dispatch_reports 
ORDER BY created_at DESC 
LIMIT 20;
```

## Backup

### Export Database
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or from Supabase Dashboard
# Settings → Database → Backup
```

### Export Google Sheets
```
File → Download → Microsoft Excel (.xlsx)
```

## Performance

### Check Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM dispatch_reports 
WHERE region = 'NCR' 
ORDER BY created_at DESC;
```

### Add Index
```sql
CREATE INDEX idx_custom ON table_name(column_name);
```

## Security

### Rotate API Keys
1. Go to Supabase Dashboard
2. Settings → API
3. Generate new anon key
4. Update environment variables
5. Redeploy application

### Review RLS Policies
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'dispatch_reports';
```

## Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Google Apps Script](https://script.google.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Netlify Dashboard](https://app.netlify.com)

## Support

- **Documentation**: Check `SUPABASE_SETUP.md` and `DEPLOYMENT_CHECKLIST.md`
- **Issues**: Create GitHub issue
- **Emergency**: Contact system administrator
