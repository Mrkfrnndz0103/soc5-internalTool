# Phase 4: Component & Feature Migration

## Overview
This phase migrates all existing components and features from the Vite + React application to Next.js, implementing the core functionality for dispatch reports, prealert database, KPI dashboard, and admin features.

## Prerequisites
- Phase 1, 2, and 3 completed successfully
- Authentication and routing working
- Basic UI components in place

---

## Step 1: Enhanced Type Definitions

### 1.1 Dispatch Types (`types/dispatch.ts`)
```typescript
export interface DispatchReport {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  cluster: string
  processor: string
  station: string
  region: string
  dock_number: string
  lh_trip?: string
  plate_number?: string
  fleet_size?: number
  status: 'pending' | 'ongoing' | 'completed'
  remarks?: string
}

export interface DispatchFormData {
  cluster: string
  processor: string
  station: string
  region: string
  dock_number: string
  lh_trip?: string
  plate_number?: string
  fleet_size?: number
  remarks?: string
}

export interface ClusterOption {
  id: string
  name: string
  region: string
  hubs: string[]
}

export interface ProcessorOption {
  id: string
  name: string
  region: string
}

export interface DispatchFilters {
  region?: string
  status?: string
  start_date?: string
  end_date?: string
  cluster?: string
  processor?: string
}
```

### 1.2 KPI Types (`types/kpi.ts`)
```typescript
export interface KPIMetric {
  id: string
  name: string
  value: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change_percentage: number
  last_updated: string
}

export interface ProductivityData {
  date: string
  dispatches_completed: number
  target_dispatches: number
  efficiency_rate: number
  average_processing_time: number
}

export interface MDTData {
  station: string
  region: string
  mdt_score: number
  target_score: number
  compliance_rate: number
  last_updated: string
}

export interface WorkstationData {
  workstation_id: string
  operator: string
  status: 'active' | 'idle' | 'offline'
  current_task?: string
  productivity_score: number
  last_activity: string
}
```

---

## Step 2: Validation Schemas

### 2.1 Dispatch Validation (`lib/validations.ts`)
```typescript
import { z } from 'zod'

export const dispatchReportSchema = z.object({
  cluster: z.string().min(1, 'Cluster is required'),
  processor: z.string().min(1, 'Processor is required'),
  station: z.string().min(1, 'Station is required'),
  region: z.string().min(1, 'Region is required'),
  dock_number: z.string().min(1, 'Dock number is required'),
  lh_trip: z.string().optional(),
  plate_number: z.string().optional(),
  fleet_size: z.number().min(1).max(100).optional(),
  remarks: z.string().max(500).optional(),
})

export const dispatchFiltersSchema = z.object({
  region: z.string().optional(),
  status: z.enum(['pending', 'ongoing', 'completed']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  cluster: z.string().optional(),
  processor: z.string().optional(),
})

export const bulkDispatchSchema = z.array(dispatchReportSchema).max(10, 'Maximum 10 rows allowed')
```

---

## Step 3: Custom Hooks

### 3.1 Local Storage Hook (`hooks/use-local-storage.ts`)
```typescript
'use client'

import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}
```

### 3.2 Auto-save Hook (`hooks/use-auto-save.ts`)
```typescript
'use client'

import { useEffect, useRef } from 'react'
import { useLocalStorage } from './use-local-storage'

export function useAutoSave<T>(
  key: string,
  data: T,
  interval: number = 10000 // 10 seconds
) {
  const [savedData, setSavedData] = useLocalStorage<T | null>(key, null)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (data) {
        setSavedData(data)
      }
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [data, interval, setSavedData])

  const clearSaved = () => {
    setSavedData(null)
  }

  return { savedData, clearSaved }
}
```

### 3.3 Debounce Hook (`hooks/use-debounce.ts`)
```typescript
'use client'

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

---

## Step 4: Enhanced UI Components

### 4.1 Data Table Component (`components/ui/data-table.tsx`)
```typescript
'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### 4.2 Combobox Component (`components/ui/combobox.tsx`)
```typescript
'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ComboboxProps {
  options: { value: string; label: string }[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={(currentValue) => {
                  onValueChange(currentValue === value ? "" : currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

---

## Step 5: Dispatch Report Implementation

### 5.1 Dispatch Form Component (`components/forms/dispatch-form.tsx`)
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useDebounce } from '@/hooks/use-debounce'
import { bulkDispatchSchema } from '@/lib/validations'
import { Plus, Trash2, Save, Send } from 'lucide-react'
import type { DispatchFormData, ClusterOption, ProcessorOption } from '@/types/dispatch'

interface DispatchFormProps {
  onSubmit: (data: DispatchFormData[]) => Promise<void>
  clusters: ClusterOption[]
  processors: ProcessorOption[]
  loading?: boolean
}

export function DispatchForm({ onSubmit, clusters, processors, loading = false }: DispatchFormProps) {
  const [submitting, setSubmitting] = useState(false)
  
  const form = useForm({
    resolver: zodResolver(bulkDispatchSchema),
    defaultValues: {
      rows: [
        {
          cluster: '',
          processor: '',
          station: '',
          region: '',
          dock_number: '',
          lh_trip: '',
          plate_number: '',
          fleet_size: undefined,
          remarks: '',
        }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rows'
  })

  // Auto-save functionality
  const watchedData = form.watch()
  const debouncedData = useDebounce(watchedData, 1000)
  const { savedData, clearSaved } = useAutoSave('dispatch-draft', debouncedData)

  // Load saved data on mount
  useEffect(() => {
    if (savedData && savedData.rows?.length > 0) {
      form.reset(savedData)
    }
  }, [savedData, form])

  const handleSubmit = async (data: { rows: DispatchFormData[] }) => {
    setSubmitting(true)
    try {
      await onSubmit(data.rows)
      form.reset()
      clearSaved()
    } catch (error) {
      console.error('Submit error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const addRow = () => {
    if (fields.length < 10) {
      append({
        cluster: '',
        processor: '',
        station: '',
        region: '',
        dock_number: '',
        lh_trip: '',
        plate_number: '',
        fleet_size: undefined,
        remarks: '',
      })
    }
  }

  const removeRow = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dispatch Report</h2>
          <p className="text-muted-foreground">
            Create dispatch reports (max 10 rows per session)
          </p>
        </div>
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={addRow} disabled={fields.length >= 10}>
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
          <Button type="submit" disabled={submitting || loading}>
            {submitting ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit All
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Row {index + 1}</CardTitle>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Cluster *</Label>
                <Combobox
                  options={clusters.map(c => ({ value: c.id, label: c.name }))}
                  value={form.watch(`rows.${index}.cluster`)}
                  onValueChange={(value) => {
                    form.setValue(`rows.${index}.cluster`, value)
                    // Auto-fill region based on cluster
                    const cluster = clusters.find(c => c.id === value)
                    if (cluster) {
                      form.setValue(`rows.${index}.region`, cluster.region)
                    }
                  }}
                  placeholder="Select cluster"
                />
                {form.formState.errors.rows?.[index]?.cluster && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.rows[index]?.cluster?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Processor *</Label>
                <Combobox
                  options={processors.map(p => ({ value: p.id, label: p.name }))}
                  value={form.watch(`rows.${index}.processor`)}
                  onValueChange={(value) => form.setValue(`rows.${index}.processor`, value)}
                  placeholder="Select processor"
                />
                {form.formState.errors.rows?.[index]?.processor && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.rows[index]?.processor?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Station *</Label>
                <Input
                  {...form.register(`rows.${index}.station`)}
                  placeholder="Enter station"
                />
                {form.formState.errors.rows?.[index]?.station && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.rows[index]?.station?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Region *</Label>
                <Input
                  {...form.register(`rows.${index}.region`)}
                  placeholder="Auto-filled"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label>Dock Number *</Label>
                <Input
                  {...form.register(`rows.${index}.dock_number`)}
                  placeholder="Enter dock number"
                />
                {form.formState.errors.rows?.[index]?.dock_number && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.rows[index]?.dock_number?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>LH Trip</Label>
                <Input
                  {...form.register(`rows.${index}.lh_trip`)}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label>Plate Number</Label>
                <Input
                  {...form.register(`rows.${index}.plate_number`)}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label>Fleet Size</Label>
                <Input
                  type="number"
                  {...form.register(`rows.${index}.fleet_size`, { valueAsNumber: true })}
                  placeholder="Optional"
                  min="1"
                  max="100"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Remarks</Label>
                <Input
                  {...form.register(`rows.${index}.remarks`)}
                  placeholder="Optional remarks"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {savedData && (
        <div className="bg-muted/50 border border-muted-foreground/25 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            ✓ Draft auto-saved • Last saved: {new Date().toLocaleTimeString()}
          </p>
        </div>
      )}
    </form>
  )
}
```

### 5.2 Dispatch Report Page (`app/(dashboard)/dispatch-report/page.tsx`)
```typescript
import { Metadata } from 'next'
import { Suspense } from 'react'
import { DispatchReportClient } from './dispatch-report-client'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Dispatch Report',
  description: 'Create and manage dispatch reports',
}

export default function DispatchReportPage() {
  return (
    <Suspense fallback={<DispatchReportSkeleton />}>
      <DispatchReportClient />
    </Suspense>
  )
}

function DispatchReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 5.3 Dispatch Report Client (`app/(dashboard)/dispatch-report/dispatch-report-client.tsx`)
```typescript
'use client'

import { useState, useEffect } from 'react'
import { DispatchForm } from '@/components/forms/dispatch-form'
import { useToast } from '@/hooks/use-toast'
import type { DispatchFormData, ClusterOption, ProcessorOption } from '@/types/dispatch'

export function DispatchReportClient() {
  const [clusters, setClusters] = useState<ClusterOption[]>([])
  const [processors, setProcessors] = useState<ProcessorOption[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clustersRes, processorsRes] = await Promise.all([
          fetch('/api/lookups/clusters'),
          fetch('/api/lookups/processors')
        ])

        if (clustersRes.ok && processorsRes.ok) {
          const [clustersData, processorsData] = await Promise.all([
            clustersRes.json(),
            processorsRes.json()
          ])
          
          setClusters(clustersData.data || [])
          setProcessors(processorsData.data || [])
        }
      } catch (error) {
        console.error('Error fetching lookup data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load form data. Please refresh the page.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleSubmit = async (data: DispatchFormData[]) => {
    try {
      const response = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: data }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit dispatch reports')
      }

      const result = await response.json()
      
      toast({
        title: 'Success',
        description: `${data.length} dispatch report(s) submitted successfully.`,
      })

      return result
    } catch (error) {
      console.error('Submit error:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit dispatch reports. Please try again.',
        variant: 'destructive',
      })
      throw error
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <DispatchForm
      onSubmit={handleSubmit}
      clusters={clusters}
      processors={processors}
      loading={loading}
    />
  )
}
```

---

## Step 6: Prealert Database Implementation

### 6.1 Prealert Filters (`components/forms/prealert-filters.tsx`)
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, Download } from 'lucide-react'
import type { DispatchFilters } from '@/types/dispatch'

interface PrealertFiltersProps {
  filters: DispatchFilters
  onFiltersChange: (filters: DispatchFilters) => void
  onExport: () => void
  loading?: boolean
}

export function PrealertFilters({ filters, onFiltersChange, onExport, loading = false }: PrealertFiltersProps) {
  const [localFilters, setLocalFilters] = useState<DispatchFilters>(filters)

  const handleFilterChange = (key: keyof DispatchFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined }
    setLocalFilters(newFilters)
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
  }

  const clearFilters = () => {
    const emptyFilters: DispatchFilters = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Region</Label>
            <Select
              value={localFilters.region || ''}
              onValueChange={(value) => handleFilterChange('region', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All regions</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={localFilters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={localFilters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={localFilters.end_date || ''}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={applyFilters} disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>
          <Button variant="outline" onClick={onExport} disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 6.2 Prealert Page (`app/(dashboard)/prealert/page.tsx`)
```typescript
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { PrealertFilters } from '@/components/forms/prealert-filters'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { ColumnDef } from '@tanstack/react-table'
import type { DispatchReport, DispatchFilters } from '@/types/dispatch'

const columns: ColumnDef<DispatchReport>[] = [
  {
    accessorKey: 'created_at',
    header: 'Date Created',
    cell: ({ row }) => formatDateTime(row.getValue('created_at')),
  },
  {
    accessorKey: 'cluster',
    header: 'Cluster',
  },
  {
    accessorKey: 'processor',
    header: 'Processor',
  },
  {
    accessorKey: 'station',
    header: 'Station',
  },
  {
    accessorKey: 'region',
    header: 'Region',
  },
  {
    accessorKey: 'dock_number',
    header: 'Dock #',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant={
          status === 'completed' ? 'default' :
          status === 'ongoing' ? 'secondary' : 'outline'
        }>
          {status}
        </Badge>
      )
    },
  },
]

export default function PrealertPage() {
  const [data, setData] = useState<DispatchReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DispatchFilters>({})
  const { toast } = useToast()

  const fetchData = async (currentFilters: DispatchFilters = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`/api/dispatch?${params}`)
      if (!response.ok) throw new Error('Failed to fetch data')

      const result = await response.json()
      setData(result.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dispatch reports.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(filters)
  }, [])

  const handleFiltersChange = (newFilters: DispatchFilters) => {
    setFilters(newFilters)
    fetchData(newFilters)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      params.append('export', 'csv')

      const response = await fetch(`/api/dispatch?${params}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dispatch-reports-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'Data exported successfully.',
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Error',
        description: 'Failed to export data.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prealert Database</h1>
        <p className="text-muted-foreground">
          View and manage all dispatch reports in the database.
        </p>
      </div>

      <PrealertFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        loading={loading}
      />

      <DataTable
        columns={columns}
        data={data}
        searchKey="cluster"
        searchPlaceholder="Search by cluster..."
      />
    </div>
  )
}
```

---

## Step 7: Required Dependencies

### 7.1 Install Additional Packages
```bash
# Data table functionality
npm install @tanstack/react-table

# Command palette and popover
npm install @radix-ui/react-command @radix-ui/react-popover

# Toast notifications
npm install @radix-ui/react-toast

# Select component
npm install @radix-ui/react-select

# Additional utilities
npm install date-fns
```

---

## Phase 4 Completion Checklist

- [ ] Enhanced type definitions created
- [ ] Validation schemas implemented
- [ ] Custom hooks for auto-save and debounce
- [ ] Enhanced UI components (DataTable, Combobox)
- [ ] Dispatch form with auto-save functionality
- [ ] Prealert database with filtering and export
- [ ] All required dependencies installed
- [ ] Components tested and working
- [ ] Auto-save functionality verified
- [ ] Data table sorting and filtering working
- [ ] CSV export functionality implemented

## Next Steps

Once Phase 4 is complete, proceed to **Phase 5: API Integration & Optimization** to implement all API routes and optimize performance.