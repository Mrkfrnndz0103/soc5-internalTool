# Outbound Internal Tool - Complete Documentation

Enterprise-grade web application for managing outbound dispatch operations with role-based authentication, KPI tracking, and team administration.

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Setup & Installation](#setup--installation)
5. [Authentication](#authentication)
6. [Core Workflows](#core-workflows)
7. [Development Guide](#development-guide)
8. [Deployment](#deployment)
9. [Future Plans](#future-plans)

---

## Quick Start

### Development Setup (No Backend Required)

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_USE_MOCK_API=true in .env

# Start development server
npm run dev
# Open http://localhost:5173
```

### Test Accounts

| Role | Ops ID | Password | Notes |
|------|--------|----------|-------|
| Backroom | OPS001 | `SOC5-Outbound` | Regular user |
| Data Team | DATA001 | `DataTeam2024!` | Can verify dispatches |
| Admin | ADMIN001 | `Admin2024!` | Full access |

---

## Features

### Core Functionality
- **Dashboard** - Real-time operations overview with key metrics
- **Dispatch Report** - Editable table with 15 columns, auto-complete, validation, draft persistence
- **Prealert Database** - Consolidated dispatch reports with filtering
- **KPI & Compliance** - Performance tracking from Google Sheets
- **Admin Tools** - Attendance, masterfile, breaktime, leave management
- **Midmile Operations** - Truck request management

### Key Capabilities
- ✅ Dual authentication (Backroom with Ops ID + FTE with Google OAuth)
- ✅ Dark/Light theme with preset selector
- ✅ Collapsible sidebar with nested menus
- ✅ Real-time form validation
- ✅ Auto-save draft (10-second intervals)
- ✅ Auto-complete for clusters and processors
- ✅ Multi-hub cluster auto-split
- ✅ Responsive design
- ✅ Role-based access control
- ✅ Type-safe API integration

---

## Tech Stack

**Frontend**: React 18 + TypeScript + Vite  
**Backend**: Supabase (PostgreSQL)  
**UI**: Radix UI + Tailwind CSS  
**Routing**: React Router v6  
**Forms**: React Hook Form + Zod  
**State**: React Context API  
**Animation**: GSAP  
**Icons**: Lucide React  
**Integration**: Google Sheets API

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- Google Cloud account (for OAuth)

### 1. Frontend Setup

```bash
# Clone and install
cd OutboudInternalTool
npm install

# Configure environment
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_USE_MOCK_API=false
```

### 2. Supabase Setup

**Create Project**
1. Visit https://supabase.com and create new project
2. Copy project URL and anon key

**Enable Extensions**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_net";
```

**Create Tables**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ops_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('Backroom', 'FTE', 'Admin', 'Data Team')),
  password_hash TEXT,
  must_change_password BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outbound map (master data)
CREATE TABLE outbound_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_name TEXT NOT NULL,
  hub_name TEXT NOT NULL,
  region TEXT NOT NULL,
  dock_number TEXT,
  station_code TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dispatch reports
CREATE TABLE dispatch_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_sequence INTEGER,
  cluster_name TEXT NOT NULL,
  station_name TEXT NOT NULL,
  region TEXT NOT NULL,
  count_of_to INTEGER DEFAULT 0,
  total_oid_loaded INTEGER DEFAULT 0,
  actual_docked_time TIMESTAMPTZ NOT NULL,
  dock_number TEXT NOT NULL,
  dock_confirmed BOOLEAN DEFAULT false,
  actual_depart_time TIMESTAMPTZ NOT NULL,
  processor_name TEXT NOT NULL,
  lh_trip TEXT,
  plate_number TEXT,
  fleet_size TEXT,
  assigned_ops_id TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  submitted_by_ops_id TEXT NOT NULL,
  verified_by_ops_id TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT depart_after_dock CHECK (actual_depart_time >= actual_docked_time)
);
```

**Create Initial Admin**
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

### 3. Google Sheets Integration

**Setup Sheet**
- Create Google Sheet with tabs: Users, Outbound Map, Dispatch Reports
- Deploy `supabase/google-sheets-sync.gs` as Apps Script
- Deploy `supabase/webhook-receiver.gs` as Web App
- Run `supabase/webhook-setup.sql` in Supabase

**Data Flow**
```
Google Sheets (Master Data)
    ↓ (Hourly Sync)
Supabase Database
    ↓ (Real-time)
Web Application
    ↓ (On Submit)
Supabase Database
    ↓ (Webhook)
Google Sheets (Dispatch Reports)
```

### 4. Google OAuth Setup

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized origins:
   - `http://localhost:5173` (dev)
   - `https://your-domain.com` (prod)
4. Copy Client ID to `.env`

---

## Authentication

### Backroom Login
1. Select "Backroom" role
2. Enter Ops ID (e.g., `OPS001`)
3. Name auto-populates
4. Enter password
5. Change password if first-time login

### FTE Login
1. Select "FTE" role
2. Click "Sign in with Google"
3. Authenticate with company Google account

---

## Integration Guides

### Seatalk QR Authentication Integration

**Overview**: Enable FTE users to authenticate using Seatalk mobile app by scanning QR codes.

#### Step 1: Seatalk API Setup
1. Register application in Seatalk Developer Portal
2. Obtain API credentials:
   - App ID
   - App Secret
   - Webhook URL
3. Configure OAuth scopes: `user.info`, `user.email`

#### Step 2: Backend Implementation

**Install Seatalk SDK**
```bash
npm install @seatalk/web-app-sdk
```

**Create QR Session Service** (`src/lib/seatalk-auth.ts`)
```typescript
import { SeatalkClient } from '@seatalk/web-app-sdk'

const client = new SeatalkClient({
  appId: process.env.SEATALK_APP_ID,
  appSecret: process.env.SEATALK_APP_SECRET
})

export async function generateQRSession() {
  const session = await client.auth.createQRSession({
    expiresIn: 300, // 5 minutes
    redirectUrl: process.env.APP_URL + '/auth/callback'
  })
  
  return {
    sessionId: session.id,
    qrCode: session.qrCodeUrl,
    expiresAt: session.expiresAt
  }
}

export async function verifyQRSession(sessionId: string) {
  const result = await client.auth.verifyQRSession(sessionId)
  
  if (result.status === 'authenticated') {
    const userInfo = await client.users.getInfo(result.userId)
    return {
      userId: userInfo.id,
      email: userInfo.email,
      name: userInfo.displayName
    }
  }
  
  return null
}
```

#### Step 3: Database Setup

**Add QR Session Table**
```sql
CREATE TABLE qr_auth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'authenticated', 'expired')),
  user_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_sessions_status ON qr_auth_sessions(status, expires_at);
```

#### Step 4: Frontend Implementation

**Create QR Login Component** (`src/components/qr-login.tsx`)
```typescript
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export function QRLogin() {
  const [qrData, setQrData] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    // Generate QR code
    fetch('/api/auth/qr/generate', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setQrData(data)
        setStatus('ready')
        pollStatus(data.sessionId)
      })
  }, [])

  const pollStatus = async (sessionId: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/auth/qr/status/${sessionId}`)
      const data = await res.json()
      
      if (data.status === 'authenticated') {
        clearInterval(interval)
        // Redirect to dashboard
        window.location.href = '/dashboard'
      }
    }, 2000)

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h3>Scan with Seatalk App</h3>
      {status === 'ready' && qrData && (
        <QRCodeSVG value={qrData.qrCode} size={256} />
      )}
      <p className="text-sm text-muted-foreground">
        Open Seatalk app and scan this QR code
      </p>
    </div>
  )
}
```

#### Step 5: API Endpoints

**Create Supabase Edge Functions**

`supabase/functions/qr-generate/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { generateQRSession } from '../_shared/seatalk-auth.ts'

serve(async (req) => {
  const session = await generateQRSession()
  
  // Store in database
  await supabase.from('qr_auth_sessions').insert({
    session_id: session.sessionId,
    expires_at: session.expiresAt
  })
  
  return new Response(JSON.stringify(session), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

`supabase/functions/qr-status/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyQRSession } from '../_shared/seatalk-auth.ts'

serve(async (req) => {
  const url = new URL(req.url)
  const sessionId = url.pathname.split('/').pop()
  
  const userInfo = await verifyQRSession(sessionId)
  
  if (userInfo) {
    // Update session status
    await supabase.from('qr_auth_sessions')
      .update({ status: 'authenticated', user_id: userInfo.userId })
      .eq('session_id', sessionId)
    
    // Create user session
    const { data: user } = await supabase.from('users')
      .select('*')
      .eq('email', userInfo.email)
      .single()
    
    return new Response(JSON.stringify({ 
      status: 'authenticated', 
      user 
    }))
  }
  
  return new Response(JSON.stringify({ status: 'pending' }))
})
```

#### Step 6: Environment Configuration

**Add to `.env`**
```env
VITE_SEATALK_APP_ID=your_seatalk_app_id
SEATALK_APP_SECRET=your_seatalk_app_secret
SEATALK_WEBHOOK_URL=https://your-domain.com/api/seatalk/webhook
```

#### Step 7: Testing

1. Start development server
2. Click "Scan with Phone" on login page
3. QR code appears
4. Open Seatalk mobile app
5. Scan QR code
6. Verify automatic login

---

### Gmail OTP Authentication Integration

**Overview**: Enable Backroom users to authenticate using email-based one-time passwords sent via Gmail.

#### Step 1: Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Gmail API:
   - Navigate to "APIs & Services" → "Library"
   - Search "Gmail API"
   - Click "Enable"
4. Create Service Account:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: `outbound-tool-mailer`
   - Grant role: "Service Account User"
5. Create Key:
   - Click on service account
   - "Keys" tab → "Add Key" → "Create new key"
   - Select JSON format
   - Download and save securely

#### Step 2: Gmail Configuration

1. Enable Domain-Wide Delegation:
   - In Service Account details, click "Show Domain-Wide Delegation"
   - Enable "Enable Google Workspace Domain-wide Delegation"
   - Note the Client ID
2. Configure in Google Workspace Admin:
   - Go to [admin.google.com](https://admin.google.com)
   - Security → API Controls → Domain-wide Delegation
   - Add new:
     - Client ID: (from service account)
     - OAuth Scopes: `https://www.googleapis.com/auth/gmail.send`

#### Step 3: Backend Implementation

**Install Dependencies**
```bash
npm install googleapis nodemailer
```

**Create OTP Service** (`src/lib/otp-service.ts`)
```typescript
import { google } from 'googleapis'
import nodemailer from 'nodemailer'

const gmail = google.gmail('v1')

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTP(email: string): Promise<string> {
  // Validate email domain
  if (!email.endsWith('@shopeemobile-external.com')) {
    throw new Error('Invalid email domain')
  }
  
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  
  // Store OTP in database
  await supabase.from('otp_codes').insert({
    email,
    code: otp,
    expires_at: expiresAt,
    attempts: 0
  })
  
  // Send email
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    scopes: ['https://www.googleapis.com/auth/gmail.send']
  })
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'noreply@shopeemobile-external.com',
      serviceClient: await auth.getClient()
    }
  })
  
  await transporter.sendMail({
    from: 'Outbound Tool <noreply@shopeemobile-external.com>',
    to: email,
    subject: 'Your Login OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Login Verification</h2>
        <p>Your one-time password is:</p>
        <h1 style="color: #2563eb; letter-spacing: 8px;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `
  })
  
  return otp
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const { data: otpRecord } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .eq('used', false)
    .single()
  
  if (!otpRecord) {
    // Increment failed attempts
    await supabase.from('otp_codes')
      .update({ attempts: supabase.raw('attempts + 1') })
      .eq('email', email)
    return false
  }
  
  // Check expiration
  if (new Date(otpRecord.expires_at) < new Date()) {
    return false
  }
  
  // Mark as used
  await supabase.from('otp_codes')
    .update({ used: true })
    .eq('id', otpRecord.id)
  
  return true
}
```

#### Step 4: Database Setup

**Add OTP Table**
```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_email ON otp_codes(email, used, expires_at);

-- Auto-delete expired OTPs
CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run hourly)
SELECT cron.schedule('delete-expired-otps', '0 * * * *', 'SELECT delete_expired_otps()');
```

#### Step 5: Frontend Implementation

**Create OTP Login Component** (`src/components/otp-login.tsx`)
```typescript
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function OTPLogin() {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOTP = async () => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (!res.ok) throw new Error('Failed to send OTP')
      
      setStep('otp')
    } catch (err) {
      setError('Invalid email or failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Store token and redirect
        localStorage.setItem('token', data.token)
        window.location.href = '/dashboard'
      } else {
        setError('Invalid or expired OTP')
      }
    } catch (err) {
      setError('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {step === 'email' ? (
        <>
          <Input
            type="email"
            placeholder="email@shopeemobile-external.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleSendOTP} disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm">Enter the 6-digit code sent to {email}</p>
          <Input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <Button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>
          <Button variant="ghost" onClick={() => setStep('email')}>
            Use different email
          </Button>
        </>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
```

#### Step 6: API Endpoints

**Create Supabase Edge Functions**

`supabase/functions/otp-send/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { sendOTP } from '../_shared/otp-service.ts'

serve(async (req) => {
  const { email } = await req.json()
  
  try {
    await sendOTP(email)
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

`supabase/functions/otp-verify/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyOTP } from '../_shared/otp-service.ts'

serve(async (req) => {
  const { email, code } = await req.json()
  
  const isValid = await verifyOTP(email, code)
  
  if (isValid) {
    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    // Generate session token
    const token = await generateToken(user)
    
    return new Response(JSON.stringify({ 
      success: true, 
      token,
      user 
    }))
  }
  
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'Invalid OTP' 
  }), { status: 401 })
})
```

#### Step 7: Environment Configuration

**Add to `.env`**
```env
GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
GMAIL_SENDER_EMAIL=noreply@shopeemobile-external.com
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS=3
```

#### Step 8: Security Enhancements

**Rate Limiting**
```typescript
// Limit OTP requests per email
const { count } = await supabase
  .from('otp_codes')
  .select('*', { count: 'exact' })
  .eq('email', email)
  .gte('created_at', new Date(Date.now() - 60 * 60 * 1000)) // Last hour

if (count >= 5) {
  throw new Error('Too many OTP requests. Try again later.')
}
```

**Attempt Limiting**
```typescript
if (otpRecord.attempts >= 3) {
  await supabase.from('otp_codes')
    .update({ used: true })
    .eq('id', otpRecord.id)
  throw new Error('Too many failed attempts')
}
```

#### Step 9: Testing

1. Start development server
2. Click "Use Password" on login page
3. Enter email: `test@shopeemobile-external.com`
4. Click "Send OTP"
5. Check Gmail inbox for OTP code
6. Enter 6-digit code
7. Verify automatic login

---

## Core Workflows

### Dispatch Report Submission

**Features**
- Max 10 rows per session
- Cluster autocomplete (3+ characters)
- Multi-hub auto-split
- Auto-fill: station, region, dock
- Real-time validation
- Draft auto-save (10s intervals)
- Hide/show columns
- Dock confirmation required

**Workflow**
1. Navigate to Outbound → Dispatch Report
2. Fill dispatch information
3. System validates and auto-saves
4. Click "Submit All Rows"
5. Data moves to Prealert (Status: Pending)

### Prealert Verification (Data Team)

**Status Types**
- **Pending (Green)**: New submission, requires action
- **Ongoing**: Currently being verified
- **Verified**: Complete and accurate
- **Pending (Red)**: Inaccurate, needs correction

**Actions**
1. Review submitted dispatch reports
2. Cross-check data accuracy
3. Update status (Ongoing → Verified/Rejected)
4. Verified reports trigger automated notifications

### Automated Processing

**When Verified**
- Seatalk chatbot notifications to hub groups
- Automated email with Excel attachment
- Data queried from Google Sheets by LH Trip #
- Status auto-updates to "Done"

---

## Development Guide

### Project Structure
```
src/
├── components/
│   ├── ui/              # Core UI components
│   ├── layout.tsx       # Main layout
│   └── sidebar.tsx      # Navigation
├── contexts/
│   └── auth-context.tsx # Auth provider
├── lib/
│   ├── api.ts           # API service
│   ├── mock-api.ts      # Mock data
│   └── utils.ts         # Utilities
├── pages/
│   ├── dashboard.tsx
│   ├── dispatch-report.tsx
│   └── prealert.tsx
├── App.tsx              # Routing
└── main.tsx             # Entry point
```

### Adding a New Page

```typescript
// 1. Create page component
// src/pages/my-page.tsx
export function MyPage() {
  return <div>My Page Content</div>
}

// 2. Add route in App.tsx
<Route path="my-page" element={<MyPage />} />

// 3. Add menu item in sidebar.tsx
{
  title: "My Page",
  path: "/my-page",
  icon: <Icon className="h-5 w-5" />
}
```

### API Integration

```typescript
import { dispatchApi } from "@/lib/api"

const response = await dispatchApi.submitRows(rows, ops_id)
if (response.error) {
  toast({ variant: "destructive", title: "Error" })
} else {
  console.log(response.data)
}
```

### Code Style

**Naming Conventions**
- Components: PascalCase (`MyComponent`)
- Files: kebab-case (`my-component.tsx`)
- Functions: camelCase (`handleSubmit`)
- Constants: UPPER_SNAKE_CASE (`MAX_ROWS`)

**Component Pattern**
```typescript
import { cn } from "@/lib/utils"

interface Props {
  variant?: "default" | "secondary"
}

export function Component({ variant = "default" }: Props) {
  return (
    <div className={cn("base-classes", variant === "secondary" && "secondary-classes")} />
  )
}
```

---

## Deployment

### Build for Production

```bash
npm run build
# Output in dist/ directory
```

### Deployment Checklist

**Pre-Deployment**
- [ ] Supabase project created and configured
- [ ] All SQL scripts executed
- [ ] Google Sheets integration setup
- [ ] Apps Script deployed (sync + webhook)
- [ ] Environment variables configured
- [ ] Google OAuth credentials created

**Deploy Frontend** (Choose one)

**Option 1: Vercel**
```bash
# Connect GitHub repo to Vercel
# Add environment variables in dashboard
# Deploy automatically
```

**Option 2: Netlify**
```bash
# Connect GitHub repo to Netlify
# Add environment variables
# Deploy
```

**Option 3: AWS S3 + CloudFront**
```bash
# Create S3 bucket
# Enable static website hosting
# Upload dist/ files
# Create CloudFront distribution
```

**Post-Deployment**
- [ ] Test all authentication methods
- [ ] Test dispatch workflow end-to-end
- [ ] Verify webhook sends to Google Sheets
- [ ] Test on mobile devices
- [ ] Set up monitoring and error tracking

### Environment Variables (Production)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_key
VITE_GOOGLE_CLIENT_ID=your_production_client_id
VITE_USE_MOCK_API=false
```

---

## Future Plans

### Phase 1: Enhanced Authentication (Q1 2024)
- **Seatalk QR Authentication**: Mobile app scanning for FTE users
- **Email OTP Integration**: Gmail-based one-time password for Backroom users
- **Session Management**: Enhanced security with token refresh
- **Multi-factor Authentication**: Additional security layer

### Phase 2: Advanced Notifications (Q2 2024)
- **Audio Alerts**: Alarm sounds for new submissions and rejections
- **Visual Notifications**: Screen flash for urgent actions
- **Seatalk Chatbot**: Automated group chat notifications
- **Email Automation**: Template-based email delivery
- **Mobile Push**: Real-time mobile notifications

### Phase 3: Business Intelligence (Q3 2024)
- **Dashboard Analytics**: Real-time KPI monitoring
- **Predictive Analytics**: ML-powered dispatch pattern analysis
- **Automated Reports**: Scheduled business report generation
- **Data Visualization**: Interactive charts and graphs
- **Export Options**: PDF, CSV, Excel format support

### Phase 4: Scalability & Performance (Q4 2024)
- **Microservices Architecture**: Service separation for scalability
- **Load Balancing**: High availability setup
- **Database Optimization**: Query performance improvements
- **CDN Integration**: Static asset delivery optimization
- **Auto-scaling**: Dynamic resource allocation

### Phase 5: Integration Expansions (2025)
- **Microsoft Teams**: Alternative communication channel
- **Slack Integration**: Additional notification method
- **WhatsApp Business**: Mobile notification alternative
- **SMS Gateway**: Backup notification system
- **Calendar Integration**: Schedule-based notifications
- **API Gateway**: Third-party integration support

### Additional Enhancements
- **Progressive Web App**: Offline capability
- **Voice Commands**: Hands-free operation
- **Native Mobile App**: iOS and Android applications
- **Bulk Operations**: Multi-select actions for efficiency
- **Advanced Search**: Full-text search across all data
- **Automated Validation**: AI-powered data accuracy checking

---

## Troubleshooting

### Common Issues

**Mock API not working**
- Ensure `VITE_USE_MOCK_API=true` in `.env`

**Name not auto-filling on login**
- Verify correct Ops ID from test accounts list

**Draft not saving**
- Check browser localStorage is enabled
- Clear old drafts in localStorage

**API errors**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase project status
- Review network tab in DevTools

**Google OAuth not working**
- Verify `VITE_GOOGLE_CLIENT_ID` is correct
- Check authorized origins in Google Cloud Console
- Ensure domain is whitelisted

---

## Support

**Documentation**: See `/docs` folder for detailed guides  
**Issues**: Contact development team or system administrator  
**Supabase Support**: https://supabase.com/support  
**Google Apps Script**: https://developers.google.com/apps-script

---

## License

Internal use only - Proprietary

---

**Last Updated**: January 2025  
**Version**: 1.0.0
