# Login Authentication Setup Guide

Complete guide for setting up SeaTalk QR authentication and Gmail email authentication for the SOC5 Outbound Internal Tool.

---

## Table of Contents

1. [Overview](#overview)
2. [SeaTalk Authentication Setup (Request via IT)](#seatalk-authentication-setup-request-via-it)
3. [Gmail Authentication Setup](#gmail-authentication-setup)
4. [Alternative: Email-Only Authentication](#alternative-email-only-authentication)
5. [Backend Integration](#backend-integration)
6. [Frontend Implementation](#frontend-implementation)
7. [Testing & Troubleshooting](#testing--troubleshooting)

---

## Overview

The application supports two authentication methods:

- **SeaTalk QR Authentication** - For FTE users (requires IT department setup)
- **Gmail Email Authentication** - For Backroom users with @shopeemobile-external.com emails

**Note**: If you don't have admin access, you'll need to request IT department assistance for SeaTalk setup, or use the simplified email-only authentication approach.

---

## SeaTalk Authentication Setup (Request via IT)

### Option A: Request IT Department to Register Application

Since you don't have SeaTalk admin access, follow this process:

#### Step 1: Prepare Application Request

Create a document with the following information:

**Application Details:**
```
Application Name: SOC5 Outbound Internal Tool
Application Type: Web Application
Purpose: Internal tool for outbound dispatch operations and KPI tracking
Department: Operations/Logistics
Requested By: [Your Name]
Contact Email: [Your Email]
```

**Required Permissions:**
- User profile read access
- User email access
- QR code authentication

**Redirect URIs Needed:**
```
Development: http://localhost:5173/auth/seatalk/callback
Production: https://[your-domain]/auth/seatalk/callback
```

#### Step 2: Submit IT Request

1. Open your company's IT service portal
2. Create new ticket: "SeaTalk Application Registration Request"
3. Attach the application details document
4. Request the following from IT:
   - SeaTalk App ID
   - SeaTalk App Secret
   - Confirmation of approved permissions

#### Step 3: Wait for IT Approval

- Typical processing time: 3-5 business days
- IT will configure the application in SeaTalk Developer Portal
- You'll receive credentials via secure channel

#### Step 4: Receive and Configure Credentials

Once IT provides credentials, update your `.env` file:

```env
VITE_SEATALK_APP_ID=provided_by_it
VITE_SEATALK_APP_SECRET=provided_by_it
VITE_SEATALK_REDIRECT_URI=https://your-domain/auth/seatalk/callback
```

### Option B: Use Existing Company SeaTalk Integration

If your company already has a SeaTalk integration:

#### Step 1: Contact IT Department

Ask if there's an existing SeaTalk OAuth application you can use:
- Company-wide authentication service
- Shared internal tools application
- Enterprise SSO integration

#### Step 2: Request Access

If available, request:
- Permission to use existing App ID
- Add your redirect URIs to approved list
- Documentation for integration

#### Step 3: Implement Using Shared Credentials

Use the shared App ID in your application:

```typescript
// Frontend: src/lib/seatalk-auth.ts
const SEATALK_CONFIG = {
  appId: import.meta.env.VITE_COMPANY_SEATALK_APP_ID,
  redirectUri: `${window.location.origin}/auth/seatalk/callback`,
  scope: 'user.read user.email'
}

export async function initiateSeaTalkLogin() {
  const state = crypto.randomUUID()
  sessionStorage.setItem('seatalk_state', state)
  
  const authUrl = new URL('https://open.seatalk.io/oauth/authorize')
  authUrl.searchParams.set('client_id', SEATALK_CONFIG.appId)
  authUrl.searchParams.set('redirect_uri', SEATALK_CONFIG.redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', SEATALK_CONFIG.scope)
  authUrl.searchParams.set('state', state)
  
  window.location.href = authUrl.toString()
}
```

---

## Gmail Authentication Setup

### Step 1: Request Google Cloud Project Access

#### 1.1 Contact Your IT/DevOps Team

Send email request:

```
Subject: Google Cloud Project Access for SOC5 Outbound Tool

Hi IT Team,

I need to set up Gmail authentication for the SOC5 Outbound Internal Tool.

Required Access:
- Google Cloud Console access for project: [Project Name]
- Permission to create OAuth 2.0 credentials
- Or: Request IT to create credentials on my behalf

Application Details:
- Name: SOC5 Outbound Internal Tool
- Redirect URIs: 
  - http://localhost:5173/auth/gmail/callback
  - https://[production-domain]/auth/gmail/callback
- Required Scopes: email, profile, openid

Please let me know the next steps.

Thanks,
[Your Name]
```

### Step 2: IT Creates OAuth Credentials

If IT creates credentials for you, they will provide:

```
Google Client ID: xxxxx.apps.googleusercontent.com
Google Client Secret: xxxxx
Authorized Domains: your-domain.com
```

### Step 3: Configure Environment Variables

Add to `.env`:

```env
VITE_GOOGLE_CLIENT_ID=provided_by_it.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=provided_by_it
VITE_ALLOWED_EMAIL_DOMAIN=shopeemobile-external.com
```

### Step 4: Implement Gmail OAuth Flow

**Frontend: src/lib/gmail-auth.ts**

```typescript
export function initiateGmailLogin() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const redirectUri = `${window.location.origin}/auth/gmail/callback`
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'email profile openid')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('hd', 'shopeemobile-external.com')
  
  window.location.href = authUrl.toString()
}
```

---

## Alternative: Email-Only Authentication

If OAuth setup is too complex, use simplified email-based authentication:

### Step 1: Email Verification System

**Backend: supabase/functions/send-login-link/index.ts**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { email } = await req.json()
  
  // Validate email domain
  if (!email.endsWith('@shopeemobile-external.com')) {
    return new Response(JSON.stringify({ 
      error: 'Invalid email domain' 
    }), { status: 400 })
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Check if user exists
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (!user) {
    return new Response(JSON.stringify({ 
      error: 'User not found' 
    }), { status: 404 })
  }
  
  // Generate magic link token
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  
  await supabase.from('magic_links').insert({
    user_id: user.id,
    token: token,
    expires_at: expiresAt.toISOString()
  })
  
  // Send email with magic link
  const loginUrl = `${Deno.env.get('APP_URL')}/auth/verify?token=${token}`
  
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: 'noreply@your-domain.com' },
      subject: 'SOC5 Outbound - Login Link',
      content: [{
        type: 'text/html',
        value: `
          <h2>Login to SOC5 Outbound Tool</h2>
          <p>Click the link below to login (expires in 15 minutes):</p>
          <a href="${loginUrl}">Login Now</a>
        `
      }]
    })
  })
  
  return new Response(JSON.stringify({ 
    success: true,
    message: 'Login link sent to your email' 
  }))
})
```

### Step 2: Create Magic Links Table

```sql
CREATE TABLE magic_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_user_id ON magic_links(user_id);
```

### Step 3: Verify Magic Link

**Backend: supabase/functions/verify-magic-link/index.ts**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { token } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  const { data: link } = await supabase
    .from('magic_links')
    .select('*, users(*)')
    .eq('token', token)
    .is('used_at', null)
    .single()
  
  if (!link) {
    return new Response(JSON.stringify({ 
      error: 'Invalid or expired link' 
    }), { status: 400 })
  }
  
  if (new Date(link.expires_at) < new Date()) {
    return new Response(JSON.stringify({ 
      error: 'Link expired' 
    }), { status: 400 })
  }
  
  // Mark as used
  await supabase
    .from('magic_links')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
  
  // Generate JWT
  const jwt = await generateJWT(link.users)
  
  return new Response(JSON.stringify({
    success: true,
    user: link.users,
    token: jwt
  }))
})
```

### Step 4: Frontend Implementation

**src/pages/login.tsx**

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.endsWith('@shopeemobile-external.com')) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Only @shopeemobile-external.com emails allowed'
      })
      return
    }
    
    setLoading(true)
    
    const response = await fetch('/api/send-login-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    
    const data = await response.json()
    setLoading(false)
    
    if (data.success) {
      toast({
        title: 'Check Your Email',
        description: 'Login link sent! Check your inbox.'
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: data.error
      })
    }
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center">
          SOC5 Outbound Tool
        </h1>
        
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="email@shopeemobile-external.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Login Link'}
          </Button>
        </form>
        
        <p className="text-sm text-center text-muted-foreground">
          A secure login link will be sent to your email
        </p>
      </div>
    </div>
  )
}
```

---

## Backend Integration

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('FTE', 'BACKROOM', 'ADMIN')),
  ops_id TEXT,
  seatalk_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Auth sessions
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_auth_sessions_token ON auth_sessions(token);
```

### Environment Variables

**Complete .env file:**

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Email Domain
VITE_ALLOWED_EMAIL_DOMAIN=shopeemobile-external.com

# SeaTalk (if using)
VITE_SEATALK_APP_ID=provided_by_it
VITE_SEATALK_REDIRECT_URI=https://your-domain/auth/seatalk/callback

# Gmail OAuth (if using)
VITE_GOOGLE_CLIENT_ID=provided_by_it.apps.googleusercontent.com

# Magic Link (if using)
SENDGRID_API_KEY=your_sendgrid_key
APP_URL=https://your-domain.com
```

---

## Frontend Implementation

### Unified Login Component

**src/pages/login.tsx**

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Login() {
  const [email, setEmail] = useState('')
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8">
        <Tabs defaultValue="email">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="seatalk">SeaTalk</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email">
            <EmailLogin />
          </TabsContent>
          
          <TabsContent value="seatalk">
            <SeaTalkLogin />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

---

## Testing & Troubleshooting

### Test Email Authentication

```bash
curl -X POST http://localhost:54321/functions/v1/send-login-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@shopeemobile-external.com"}'
```

### Common Issues

**Issue**: Email not sending
**Solution**: Check SendGrid API key and verify sender email

**Issue**: Magic link expired
**Solution**: Links expire in 15 minutes, request new link

**Issue**: SeaTalk credentials not working
**Solution**: Verify credentials with IT department

### Debug Mode

```typescript
// Add to .env
VITE_DEBUG_AUTH=true

// Enable logging
if (import.meta.env.VITE_DEBUG_AUTH) {
  console.log('Auth attempt:', { email, timestamp: Date.now() })
}
```

---

## Summary

**Recommended Approach:**

1. **For FTE Users**: Request IT to set up SeaTalk OAuth
2. **For Backroom Users**: Use email magic link authentication
3. **Fallback**: Email-only with magic links for all users

This approach requires minimal admin access and relies on IT department support for OAuth setup.
