# Phase 3: Routing Migration

## Overview
This phase migrates from React Router to Next.js App Router, sets up the new file-based routing structure, creates layouts, and implements navigation components.

## Prerequisites
- Phase 1 and 2 completed successfully
- Authentication system working
- Basic project structure in place

---

## Step 1: App Router Structure Setup

### 1.1 Create Route Groups and Pages
```bash
# Create route group directories
mkdir -p app/\(auth\)/login
mkdir -p app/\(dashboard\)/dashboard
mkdir -p app/\(dashboard\)/dispatch-report
mkdir -p app/\(dashboard\)/prealert
mkdir -p app/\(dashboard\)/admin
mkdir -p app/\(dashboard\)/kpi
mkdir -p app/\(dashboard\)/midmile

# Create page files
touch app/\(auth\)/login/page.tsx
touch app/\(dashboard\)/dashboard/page.tsx
touch app/\(dashboard\)/dispatch-report/page.tsx
touch app/\(dashboard\)/prealert/page.tsx
touch app/\(dashboard\)/admin/page.tsx
touch app/\(dashboard\)/kpi/page.tsx
touch app/\(dashboard\)/midmile/page.tsx

# Create layout files
touch app/\(auth\)/layout.tsx
touch app/\(dashboard\)/layout.tsx

# Create loading and error pages
touch app/\(dashboard\)/loading.tsx
touch app/\(dashboard\)/error.tsx
touch app/\(dashboard\)/dashboard/loading.tsx
touch app/\(dashboard\)/dispatch-report/loading.tsx
```

---

## Step 2: Root Layout and Pages

### 2.1 Root Layout (`app/layout.tsx`)
```typescript
import type { Metadata } from 'next'
import { Inter, Instrument_Serif } from 'next/font/google'
import { AuthProvider } from '@/hooks/use-auth'
import { ThemeProvider } from '@/components/theme-provider'
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
  title: {
    default: 'Outbound Internal Tool',
    template: '%s | Outbound Internal Tool'
  },
  description: 'Enterprise dispatch operations management system',
  keywords: ['dispatch', 'operations', 'logistics', 'management', 'enterprise'],
  authors: [{ name: 'Your Company' }],
  creator: 'Your Company',
  publisher: 'Your Company',
  robots: {
    index: false,
    follow: false,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 2.2 Root Page (`app/page.tsx`)
```typescript
import { redirect } from 'next/navigation'

export default function HomePage() {
  // This will be handled by middleware, but adding as fallback
  redirect('/dashboard')
}
```

### 2.3 Global Loading (`app/loading.tsx`)
```typescript
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
```

### 2.4 Global Error (`app/error.tsx`)
```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-muted-foreground max-w-md">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
```

### 2.5 Not Found Page (`app/not-found.tsx`)
```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex space-x-4">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Step 3: Authentication Layout

### 3.1 Auth Layout (`app/(auth)/layout.tsx`)
```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Sign in to access your account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
```

### 3.2 Login Page (`app/(auth)/login/page.tsx`)
```typescript
import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import { ThemeToggle } from '@/components/theme-toggle'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to access the outbound operations dashboard',
}

export default function LoginPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Theme toggle */}
      <div className="absolute right-4 top-4 md:right-8 md:top-8">
        <ThemeToggle />
      </div>
      
      {/* Left side - Branding */}
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
            <footer className="text-sm">Operations Team</footer>
          </blockquote>
        </div>
      </div>
      
      {/* Right side - Login form */}
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
          <p className="px-8 text-center text-sm text-muted-foreground">
            Having trouble signing in?{" "}
            <a
              href="mailto:support@yourcompany.com"
              className="underline underline-offset-4 hover:text-primary"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## Step 4: Dashboard Layout and Navigation

### 4.1 Navigation Types (`types/navigation.ts`)
```typescript
import { LucideIcon } from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  disabled?: boolean
  external?: boolean
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export interface SidebarNavProps {
  items: NavGroup[]
}
```

### 4.2 Navigation Configuration (`lib/navigation.ts`)
```typescript
import {
  LayoutDashboard,
  FileText,
  Database,
  BarChart3,
  Users,
  Truck,
  Settings,
  Clock,
  UserCheck,
  FileSpreadsheet,
  Coffee,
  Calendar,
} from 'lucide-react'
import type { NavGroup } from '@/types/navigation'

export const navigationConfig: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Outbound Operations',
    items: [
      {
        title: 'Dispatch Report',
        href: '/dispatch-report',
        icon: FileText,
      },
      {
        title: 'Prealert Database',
        href: '/prealert',
        icon: Database,
      },
    ],
  },
  {
    title: 'Analytics',
    items: [
      {
        title: 'KPI & Compliance',
        href: '/kpi',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Midmile',
    items: [
      {
        title: 'Truck Requests',
        href: '/midmile',
        icon: Truck,
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        title: 'Attendance',
        href: '/admin/attendance',
        icon: UserCheck,
      },
      {
        title: 'Masterfile',
        href: '/admin/masterfile',
        icon: FileSpreadsheet,
      },
      {
        title: 'Breaktime',
        href: '/admin/breaktime',
        icon: Coffee,
      },
      {
        title: 'Leave Management',
        href: '/admin/leave',
        icon: Calendar,
      },
      {
        title: 'User Management',
        href: '/admin/users',
        icon: Users,
      },
    ],
  },
]

// Role-based navigation filtering
export function getNavigationForRole(role: string): NavGroup[] {
  if (role === 'admin') {
    return navigationConfig
  }
  
  if (role === 'data_team') {
    return navigationConfig.filter(group => 
      ['Overview', 'Outbound Operations', 'Analytics'].includes(group.title)
    )
  }
  
  // Regular user
  return navigationConfig.filter(group => 
    ['Overview', 'Outbound Operations'].includes(group.title)
  )
}
```

### 4.3 Sidebar Component (`components/layout/sidebar.tsx`)
```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { getNavigationForRole } from '@/lib/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { NavGroup } from '@/types/navigation'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  
  const navigation = user ? getNavigationForRole(user.role) : []

  // Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) {
      setCollapsed(JSON.parse(saved))
    }
  }, [])

  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  return (
    <div className={cn(
      "relative flex flex-col bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">OT</span>
            </div>
            <span className="font-semibold text-sm">Outbound Tool</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {navigation.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-9",
                          collapsed ? "px-2" : "px-3",
                          isActive && "bg-secondary text-secondary-foreground"
                        )}
                        disabled={item.disabled}
                      >
                        <Icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                        {!collapsed && (
                          <>
                            <span className="truncate">{item.title}</span>
                            {item.badge && (
                              <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User info */}
      {!collapsed && user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {user.first_name?.[0] || user.email[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.first_name ? `${user.first_name} ${user.last_name}` : user.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.ops_id} • {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 4.4 Header Component (`components/layout/header.tsx`)
```typescript
'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/hooks/use-auth'
import { User, Settings, LogOut, Bell } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold">
          {/* This will be updated based on current page */}
          Dashboard
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.first_name?.[0] || user?.email[0].toUpperCase()}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.ops_id} • {user?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

### 4.5 Dashboard Layout (`app/(dashboard)/layout.tsx`)
```typescript
import { Metadata } from 'next'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | Dashboard'
  },
  description: 'Outbound operations dashboard',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

---

## Step 5: Page Components

### 5.1 Dashboard Page (`app/(dashboard)/dashboard/page.tsx`)
```typescript
import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, FileText, Database, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Overview of your outbound operations and key metrics',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your operations.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dispatches</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              +5% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              +3 from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Dispatches</CardTitle>
            <CardDescription>
              Latest dispatch reports from your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Cluster ABC-{i}</p>
                    <p className="text-xs text-muted-foreground">
                      Processed by User {i} • 2 hours ago
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Completed
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors">
              <div className="font-medium">New Dispatch Report</div>
              <div className="text-sm text-muted-foreground">Create a new dispatch entry</div>
            </button>
            <button className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors">
              <div className="font-medium">View Prealerts</div>
              <div className="text-sm text-muted-foreground">Check pending reports</div>
            </button>
            <button className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors">
              <div className="font-medium">KPI Dashboard</div>
              <div className="text-sm text-muted-foreground">View performance metrics</div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### 5.2 Placeholder Pages

Create placeholder pages for other routes:

```typescript
// app/(dashboard)/dispatch-report/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dispatch Report',
  description: 'Create and manage dispatch reports',
}

export default function DispatchReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dispatch Report</h1>
        <p className="text-muted-foreground">
          Create and manage your dispatch reports.
        </p>
      </div>
      <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
        <p className="text-muted-foreground">
          Dispatch report functionality will be implemented in Phase 4.
        </p>
      </div>
    </div>
  )
}
```

```typescript
// app/(dashboard)/prealert/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prealert Database',
  description: 'View and manage prealert database',
}

export default function PrealertPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prealert Database</h1>
        <p className="text-muted-foreground">
          View and manage all dispatch reports in the database.
        </p>
      </div>
      <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
        <p className="text-muted-foreground">
          Prealert database functionality will be implemented in Phase 4.
        </p>
      </div>
    </div>
  )
}
```

---

## Step 6: Loading and Error States

### 6.1 Dashboard Loading (`app/(dashboard)/loading.tsx`)
```typescript
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3 p-6 border rounded-lg">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 space-y-4 p-6 border rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="col-span-3 space-y-4 p-6 border rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 6.2 Dashboard Error (`app/(dashboard)/error.tsx`)
```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Something went wrong while loading the dashboard.
        </p>
      </div>
      
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Error Loading Dashboard</span>
          </CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try refreshing the page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Step 7: Required UI Components

### 7.1 Skeleton Component (`components/ui/skeleton.tsx`)
```typescript
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

### 7.2 Scroll Area Component (`components/ui/scroll-area.tsx`)
```typescript
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
```

---

## Step 8: Testing and Verification

### 8.1 Test Navigation
```bash
# Start development server
npm run dev

# Test routes:
# http://localhost:3000 -> should redirect to /dashboard
# http://localhost:3000/login -> login page
# http://localhost:3000/dashboard -> dashboard page
# http://localhost:3000/dispatch-report -> placeholder page
# http://localhost:3000/prealert -> placeholder page
```

### 8.2 Test Authentication Flow
1. Access protected route without auth -> redirects to login
2. Login with valid credentials -> redirects to dashboard
3. Navigate between protected routes -> works without re-authentication
4. Logout -> redirects to login page

### 8.3 Test Responsive Design
- Test sidebar collapse/expand
- Test mobile responsiveness
- Test theme switching
- Test navigation highlighting

---

## Troubleshooting

### Common Issues

1. **Route Groups Not Working**
   ```bash
   # Ensure parentheses are properly escaped in directory names
   # Use mkdir -p "app/(auth)/login" on Unix systems
   ```

2. **Navigation Not Highlighting**
   ```typescript
   // Check usePathname() returns correct path
   // Verify href matches exactly
   ```

3. **Sidebar State Not Persisting**
   ```typescript
   // Check localStorage is available
   // Verify useEffect dependencies
   ```

4. **Layout Not Applied**
   ```typescript
   // Ensure layout.tsx is in correct directory
   // Check route group structure
   ```

---

## Phase 3 Completion Checklist

- [ ] App Router structure created
- [ ] Route groups configured
- [ ] Root layout implemented
- [ ] Authentication layout created
- [ ] Dashboard layout with sidebar and header
- [ ] Navigation system implemented
- [ ] All placeholder pages created
- [ ] Loading and error states implemented
- [ ] Required UI components built
- [ ] Routing tested and working
- [ ] Authentication flow verified
- [ ] Responsive design tested

## Next Steps

Once Phase 3 is complete, proceed to **Phase 4: Component & Feature Migration** to implement the actual functionality for each page and migrate existing components.