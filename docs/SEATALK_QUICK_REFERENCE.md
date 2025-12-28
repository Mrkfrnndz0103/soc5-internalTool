# SeaTalk QR Authentication - Quick Reference

## 🚀 Quick Start

### 1. Run Database Migration
```sql
-- In Supabase SQL Editor
-- Run: supabase/migrations/seatalk_auth.sql
```

### 2. Deploy Webhook
```javascript
// In Google Apps Script
// 1. Copy: supabase/seatalk-webhook.gs
// 2. Update: SUPABASE_URL and SUPABASE_ANON_KEY
// 3. Deploy as Web App (Anyone can access)
// 4. Copy Web App URL
```

### 3. Register Deep Link
```
Contact SeaTalk Platform Team:
- App ID: soc5-outbound
- Deep Link: seatalk://auth/soc5-outbound?session={SESSION_ID}
- Webhook URL: [Your Google Apps Script URL]
- Domain: @shopeemobile-external.com
```

## 📋 Implementation Checklist

- [ ] Database table created (`seatalk_sessions`)
- [ ] Webhook deployed to Google Apps Script
- [ ] Webhook URL configured in SeaTalk platform
- [ ] Deep link registered with SeaTalk
- [ ] Frontend polling implemented
- [ ] Session creation on QR generation
- [ ] Email domain validation in webhook
- [ ] Auto-cleanup function scheduled
- [ ] Error handling for expired sessions
- [ ] Success animation on login

## 🔑 Key Code Snippets

### Frontend: Generate QR & Poll
```typescript
// Generate session
const sessionId = `seatalk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Create in DB
await authApi.createSeatalkSession(sessionId)

// Generate QR
const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`seatalk://auth/soc5-outbound?session=${sessionId}`)}`

// Poll every 2 seconds
setInterval(async () => {
  const response = await authApi.checkSeatalkAuth(sessionId)
  if (response.data?.authenticated) {
    // Login user with email
    await handleSeatalkLogin(response.data.email)
  }
}, 2000)
```

### Backend: Check Authentication
```typescript
async checkSeatalkAuth(session_id: string) {
  const { data } = await supabase
    .from('seatalk_sessions')
    .select('email, authenticated')
    .eq('session_id', session_id)
    .eq('authenticated', true)
    .single()
  return { data }
}
```

### Webhook: Update Session
```javascript
function doPost(e) {
  const { session_id, email } = JSON.parse(e.postData.contents)
  
  // Validate domain
  if (!email.endsWith('@shopeemobile-external.com')) {
    return error('Invalid email domain')
  }
  
  // Update session
  const url = `${SUPABASE_URL}/rest/v1/seatalk_sessions?session_id=eq.${session_id}`
  UrlFetchApp.fetch(url, {
    method: 'patch',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      email: email,
      authenticated: true
    })
  })
}
```

## 🗄️ Database Schema

```sql
CREATE TABLE seatalk_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  email TEXT,
  authenticated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);
```

## 🔍 Testing Commands

### Test Webhook
```bash
curl -X POST https://script.google.com/macros/s/{SCRIPT_ID}/exec \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test-123","email":"test@shopeemobile-external.com"}'
```

### Check Session in Database
```sql
SELECT * FROM seatalk_sessions 
WHERE session_id = 'seatalk-1704123456789-x7k2p9q';
```

### Manual Cleanup
```sql
SELECT delete_expired_seatalk_sessions();
```

### Check Active Sessions
```sql
SELECT session_id, email, authenticated, 
       created_at, expires_at 
FROM seatalk_sessions 
WHERE expires_at > NOW();
```

## 🐛 Common Issues & Fixes

### QR Not Generating
```typescript
// Check console for errors
console.log('Session ID:', sessionId)
console.log('QR URL:', qrUrl)
```

### Polling Not Working
```typescript
// Check API response
const response = await authApi.checkSeatalkAuth(sessionId)
console.log('Poll response:', response)
```

### Webhook Not Receiving
```javascript
// Check Apps Script logs
Logger.log('Received:', JSON.stringify(payload))
```

### Session Not Updating
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'seatalk_sessions';

-- Check session exists
SELECT * FROM seatalk_sessions WHERE session_id = 'YOUR_SESSION_ID';
```

## 📊 Monitoring Queries

### Active Sessions Count
```sql
SELECT COUNT(*) FROM seatalk_sessions 
WHERE expires_at > NOW();
```

### Authenticated Sessions Today
```sql
SELECT COUNT(*) FROM seatalk_sessions 
WHERE authenticated = true 
AND created_at > CURRENT_DATE;
```

### Average Time to Authenticate
```sql
SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_seconds
FROM seatalk_sessions 
WHERE authenticated = true;
```

### Failed Authentications (Expired)
```sql
SELECT COUNT(*) FROM seatalk_sessions 
WHERE authenticated = false 
AND expires_at < NOW();
```

## 🔐 Security Checklist

- [ ] Email domain validation (@shopeemobile-external.com)
- [ ] Session expiry (5 minutes)
- [ ] HTTPS only for webhook
- [ ] Cryptographic session IDs
- [ ] RLS policies enabled
- [ ] One-time use sessions
- [ ] Auto-cleanup of expired sessions
- [ ] Rate limiting on webhook (optional)

## 📱 SeaTalk Deep Link Format

```
seatalk://auth/soc5-outbound?session={SESSION_ID}

Example:
seatalk://auth/soc5-outbound?session=seatalk-1704123456789-x7k2p9q
```

## 🔄 Session States

```
CREATED → AUTHENTICATED → CONSUMED → EXPIRED
  ↓           ↓             ↓          ↓
false       true         (login)   (cleanup)
```

## 📞 Support Contacts

- **Database Issues**: Check Supabase logs
- **Webhook Issues**: Check Google Apps Script execution logs
- **Deep Link Issues**: Contact SeaTalk Platform Team
- **Frontend Issues**: Check browser console

## 📚 Documentation Links

- Full Setup: `docs/SEATALK_AUTH_SETUP.md`
- Flow Diagram: `docs/SEATALK_FLOW_DIAGRAM.md`
- Implementation Summary: `SEATALK_IMPLEMENTATION.md`
- Main README: `README.md`
