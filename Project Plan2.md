# Outbound Internal Tool - Project Plan

## Overview
Enterprise-grade web application for managing outbound dispatch operations with role-based authentication, real-time notifications, and automated workflow integration with Seatalk and Gmail.

---

## 1. Authentication System

### 1.1 Login Flow
- **Initial Load**: Dashboard loads with 0.5-second delay before login modal appears
- **Role Selection**: Two authentication methods based on user role

### 1.2 FTE Authentication (Scan with Phone)
- **Method**: QR Code + Seatalk Mobile App
- **Flow**:
  1. User clicks "Scan with Phone"
  2. QR code generates and displays
  3. User scans QR with Seatalk mobile app
  4. Authentication validates against Supabase user table
  5. User account from Seatalk reflects in web app
- **Requirements**:
  - Seatalk SDK/API integration
  - QR code generation with unique session tokens
  - Real-time authentication status updates
  - User email validation against Supabase user table

### 1.3 Backroom Authentication (OTP Integration)
- **Roles**: Ops Coordinator, PIC, Admin, Data Team
- **Method**: Email OTP (One Time Pin)
- **Flow**:
  1. User clicks "Use Password"
  2. User enters organizational email
  3. Email validation (must be @shopeemobile-external.com)
  4. 6-digit OTP generated and sent to Gmail inbox
  5. User retrieves OTP from Gmail
  6. User enters OTP in web app
  7. Authentication completes
- **Requirements**:
  - Gmail API integration for OTP delivery
  - Email domain restriction (@shopeemobile-external.com)
  - OTP generation and validation system
  - Session management with role-based permissions

### 1.4 Success/Error Modals
- **Success Modal**: Animated popup with transitions and effects
- **Error Modals**: 
  - Wrong OTP entered
  - Unsuccessful QR scan
  - Invalid email domain
  - Network/server errors

---

## 2. Integration Implementation Guides

### 2.1 Seatalk QR Authentication Integration

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
        window.location.href = '/dashboard'
      }
    }, 2000)

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

#### Step 5: Environment Configuration

**Add to `.env`**
```env
VITE_SEATALK_APP_ID=your_seatalk_app_id
SEATALK_APP_SECRET=your_seatalk_app_secret
SEATALK_WEBHOOK_URL=https://your-domain.com/api/seatalk/webhook
```

---

### 2.2 Gmail OTP Authentication Integration

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

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTP(email: string): Promise<string> {
  if (!email.endsWith('@shopeemobile-external.com')) {
    throw new Error('Invalid email domain')
  }
  
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
  
  await supabase.from('otp_codes').insert({
    email,
    code: otp,
    expires_at: expiresAt,
    attempts: 0
  })
  
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
  
  if (!otpRecord || new Date(otpRecord.expires_at) < new Date()) {
    return false
  }
  
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

  const handleSendOTP = async () => {
    setLoading(true)
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    if (res.ok) setStep('otp')
    setLoading(false)
  }

  const handleVerifyOTP = async () => {
    setLoading(true)
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: otp })
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('token', data.token)
      window.location.href = '/dashboard'
    }
    setLoading(false)
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
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <Input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <Button onClick={handleVerifyOTP} disabled={loading}>
            Verify OTP
          </Button>
        </>
      )}
    </div>
  )
}
```

#### Step 6: Environment Configuration

**Add to `.env`**
```env
GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
GMAIL_SENDER_EMAIL=noreply@shopeemobile-external.com
OTP_EXPIRY_MINUTES=5
```

---

## 3. Role-Based Access Control

### 3.1 Role Definitions
- **FTE**: Full-time employees with Seatalk access
- **Ops Coordinator**: Dispatch report creation and submission
- **PIC**: Dispatch report creation and submission  
- **Admin**: Full system access and user management
- **Data Team**: Report verification and approval workflow

### 3.2 Permission Matrix
| Feature | FTE | Ops Coord | PIC | Admin | Data Team |
|---------|-----|-----------|-----|-------|-----------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dispatch Report | ✓ | ✓ | ✓ | ✓ | ✗ |
| Prealert | ✗ | ✗ | ✗ | ✓ | ✓ |
| Outbound Dispatch | ✓ | ✓ | ✓ | ✓ | ✓ |
| User Management | ✗ | ✗ | ✗ | ✓ | ✗ |

---

## 4. Dispatch Workflow System

### 4.1 Dispatch Report Page
- **Users**: Ops Coordinator, PIC
- **Function**: Create and submit dispatch reports
- **Features**:
  - Editable table interface
  - Form validation
  - Draft auto-save
  - Submit button triggers workflow
- **On Submit**: 
  - Data moves to Prealert (Status: Pending)
  - Alarm sound notification for Data Team
  - Real-time status update

### 4.2 Prealert Page (Data Team Workspace)
- **Users**: Data Team, Admin
- **Function**: Verify and cross-check dispatch reports
- **Status Workflow**:

#### Status Types
1. **Pending (Green)**: New submission, requires action
2. **Ongoing**: Currently being verified
3. **Verified**: Complete and accurate
4. **Pending (Red)**: Inaccurate/incomplete

#### Verification Actions
- Cross-checking data accuracy
- Status updates
- Rejection workflow
- Approval workflow

### 4.3 Automated Processing (Verified Reports)
- **Seatalk Integration**: Chatbot notifications to hub groups
- **Email Integration**: Automated email with Excel attachment
- **Data Source**: Google Sheets integration
- **Final Status**: Auto "Done" status update

---

## 5. Development Phases

### Phase 1: Authentication System (Week 1-2)
- Seatalk QR authentication
- Gmail OTP integration
- Role-based access control
- Success/error modals

### Phase 2: Core Workflow (Week 3-4)
- Dispatch Report page
- Prealert verification system
- Status management
- Basic notifications

### Phase 3: Automation (Week 5-6)
- Seatalk chatbot integration
- Email automation
- Google Sheets integration
- Excel generation

### Phase 4: Advanced Features (Week 7-8)
- Outbound Dispatch page
- Advanced filtering
- Audio notifications
- Performance optimization

### Phase 5: Testing & Deployment (Week 9-10)
- Integration testing
- User acceptance testing
- Production deployment
- Documentation

---

## 6. Success Metrics

### Performance Metrics
- **Authentication Success Rate**: >99%
- **Page Load Time**: <2 seconds
- **System Uptime**: >99.9%
- **Error Rate**: <0.1%

### User Adoption Metrics
- **Daily Active Users**: Target engagement levels
- **Feature Utilization**: Usage across all modules
- **User Satisfaction**: Feedback and ratings

### Business Impact Metrics
- **Process Efficiency**: Time reduction in dispatch workflow
- **Error Reduction**: Decrease in manual errors
- **Cost Savings**: Operational cost improvements

---

## License

Internal use only - Proprietary
