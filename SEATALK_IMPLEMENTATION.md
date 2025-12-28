# SeaTalk QR Authentication - Implementation Summary

## What Changed

FTE users now authenticate by scanning a QR code with the SeaTalk mobile app instead of Google OAuth. The user's email account logged into SeaTalk is automatically used to log into the web application.

## Files Modified

### Frontend
1. **src/pages/login.tsx**
   - Added session ID generation for QR codes
   - Implemented polling mechanism (every 2 seconds)
   - QR code now contains deep link: `seatalk://auth/soc5-outbound?session={SESSION_ID}`
   - Auto-login when session is authenticated

2. **src/lib/api.ts**
   - Added `checkSeatalkAuth(session_id)` method
   - Polls `seatalk_sessions` table for authentication status

### Backend
3. **supabase/migrations/seatalk_auth.sql** (NEW)
   - Creates `seatalk_sessions` table
   - Stores temporary auth sessions (5-minute expiry)
   - RLS policies for anonymous access
   - Auto-cleanup function for expired sessions

4. **supabase/seatalk-webhook.gs** (NEW)
   - Google Apps Script webhook handler
   - Receives POST from SeaTalk mobile app
   - Validates email domain
   - Updates session in Supabase

### Documentation
5. **docs/SEATALK_AUTH_SETUP.md** (NEW)
   - Complete setup guide
   - Architecture diagram
   - Troubleshooting steps
   - API reference

6. **README.md**
   - Updated authentication method description
   - Updated login instructions
   - Updated setup steps
   - Updated troubleshooting section

## Authentication Flow

```
1. User opens login page
   ↓
2. Frontend generates unique session ID
   ↓
3. QR code displays with deep link
   ↓
4. User scans QR with SeaTalk app
   ↓
5. SeaTalk sends email to webhook
   ↓
6. Webhook updates session in Supabase
   ↓
7. Frontend polling detects authentication
   ↓
8. User automatically logged in
```

## Setup Required

1. **Database**: Run `supabase/migrations/seatalk_auth.sql` in Supabase SQL Editor

2. **Webhook**: Deploy `supabase/seatalk-webhook.gs` as Google Apps Script Web App

3. **SeaTalk Platform**: Register deep link handler with SeaTalk team
   - Deep link: `seatalk://auth/soc5-outbound`
   - Webhook URL: Your deployed Google Apps Script URL

## Key Features

- ✅ Seamless mobile authentication
- ✅ No password required for FTE users
- ✅ Email automatically retrieved from SeaTalk
- ✅ Session-based with 5-minute expiry
- ✅ Domain validation (@shopeemobile-external.com)
- ✅ Auto-cleanup of expired sessions
- ✅ Real-time polling (2-second intervals)

## Security

- Sessions expire after 5 minutes
- Cryptographically random session IDs
- Email domain validation
- One-time use sessions
- HTTPS-only communication
- RLS policies on database

## Testing Checklist

- [ ] QR code generates on login page
- [ ] Session ID is unique per page load
- [ ] SeaTalk app opens when QR is scanned
- [ ] Webhook receives POST request
- [ ] Session updates in database
- [ ] Frontend polling detects authentication
- [ ] User logs in automatically
- [ ] Invalid email domains are rejected
- [ ] Expired sessions are cleaned up

## Backroom Users

Backroom users still use email-based login:
- Enter email (@shopeemobile-external.com)
- Click "Continue"
- No QR code scanning required

## Next Steps

1. Run database migration
2. Deploy webhook to Google Apps Script
3. Contact SeaTalk platform team to register deep link
4. Test end-to-end flow
5. Monitor webhook logs for errors
6. Set up session cleanup cron job (optional)

## Support

See `docs/SEATALK_AUTH_SETUP.md` for detailed troubleshooting and setup instructions.
