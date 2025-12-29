# Phase 2: Authentication & Middleware

## Overview
This phase implements authentication using Supabase Auth Helpers for Next.js, sets up middleware for route protection, and creates the authentication context and hooks.

## Prerequisites
- Phase 1 completed successfully
- Supabase project configured
- Environment variables set up

---

## Step 1: Supabase Auth Helpers Setup

### 1.1 Install Additional Dependencies
```bash
# Install Supabase Auth Helpers for Next.js
npm install @supabase/auth-helpers-nextjs @supabase/auth-helpers-react

# Install additional UI components for auth
npm install @radix-ui/react-label @radix-ui/react-toast
```

### 1.2 Enhanced Supabase Client (`lib/supabase.ts`)
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'

// Client-side Supabase client (for use in Client Components)
export const createClient = () => createClientComponentClient()

// Server-side Supabase client (for use in Server Components)
export const createServerClient = () => createServerComponentClient({ cookies })

// Route handler Supabase client (for use in API routes)
export const createRouteClient = () => createRouteHandlerClient({ cookies })

// Middleware Supabase client (for use in middleware)
export const createMiddlewareClient = (req: NextRequest, res: NextResponse) => 
  createMiddlewareClient({ req, res })

// Enhanced Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          ops_id: string
          role: 'admin' | 'user' | 'data_team'
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          email: string
          ops_id: string
          role?: 'admin' | 'user' | 'data_team'
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          ops_id?: string
          role?: 'admin' | 'user' | 'data_team'
          first_name?: string | null
          last_name?: string | null
          updated_at?: string
          last_login?: string | null
        }
      }
      dispatch_reports: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          cluster: string
          processor: string
          station: string
          region: string
          dock_number: string
          status: 'pending' | 'ongoing' | 'completed'
          lh_trip: string | null
          plate_number: string | null
          fleet_size: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          cluster: string
          processor: string
          station: string
          region: string
          dock_number: string
          status?: 'pending' | 'ongoing' | 'completed'
          lh_trip?: string | null
          plate_number?: string | null
          fleet_size?: number | null
        }
        Update: {
          id?: string
          updated_at?: string
          cluster?: string
          processor?: string
          station?: string
          region?: string
          dock_number?: string
          status?: 'pending' | 'ongoing' | 'completed'
          lh_trip?: string | null
          plate_number?: string | null
          fleet_size?: number | null
        }
      }
    }
  }
}
```

---

## Step 2: Authentication Middleware

### 2.1 Create Middleware (`middleware.ts`)
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define route patterns
  const protectedPaths = [
    '/dashboard',
    '/dispatch-report',
    '/prealert',
    '/admin',
    '/kpi',
    '/midmile'
  ]
  
  const authPaths = ['/login', '/signup']
  const publicPaths = ['/', '/about', '/contact']

  const { pathname } = req.nextUrl

  // Check if current path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  )
  
  // Check if current path is auth-related
  const isAuthPath = authPaths.some(path => 
    pathname.startsWith(path)
  )

  // Check if current path is public
  const isPublicPath = publicPaths.includes(pathname)

  // Redirect to login if accessing protected route without session
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth pages with valid session
  if (isAuthPath && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect root to dashboard if authenticated, otherwise to login
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } else {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // For protected routes, verify user exists in database
  if (isProtectedPath && session) {
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      // User not found in database, sign out and redirect to login
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Add user role to headers for use in components
    res.headers.set('x-user-role', user.role)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

---

## Step 3: Authentication Context & Hooks

### 3.1 Authentication Types (`types/auth.ts`)
```typescript
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  email: string
  ops_id: string
  role: 'admin' | 'user' | 'data_team'
  first_name: string | null
  last_name: string | null
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials extends LoginCredentials {
  ops_id: string
  first_name?: string
  last_name?: string
}
```

### 3.2 Authentication Hook (`hooks/use-auth.ts`)
```typescript
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'
import type { User, AuthContextType } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          setSupabaseUser(authUser)
          
          // Fetch user profile from database
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (userProfile) {
            setUser(userProfile)
            
            // Update last login
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', authUser.id)
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setSupabaseUser(session.user)
          
          // Fetch user profile
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (userProfile) {
            setUser(userProfile)
          }
          
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSupabaseUser(null)
          setLoading(false)
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      // Get redirect URL from query params
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirectTo') || '/dashboard'
      
      router.push(redirectTo)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setSupabaseUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (newPassword: string) => {
    if (!supabaseUser) throw new Error('No user logged in')
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in')
    
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (error) throw error
    
    // Update local state
    setUser(prev => prev ? { ...prev, ...updates } : null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      supabaseUser,
      loading,
      signIn,
      signOut,
      changePassword,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

---

## Step 4: Authentication API Routes

### 4.1 Login API Route (`app/api/auth/login/route.ts`)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/lib/supabase'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Fetch user profile
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)

    return NextResponse.json({
      user: data.user,
      profile: userProfile,
      session: data.session,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 4.2 Logout API Route (`app/api/auth/logout/route.ts`)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 4.3 Change Password API Route (`app/api/auth/change-password/route.ts`)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/lib/supabase'

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { newPassword } = changePasswordSchema.parse(body)

    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Step 5: UI Components for Authentication

### 5.1 Button Component (`components/ui/button.tsx`)
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 5.2 Input Component (`components/ui/input.tsx`)
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
```

### 5.3 Label Component (`components/ui/label.tsx`)
```typescript
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

---

## Step 6: Login Form Component

### 6.1 Login Form (`components/auth/login-form.tsx`)
```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const { signIn, loading } = useAuth()
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null)
      await signIn(data.email, data.password)
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          {...form.register('password')}
          error={form.formState.errors.password?.message}
          disabled={loading}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
    </form>
  )
}
```

---

## Step 7: Testing Authentication

### 7.1 Create Test Login Page (`app/(auth)/login/page.tsx`)
```typescript
import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Login - Outbound Internal Tool',
  description: 'Sign in to access the outbound operations dashboard',
}

export default function LoginPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Outbound Internal Tool
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Streamlining dispatch operations with enterprise-grade tools and real-time insights."
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the dashboard
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
```

### 7.2 Update Root Layout (`app/layout.tsx`)
```typescript
import type { Metadata } from 'next'
import { Inter, Instrument_Serif } from 'next/font/google'
import { AuthProvider } from '@/hooks/use-auth'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans'
})

const instrumentSerif = Instrument_Serif({ 
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-serif'
})

export const metadata: Metadata = {
  title: 'Outbound Internal Tool',
  description: 'Enterprise dispatch operations management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${instrumentSerif.variable} font-sans`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

## Step 8: Verification & Testing

### 8.1 Test Authentication Flow
```bash
# Start development server
npm run dev

# Navigate to http://localhost:3000
# Should redirect to /login

# Test login with valid credentials
# Should redirect to /dashboard (will show error until Phase 3)

# Test accessing protected routes without auth
# Should redirect to /login
```

### 8.2 Test Middleware Protection
```bash
# Try accessing protected routes directly:
# http://localhost:3000/dashboard
# http://localhost:3000/dispatch-report
# Should redirect to login
```

### 8.3 Verify Database Integration
```sql
-- Check if users table exists in Supabase
SELECT * FROM users LIMIT 5;

-- Create test user if needed
INSERT INTO users (id, email, ops_id, role, first_name, last_name)
VALUES (
  'test-user-id',
  'test@example.com',
  'TEST001',
  'user',
  'Test',
  'User'
);
```

---

## Troubleshooting

### Common Issues

1. **Middleware Not Working**
   ```bash
   # Check middleware.ts is in root directory
   # Verify matcher configuration
   # Restart development server
   ```

2. **Authentication Context Errors**
   ```typescript
   // Ensure AuthProvider wraps the entire app
   // Check useAuth is called within AuthProvider
   ```

3. **Supabase Connection Issues**
   ```bash
   # Verify environment variables
   # Check Supabase project URL and keys
   # Ensure RLS policies are configured
   ```

4. **TypeScript Errors**
   ```bash
   # Update database types
   # Check import paths
   # Restart TypeScript server
   ```

---

## Phase 2 Completion Checklist

- [ ] Supabase Auth Helpers installed and configured
- [ ] Middleware created and protecting routes
- [ ] Authentication context and hooks implemented
- [ ] API routes for auth operations created
- [ ] UI components for authentication built
- [ ] Login form component created
- [ ] Authentication flow tested
- [ ] Route protection verified
- [ ] Database integration confirmed
- [ ] Error handling implemented

## Next Steps

Once Phase 2 is complete, proceed to **Phase 3: Routing Migration** to set up the App Router structure and migrate all pages.