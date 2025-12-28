# SeaTalk QR Authentication Flow Diagram

## Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER OPENS LOGIN PAGE                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Frontend (login.tsx)                                                    │
│  • Generate unique session ID                                            │
│  • Format: seatalk-{timestamp}-{random}                                  │
│  • Example: seatalk-1704123456789-x7k2p9q                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  API Call: createSeatalkSession(session_id)                             │
│  INSERT INTO seatalk_sessions (session_id, authenticated)               │
│  VALUES ('seatalk-1704123456789-x7k2p9q', false)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Generate QR Code                                                        │
│  Deep Link: seatalk://auth/soc5-outbound?session={SESSION_ID}          │
│  Display QR on screen                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Start Polling (every 2 seconds)                                        │
│  checkSeatalkAuth(session_id)                                           │
│  SELECT email, authenticated FROM seatalk_sessions                      │
│  WHERE session_id = ? AND authenticated = true                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐         ┌───────────────────────┐
        │  USER SCANS QR    │         │  POLLING CONTINUES    │
        │  with SeaTalk App │         │  (waiting...)         │
        └───────────────────┘         └───────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SeaTalk Mobile App                                                      │
│  • Opens deep link                                                       │
│  • Extracts session ID from URL                                          │
│  • Gets user's logged-in email                                           │
│  • Sends POST to webhook                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  POST https://script.google.com/macros/s/{SCRIPT_ID}/exec              │
│  {                                                                       │
│    "session_id": "seatalk-1704123456789-x7k2p9q",                      │
│    "email": "user@shopeemobile-external.com"                           │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Google Apps Script Webhook (seatalk-webhook.gs)                       │
│  • Validate email domain                                                 │
│  • Check: email.endsWith('@shopeemobile-external.com')                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐         ┌───────────────────────┐
        │  VALID EMAIL      │         │  INVALID EMAIL        │
        │  Continue...      │         │  Return error         │
        └───────────────────┘         └───────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Update Supabase                                                         │
│  PATCH /rest/v1/seatalk_sessions?session_id=eq.{SESSION_ID}            │
│  {                                                                       │
│    "email": "user@shopeemobile-external.com",                          │
│    "authenticated": true                                                │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Supabase Database                                                       │
│  seatalk_sessions table updated:                                        │
│  • email = "user@shopeemobile-external.com"                            │
│  • authenticated = true                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Frontend Polling Detects Change                                        │
│  checkSeatalkAuth() returns:                                            │
│  { data: { email: "user@...", authenticated: true } }                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Stop Polling & Authenticate                                            │
│  • Call authApi.login(email, "")                                        │
│  • Retrieve user data from database                                     │
│  • Generate auth token                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Login Success                                                           │
│  • Store user & token in localStorage                                   │
│  • Show success animation                                               │
│  • Redirect to dashboard                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Session Lifecycle

```
┌──────────────┐
│ Session      │
│ Created      │  authenticated = false
│ expires_at   │  NOW() + 5 minutes
└──────┬───────┘
       │
       │ User scans QR within 5 minutes
       ▼
┌──────────────┐
│ Session      │
│ Authenticated│  authenticated = true
│              │  email = "user@..."
└──────┬───────┘
       │
       │ Frontend polls and detects
       ▼
┌──────────────┐
│ Session      │
│ Consumed     │  User logged in
│              │  Session can be deleted
└──────┬───────┘
       │
       │ After 5 minutes OR manual cleanup
       ▼
┌──────────────┐
│ Session      │
│ Expired      │  Auto-deleted by cleanup function
│              │  delete_expired_seatalk_sessions()
└──────────────┘
```

## Error Scenarios

### Scenario 1: User Never Scans QR
```
QR Generated → Polling (2s intervals) → 5 minutes pass → Session expires
                                                        → Polling returns null
                                                        → Show "Session expired" message
```

### Scenario 2: Invalid Email Domain
```
User Scans → SeaTalk sends email → Webhook validates → Email not @shopeemobile-external.com
                                                      → Return error
                                                      → Session not updated
                                                      → Polling continues (no auth)
```

### Scenario 3: Network Error
```
User Scans → SeaTalk sends email → Webhook unreachable → Retry mechanism in SeaTalk
                                                        → Or user rescans QR
```

## Database Schema

```sql
seatalk_sessions
├── id (UUID, PK)
├── session_id (TEXT, UNIQUE) ← "seatalk-1704123456789-x7k2p9q"
├── email (TEXT, NULL)        ← "user@shopeemobile-external.com"
├── authenticated (BOOLEAN)   ← false → true
├── created_at (TIMESTAMPTZ)  ← NOW()
└── expires_at (TIMESTAMPTZ)  ← NOW() + 5 minutes
```

## Security Layers

```
┌─────────────────────────────────────────┐
│ Layer 1: Session Expiry (5 minutes)    │
├─────────────────────────────────────────┤
│ Layer 2: Email Domain Validation       │
│          (@shopeemobile-external.com)  │
├─────────────────────────────────────────┤
│ Layer 3: Cryptographic Session ID      │
│          (timestamp + random)           │
├─────────────────────────────────────────┤
│ Layer 4: One-time Use                  │
│          (consumed after login)         │
├─────────────────────────────────────────┤
│ Layer 5: HTTPS Only                    │
│          (encrypted communication)      │
└─────────────────────────────────────────┘
```

## Timing Diagram

```
Time    Frontend              SeaTalk App         Webhook             Supabase
────────────────────────────────────────────────────────────────────────────
0s      Generate QR
        Create session ────────────────────────────────────────────→ INSERT
        Start polling
        
2s      Poll ───────────────────────────────────────────────────→ SELECT
        (no auth yet)
        
4s      Poll ───────────────────────────────────────────────────→ SELECT
        (no auth yet)
        
5s                          User scans QR
                            Extract session
                            Get user email
                            
6s                          POST ──────────→ Validate email
                                            Update session ─────→ UPDATE
                                            
8s      Poll ───────────────────────────────────────────────────→ SELECT
        ✓ Authenticated!                                          (returns email)
        Stop polling
        Login user
```
