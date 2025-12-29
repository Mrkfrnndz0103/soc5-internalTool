# Phase 5: API Integration & Optimization

## Overview
This phase implements all API routes, optimizes database queries, adds caching strategies, and integrates with external services like Google Sheets. It also includes performance optimizations and error handling.

## Prerequisites
- Phase 1-4 completed successfully
- Supabase database configured
- All components and forms working

---

## Step 1: Complete API Routes Implementation

### 1.1 Enhanced Dispatch API (`app/api/dispatch/route.ts`)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dispatchFiltersSchema, bulkDispatchSchema } from '@/lib/validations'
import type { Database } from '@/lib/supabase'

// GET - Fetch dispatch reports with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = Object.fromEntries(searchParams.entries())
    
    // Validate filters
    const validatedFilters = dispatchFiltersSchema.parse(filters)
    
    // Check if export is requested
    const isExport = searchParams.get('export') === 'csv'

    let query = supabase
      .from('dispatch_reports')
      .select(`
        *,
        users!dispatch_reports_user_id_fkey(ops_id, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (validatedFilters.region) {
      query = query.eq('region', validatedFilters.region)
    }
    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status)
    }
    if (validatedFilters.start_date) {
      query = query.gte('created_at', validatedFilters.start_date)
    }
    if (validatedFilters.end_date) {
      query = query.lte('created_at', validatedFilters.end_date)
    }
    if (validatedFilters.cluster) {
      query = query.ilike('cluster', `%${validatedFilters.cluster}%`)
    }
    if (validatedFilters.processor) {
      query = query.ilike('processor', `%${validatedFilters.processor}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    // Handle CSV export
    if (isExport) {
      const csv = convertToCSV(data || [])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="dispatch-reports-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      filters: validatedFilters
    })
  } catch (error) {
    console.error('API error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filters', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new dispatch reports
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rows } = body
    
    // Validate data
    const validatedRows = bulkDispatchSchema.parse(rows)

    // Prepare data for insertion
    const insertData = validatedRows.map(row => ({
      ...row,
      user_id: user.id,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('dispatch_reports')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: 'Failed to create dispatch reports' }, { status: 500 })
    }

    // Trigger webhook to Google Sheets (optional)
    try {
      await triggerGoogleSheetsSync(data)
    } catch (webhookError) {
      console.error('Webhook error:', webhookError)
      // Don't fail the request if webhook fails
    }

    return NextResponse.json({
      data,
      message: `${data.length} dispatch report(s) created successfully`
    }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = [
    'ID', 'Created At', 'Cluster', 'Processor', 'Station', 'Region',
    'Dock Number', 'LH Trip', 'Plate Number', 'Fleet Size', 'Status',
    'Remarks', 'Created By'
  ]

  const rows = data.map(row => [
    row.id,
    new Date(row.created_at).toLocaleString(),
    row.cluster,
    row.processor,
    row.station,
    row.region,
    row.dock_number,
    row.lh_trip || '',
    row.plate_number || '',
    row.fleet_size || '',
    row.status,
    row.remarks || '',
    row.users?.ops_id || ''
  ])

  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
}

// Helper function to trigger Google Sheets sync
async function triggerGoogleSheetsSync(data: any[]) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, action: 'insert' })
  })
}
```

### 1.2 Lookups API - Clusters (`app/api/lookups/clusters/route.ts`)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/lib/supabase'

const querySchema = z.object({
  region: z.string().optional(),
  q: z.string().optional(), // search query
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { region, q } = querySchema.parse(Object.fromEntries(searchParams.entries()))

    let query = supabase
      .from('clusters')
      .select('*')
      .order('name')

    // Apply filters
    if (region) {
      query = query.eq('region', region)
    }
    if (q && q.length >= 3) {
      query = query.ilike('name', `%${q}%`)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('API error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 1.3 Lookups API - Processors (`app/api/lookups/processors/route.ts`)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/lib/supabase'

const querySchema = z.object({
  q: z.string().optional(),
  region: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { q, region } = querySchema.parse(Object.fromEntries(searchParams.entries()))

    let query = supabase
      .from('processors')
      .select('*')
      .order('name')

    if (region) {
      query = query.eq('region', region)
    }
    if (q && q.length >= 2) {
      query = query.ilike('name', `%${q}%`)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 1.4 KPI API - Dashboard Metrics (`app/api/kpi/dashboard/route.ts`)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date ranges
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    // Parallel queries for better performance
    const [
      totalDispatchesResult,
      todayDispatchesResult,
      monthlyDispatchesResult,
      lastMonthDispatchesResult,
      pendingReportsResult,
      completedTodayResult,
      activeUsersResult
    ] = await Promise.all([
      // Total dispatches
      supabase
        .from('dispatch_reports')
        .select('id', { count: 'exact', head: true }),
      
      // Today's dispatches
      supabase
        .from('dispatch_reports')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString()),
      
      // This month's dispatches
      supabase
        .from('dispatch_reports')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      
      // Last month's dispatches
      supabase
        .from('dispatch_reports')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString()),
      
      // Pending reports
      supabase
        .from('dispatch_reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // Completed today
      supabase
        .from('dispatch_reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', startOfToday.toISOString()),
      
      // Active users (users who created reports in last 24 hours)
      supabase
        .from('dispatch_reports')
        .select('user_id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])

    // Calculate metrics
    const totalDispatches = totalDispatchesResult.count || 0
    const todayDispatches = todayDispatchesResult.count || 0
    const monthlyDispatches = monthlyDispatchesResult.count || 0
    const lastMonthDispatches = lastMonthDispatchesResult.count || 0
    const pendingReports = pendingReportsResult.count || 0
    const completedToday = completedTodayResult.count || 0
    
    // Calculate unique active users
    const uniqueActiveUsers = new Set(
      activeUsersResult.data?.map(row => row.user_id) || []
    ).size

    // Calculate month-over-month change
    const monthlyChange = lastMonthDispatches > 0 
      ? ((monthlyDispatches - lastMonthDispatches) / lastMonthDispatches) * 100 
      : 0

    // Calculate completion rate (completed today / total today)
    const completionRate = todayDispatches > 0 
      ? (completedToday / todayDispatches) * 100 
      : 0

    const metrics = {
      totalDispatches: {
        value: totalDispatches,
        label: 'Total Dispatches',
        change: null
      },
      pendingReports: {
        value: pendingReports,
        label: 'Pending Reports',
        change: null
      },
      completionRate: {
        value: Math.round(completionRate * 10) / 10,
        label: 'Completion Rate',
        unit: '%',
        change: null
      },
      activeUsers: {
        value: uniqueActiveUsers,
        label: 'Active Users (24h)',
        change: null
      },
      monthlyDispatches: {
        value: monthlyDispatches,
        label: 'This Month',
        change: Math.round(monthlyChange * 10) / 10
      }
    }

    return NextResponse.json({ data: metrics })
  } catch (error) {
    console.error('KPI API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Step 2: Performance Optimizations

### 2.1 Database Indexes (Supabase SQL)
```sql
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dispatch_reports_created_at ON dispatch_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dispatch_reports_user_id ON dispatch_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_reports_status ON dispatch_reports(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_reports_region ON dispatch_reports(region);
CREATE INDEX IF NOT EXISTS idx_dispatch_reports_cluster ON dispatch_reports(cluster);
CREATE INDEX IF NOT EXISTS idx_dispatch_reports_processor ON dispatch_reports(processor);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_dispatch_reports_region_status ON dispatch_reports(region, status);
CREATE INDEX IF NOT EXISTS idx_dispatch_reports_created_at_status ON dispatch_reports(created_at DESC, status);

-- Indexes for lookup tables
CREATE INDEX IF NOT EXISTS idx_clusters_region ON clusters(region);
CREATE INDEX IF NOT EXISTS idx_clusters_name ON clusters(name);
CREATE INDEX IF NOT EXISTS idx_processors_region ON processors(region);
CREATE INDEX IF NOT EXISTS idx_processors_name ON processors(name);
```

### 2.2 Caching Utilities (`lib/cache.ts`)
```typescript
// Simple in-memory cache for API responses
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

export const apiCache = new SimpleCache()

// Cache key generators
export const cacheKeys = {
  clusters: (region?: string, query?: string) => 
    `clusters:${region || 'all'}:${query || 'all'}`,
  processors: (region?: string, query?: string) => 
    `processors:${region || 'all'}:${query || 'all'}`,
  dashboardMetrics: () => 'dashboard:metrics',
  dispatchReports: (filters: Record<string, any>) => 
    `dispatch:${JSON.stringify(filters)}`
}
```

### 2.3 Enhanced Clusters API with Caching (`app/api/lookups/clusters/route.ts`)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiCache, cacheKeys } from '@/lib/cache'
import type { Database } from '@/lib/supabase'

const querySchema = z.object({
  region: z.string().optional(),
  q: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { region, q } = querySchema.parse(Object.fromEntries(searchParams.entries()))

    // Check cache first
    const cacheKey = cacheKeys.clusters(region, q)
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      return NextResponse.json({ data: cachedData, cached: true })
    }

    let query = supabase
      .from('clusters')
      .select('*')
      .order('name')

    if (region) {
      query = query.eq('region', region)
    }
    if (q && q.length >= 3) {
      query = query.ilike('name', `%${q}%`)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    // Cache the result for 5 minutes
    apiCache.set(cacheKey, data || [], 300)

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('API error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Step 3: Real-time Features

### 3.1 Real-time Hook (`hooks/use-realtime.ts`)
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase'

export function useRealtimeDispatchReports() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    // Initial fetch
    const fetchInitialData = async () => {
      const { data: initialData } = await supabase
        .from('dispatch_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      setData(initialData || [])
      setLoading(false)
    }

    fetchInitialData()

    // Set up real-time subscription
    const subscription = supabase
      .channel('dispatch_reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dispatch_reports'
        },
        (payload) => {
          console.log('Real-time update:', payload)
          
          if (payload.eventType === 'INSERT') {
            setData(prev => [payload.new as any, ...prev.slice(0, 9)])
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new as any : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { data, loading }
}
```

### 3.2 Real-time Dashboard Component (`components/dashboard/realtime-activity.tsx`)
```typescript
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRealtimeDispatchReports } from '@/hooks/use-realtime'
import { formatDateTime } from '@/lib/utils'
import { Activity, Clock } from 'lucide-react'

export function RealtimeActivity() {
  const { data: recentReports, loading } = useRealtimeDispatchReports()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Loading recent dispatch reports...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-2 h-2 bg-muted rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-4 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Recent Activity</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </CardTitle>
        <CardDescription>
          Live updates from dispatch operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentReports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          ) : (
            recentReports.map((report) => (
              <div key={report.id} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {report.cluster} → {report.processor}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(report.created_at)}</span>
                    <span>•</span>
                    <span>{report.region}</span>
                  </div>
                </div>
                <Badge variant={
                  report.status === 'completed' ? 'default' :
                  report.status === 'ongoing' ? 'secondary' : 'outline'
                }>
                  {report.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Step 4: Error Handling and Logging

### 4.1 Error Handling Utilities (`lib/errors.ts`)
```typescript
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class DatabaseError extends APIError {
  constructor(message: string, public originalError?: any) {
    super(message, 500, 'DATABASE_ERROR')
    this.name = 'DatabaseError'
  }
}

export function handleAPIError(error: unknown): Response {
  console.error('API Error:', error)

  if (error instanceof APIError) {
    return Response.json(
      { 
        error: error.message, 
        code: error.code,
        ...(error instanceof ValidationError && { details: error.details })
      },
      { status: error.statusCode }
    )
  }

  // Default error response
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

### 4.2 Enhanced API with Error Handling (`app/api/dispatch/route.ts`)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dispatchFiltersSchema, bulkDispatchSchema } from '@/lib/validations'
import { APIError, ValidationError, AuthenticationError, DatabaseError, handleAPIError } from '@/lib/errors'
import { apiCache, cacheKeys } from '@/lib/cache'
import type { Database } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const filters = Object.fromEntries(searchParams.entries())
    
    // Validate filters
    let validatedFilters
    try {
      validatedFilters = dispatchFiltersSchema.parse(filters)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid filters', error.errors)
      }
      throw error
    }
    
    // Check cache first (for non-export requests)
    const isExport = searchParams.get('export') === 'csv'
    if (!isExport) {
      const cacheKey = cacheKeys.dispatchReports(validatedFilters)
      const cachedData = apiCache.get(cacheKey)
      if (cachedData) {
        return NextResponse.json(cachedData)
      }
    }

    let query = supabase
      .from('dispatch_reports')
      .select(`
        *,
        users!dispatch_reports_user_id_fkey(ops_id, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (validatedFilters.region) {
      query = query.eq('region', validatedFilters.region)
    }
    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status)
    }
    if (validatedFilters.start_date) {
      query = query.gte('created_at', validatedFilters.start_date)
    }
    if (validatedFilters.end_date) {
      query = query.lte('created_at', validatedFilters.end_date)
    }
    if (validatedFilters.cluster) {
      query = query.ilike('cluster', `%${validatedFilters.cluster}%`)
    }
    if (validatedFilters.processor) {
      query = query.ilike('processor', `%${validatedFilters.processor}%`)
    }

    const { data, error, count } = await query

    if (error) {
      throw new DatabaseError('Failed to fetch dispatch reports', error)
    }

    const result = {
      data: data || [],
      count: count || 0,
      filters: validatedFilters
    }

    // Handle CSV export
    if (isExport) {
      const csv = convertToCSV(data || [])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="dispatch-reports-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Cache the result for 2 minutes
    if (!isExport) {
      const cacheKey = cacheKeys.dispatchReports(validatedFilters)
      apiCache.set(cacheKey, result, 120)
    }

    return NextResponse.json(result)
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    const { rows } = body
    
    // Validate data
    let validatedRows
    try {
      validatedRows = bulkDispatchSchema.parse(rows)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid dispatch data', error.errors)
      }
      throw error
    }

    // Prepare data for insertion
    const insertData = validatedRows.map(row => ({
      ...row,
      user_id: user.id,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('dispatch_reports')
      .insert(insertData)
      .select()

    if (error) {
      throw new DatabaseError('Failed to create dispatch reports', error)
    }

    // Clear relevant caches
    apiCache.clear() // Simple approach - clear all caches

    // Trigger webhook to Google Sheets (optional)
    try {
      await triggerGoogleSheetsSync(data)
    } catch (webhookError) {
      console.error('Webhook error:', webhookError)
      // Don't fail the request if webhook fails
    }

    return NextResponse.json({
      data,
      message: `${data.length} dispatch report(s) created successfully`
    }, { status: 201 })
  } catch (error) {
    return handleAPIError(error)
  }
}

// Helper functions remain the same...
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = [
    'ID', 'Created At', 'Cluster', 'Processor', 'Station', 'Region',
    'Dock Number', 'LH Trip', 'Plate Number', 'Fleet Size', 'Status',
    'Remarks', 'Created By'
  ]

  const rows = data.map(row => [
    row.id,
    new Date(row.created_at).toLocaleString(),
    row.cluster,
    row.processor,
    row.station,
    row.region,
    row.dock_number,
    row.lh_trip || '',
    row.plate_number || '',
    row.fleet_size || '',
    row.status,
    row.remarks || '',
    row.users?.ops_id || ''
  ])

  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
}

async function triggerGoogleSheetsSync(data: any[]) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, action: 'insert' })
  })
}
```

---

## Step 5: Google Sheets Integration

### 5.1 Google Sheets Webhook (`app/api/webhooks/google-sheets/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const webhookSchema = z.object({
  data: z.array(z.any()),
  action: z.enum(['insert', 'update', 'delete']),
  sheet: z.string().optional().default('Dispatch Reports')
})

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get('x-webhook-signature')
    const expectedSignature = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET
    
    if (expectedSignature && signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = await request.json()
    const { data, action, sheet } = webhookSchema.parse(body)

    // Call Google Apps Script Web App
    const gasWebAppUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    if (!gasWebAppUrl) {
      console.warn('Google Apps Script Web App URL not configured')
      return NextResponse.json({ message: 'Webhook received but not processed' })
    }

    const response = await fetch(gasWebAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        sheet,
        data: data.map(row => ({
          id: row.id,
          created_at: row.created_at,
          cluster: row.cluster,
          processor: row.processor,
          station: row.station,
          region: row.region,
          dock_number: row.dock_number,
          lh_trip: row.lh_trip || '',
          plate_number: row.plate_number || '',
          fleet_size: row.fleet_size || '',
          status: row.status,
          remarks: row.remarks || '',
          user_id: row.user_id
        }))
      })
    })

    if (!response.ok) {
      throw new Error(`Google Sheets sync failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    return NextResponse.json({
      message: 'Google Sheets sync completed',
      result
    })
  } catch (error) {
    console.error('Google Sheets webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
```

### 5.2 Google Apps Script Code (`google-sheets-integration.gs`)
```javascript
// This code goes in Google Apps Script
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { action, sheet, data: rows } = data;
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const worksheet = spreadsheet.getSheetByName(sheet) || spreadsheet.insertSheet(sheet);
    
    if (action === 'insert') {
      // Add headers if sheet is empty
      if (worksheet.getLastRow() === 0) {
        const headers = [
          'ID', 'Created At', 'Cluster', 'Processor', 'Station', 'Region',
          'Dock Number', 'LH Trip', 'Plate Number', 'Fleet Size', 'Status',
          'Remarks', 'User ID'
        ];
        worksheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
      
      // Insert new rows
      const values = rows.map(row => [
        row.id,
        new Date(row.created_at),
        row.cluster,
        row.processor,
        row.station,
        row.region,
        row.dock_number,
        row.lh_trip,
        row.plate_number,
        row.fleet_size,
        row.status,
        row.remarks,
        row.user_id
      ]);
      
      const lastRow = worksheet.getLastRow();
      worksheet.getRange(lastRow + 1, 1, values.length, values[0].length).setValues(values);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, rowsProcessed: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing webhook:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## Step 6: Environment Variables Update

### 6.1 Updated Environment Variables (`.env.local`)
```bash
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Sheets Integration
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/your-script-id/exec
GOOGLE_SHEETS_WEBHOOK_SECRET=your-webhook-secret
GOOGLE_SHEETS_WEBHOOK_URL=https://your-domain.com/api/webhooks/google-sheets

# Performance and Caching
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_CACHE_TTL=300

# Monitoring and Logging
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_LOG_LEVEL=info
```

---

## Phase 5 Completion Checklist

- [ ] All API routes implemented with proper error handling
- [ ] Database indexes created for performance
- [ ] Caching system implemented
- [ ] Real-time features added
- [ ] Error handling and logging utilities
- [ ] Google Sheets integration configured
- [ ] Performance optimizations applied
- [ ] Environment variables updated
- [ ] API endpoints tested
- [ ] Real-time updates working
- [ ] CSV export functionality verified
- [ ] Google Sheets sync tested

## Next Steps

Once Phase 5 is complete, proceed to **Phase 6: Testing & Deployment** to perform comprehensive testing and deploy the application to production.