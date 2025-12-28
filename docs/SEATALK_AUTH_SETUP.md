# SeaTalk QR Authentication Setup Guide

## Overview
FTE users can now authenticate by scanning a QR code with the SeaTalk mobile app. The user's email account logged into SeaTalk will be used to authenticate to the web application.

## Architecture

```
Web App (Frontend)
    ↓ Generates QR with session ID
SeaTalk Mobile App
    ↓ Scans QR & sends email to webhook
Google Apps Script Webhook
    ↓ Updates session in Supabase
Web App (Frontend)
    ↓ Polls session & auto-logs in
```

## Setup Instructions

### 1. Database Setup

Run the migration in Supabase SQL Editor:
```bash
supabase/migrations/seatalk_auth.sql
```

This creates:
- `seatalk_sessions` table for temporary auth sessions
- Indexes for fast lookups
- Auto-cleanup function for expired sessions
- RLS policies for anonymous access

### 2. Deploy SeaTalk Webhook

1. Open Google Apps Script: https://script.google.com
2. Create new project: "SeaTalk Auth Webhook"
3. Copy contents of `supabase/seatalk-webhook.gs`
4. Update configuration:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your_supabase_anon_key';
   ```
5. Deploy as Web App:
   - Click "Deploy" → "New deployment"
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Copy the Web App URL

### 3. Configure SeaTalk Deep Link

Register the deep link handler in SeaTalk:
- Deep link format: `seatalk://auth/soc5-outbound?session={SESSION_ID}`
- Webhook URL: Your deployed Google Apps Script Web App URL

Contact SeaTalk platform team to register:
- App identifier: `soc5-outbound`
- Callback URL: Your webhook URL
- Allowed domains: `@shopeemobile-external.com`

### 4. Test the Flow

1. Open web app login page
2. QR code displays with unique session ID
3. Open SeaTalk mobile app
4. Scan QR code (use built-in QR scanner)
5. SeaTalk sends email to webhook
6. Webhook updates session in Supabase
7. Web app polls and auto-logs in

## How It Works

### Frontend (Web App)
1. Generates unique session ID on login page load
2. Creates QR code with deep link: `seatalk://auth/soc5-outbound?session={SESSION_ID}`
3. Polls Supabase every 2 seconds checking if session is authenticated
4. When authenticated, retrieves email and logs user in

### Mobile App (SeaTalk)
1. User scans QR code
2. SeaTalk app opens deep link
3. Extracts session ID from URL
4. Sends POST request to webhook with:
   ```json
   {
     "session_id": "seatalk-1234567890-abc123",
     "email": "user@shopeemobile-external.com"
   }
   ```

### Webhook (Google Apps Script)
1. Receives POST from SeaTalk
2. Validates email domain (`@shopeemobile-external.com`)
3. Updates `seatalk_sessions` table:
   ```sql
   UPDATE seatalk_sessions 
   SET email = 'user@shopeemobile-external.com', 
       authenticated = true 
   WHERE session_id = 'seatalk-1234567890-abc123'
   ```

### Backend (Supabase)
1. Session expires after 5 minutes
2. Auto-cleanup removes expired sessions
3. RLS policies allow anonymous read/write for auth flow

## Security Considerations

- Sessions expire after 5 minutes
- Email domain validation (`@shopeemobile-external.com` only)
- Session IDs are cryptographically random
- One-time use (authenticated sessions are consumed)
- HTTPS only for webhook communication

## Troubleshooting

### QR Code Not Generating
- Check browser console for errors
- Verify session ID is being created
- Check QR API is accessible

### SeaTalk Not Opening Deep Link
- Verify deep link is registered with SeaTalk platform
- Check URL format: `seatalk://auth/soc5-outbound?session={ID}`
- Ensure SeaTalk app is installed and logged in

### Webhook Not Receiving Requests
- **Deployment Verification Error**: If you get "Verification failed because the URL passed the invalid/incorrect response":
  - Ensure the `doGet()` function returns proper JSON response
  - The webhook must respond to GET requests for verification
  - Redeploy as Web App after fixing
- Check Google Apps Script deployment settings
- Verify "Who has access" is set to "Anyone"
- Test webhook URL directly with curl:
  ```bash
  # Test GET (verification)
  curl YOUR_WEBHOOK_URL
  
  # Test POST (authentication)
  curl -X POST YOUR_WEBHOOK_URL \
    -H "Content-Type: application/json" \
    -d '{"session_id":"test-123","email":"test@shopeemobile-external.com"}'
  ```

### Polling Not Working
- Check Supabase connection
- Verify RLS policies allow anonymous reads
- Check browser network tab for API calls
- Ensure session_id matches between QR and database

### Login Fails After Scan
- Verify email exists in `users` table
- Check user has correct role (FTE)
- Verify `authenticate_user` function accepts email
- Check browser console for error messages

## Database Maintenance

Run cleanup manually if needed:
```sql
SELECT delete_expired_seatalk_sessions();
```

Or set up a cron job in Supabase:
```sql
SELECT cron.schedule(
  'cleanup-seatalk-sessions',
  '*/5 * * * *', -- Every 5 minutes
  $$ SELECT delete_expired_seatalk_sessions(); $$
);
```

## API Reference

### Check Session Status
```typescript
const response = await authApi.checkSeatalkAuth(sessionId);
// Returns: { data: { email: string, authenticated: boolean } | null }
```

### Webhook Endpoint
```
POST https://script.google.com/macros/s/{SCRIPT_ID}/exec
Content-Type: application/json

{
  "session_id": "seatalk-1234567890-abc123",
  "email": "user@shopeemobile-external.com"
}
```

## Support

For issues:
1. Check Supabase logs for database errors
2. Check Google Apps Script execution logs
3. Check browser console for frontend errors
4. Contact SeaTalk platform team for deep link issues
