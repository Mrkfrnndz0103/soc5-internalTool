export type AuthUser = {
  ops_id?: string
  name: string
  role: "FTE" | "Backroom" | "Data Team" | "Admin"
  email?: string
  department?: string
}

export type AuthSessionResponse = {
  user: AuthUser
}

type ApiResult<T> = { data?: T; error?: string; status?: number; details?: any }
export type ListResponse<T> = {
  total: number
  limit: number
  offset: number
  rows: T[]
}
export type DispatchListResponse<T> = ListResponse<T>

export type DispatchSubmitResponse = {
  ok: boolean
  submitted: number
  failed: number
  created_count: number
  errors_count: number
  results: Array<{
    rowIndex: number
    status: "created" | "error"
    errors?: Record<string, string>
  }>
  error?: string
}

export type LhTripLookupRow = {
  lh_trip_number: string
  cluster_name: string | null
  station_name: string | null
  region: string | null
  count_of_to: string | null
  total_oid_loaded: number | null
  actual_docked_time: string | null
  dock_number: string | null
  actual_depart_time: string | null
  processor_name: string | null
  plate_number: string | null
  fleet_size: string | null
  assigned_ops_id: string | null
  source_updated_at: string | null
  updated_at: string | null
}

const jsonHeaders = { "Content-Type": "application/json" }

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        ...jsonHeaders,
        ...(init?.headers || {}),
      },
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      return { error: payload?.error || response.statusText, status: response.status, details: payload }
    }
    return { data: payload }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Request failed" }
  }
}

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return
    search.append(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ""
}

// Authentication APIs
export const authApi = {
  async login(ops_id: string, password: string) {
    return request<AuthSessionResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ ops_id, password }),
    })
  },

  async createSeatalkSession(session_id: string) {
    return request<{ success: boolean }>("/api/auth/seatalk/session", {
      method: "POST",
      body: JSON.stringify({ session_id }),
    })
  },

  async seatalkLogin(session_id: string) {
    return request<AuthSessionResponse>("/api/auth/seatalk/login", {
      method: "POST",
      body: JSON.stringify({ session_id }),
    })
  },

  async checkSeatalkAuth(session_id: string) {
    return request<{ email: string; authenticated: boolean } | null>(`/api/auth/seatalk/check${buildQuery({ session_id })}`, {
      method: "GET",
    })
  },

  async googleLogin(id_token: string) {
    return request<AuthSessionResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token }),
    })
  },

  async getSession() {
    return request<AuthSessionResponse>("/api/auth/me", {
      method: "GET",
    })
  },

  async logout() {
    return request<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    })
  },

  async changePassword(ops_id: string, old_password: string, new_password: string) {
    return request<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ ops_id, old_password, new_password }),
    })
  },

  async getUserById(userId: string) {
    return request<AuthUser>(`/api/users/${encodeURIComponent(userId)}`, { method: "GET" })
  },

  async getUser(ops_id: string) {
    return request<AuthUser>(`/api/users/ops/${encodeURIComponent(ops_id)}`, { method: "GET" })
  },
}

// User lookup APIs
export const lookupApi = {
  async getUser(ops_id: string) {
    return request(`/api/users/ops/${encodeURIComponent(ops_id)}`, { method: "GET" })
  },

  async getClusters(region?: string, query?: string) {
    return request(`/api/lookup/clusters${buildQuery({ region, query })}`, { method: "GET" })
  },

  async getHubs(cluster?: string) {
    return request(`/api/lookup/hubs${buildQuery({ cluster })}`, { method: "GET" })
  },

  async getProcessors(query?: string) {
    return request(`/api/lookup/processors${buildQuery({ query })}`, { method: "GET" })
  },

  async getLhTrip(lhTrip: string) {
    return request<{ row: LhTripLookupRow | null }>(`/api/lookup/lh-trip${buildQuery({ lhTrip })}`, { method: "GET" })
  },
}

// Dispatch Report APIs
export const dispatchApi = {
  async submitRows(rows: any[], submitted_by_ops_id: string) {
    return request<DispatchSubmitResponse>("/api/dispatch/submit", {
      method: "POST",
      body: JSON.stringify({ rows, submitted_by_ops_id }),
    })
  },

  async getDispatches<T = unknown>(params: {
    limit?: number
    offset?: number
    status?: string
    region?: string
    startDate?: string
    endDate?: string
    fields?: string[]
  }) {
    const { fields, ...rest } = params
    return request<DispatchListResponse<T>>(
      `/api/dispatch${buildQuery({
        ...rest,
        fields: fields?.join(","),
      } as Record<string, string | number | boolean | undefined>)}`,
      {
        method: "GET",
      }
    )
  },

  async verifyRows(verifyData: {
    rows: string[]
    verified_by_ops_id: string
    send_csv?: boolean
    send_mode?: "per_batch" | "all"
  }) {
    return request("/api/dispatch/verify", {
      method: "POST",
      body: JSON.stringify(verifyData),
    })
  },
}

// Hub Management APIs
export const hubApi = {
  async getHubs(params?: { limit?: number; offset?: number; active?: boolean }) {
    return request(`/api/hubs${buildQuery(params || {})}`, { method: "GET" })
  },

  async createHub(hubData: any) {
    return request("/api/hubs", {
      method: "POST",
      body: JSON.stringify(hubData),
    })
  },

  async updateHub(hub_id: string, hubData: any) {
    return request(`/api/hubs/${encodeURIComponent(hub_id)}`, {
      method: "PATCH",
      body: JSON.stringify(hubData),
    })
  },

  async deleteHub(hub_id: string) {
    return request(`/api/hubs/${encodeURIComponent(hub_id)}`, {
      method: "DELETE",
    })
  },
}

// KPI & Compliance APIs (Google Sheets data synced to PostgreSQL)
export const kpiApi = {
  async getMDT(params?: { startDate?: string; endDate?: string; limit?: number; offset?: number }) {
    return request<ListResponse<{
      date: string
      mdt_score: number | null
      target: number | null
    }>>(`/api/kpi/mdt${buildQuery(params || {})}`, { method: "GET" })
  },

  async getWorkstation(params?: { startDate?: string; endDate?: string; limit?: number; offset?: number }) {
    return request<ListResponse<{
      date: string
      workstation: string | null
      utilization: number | null
      efficiency: number | null
    }>>(`/api/kpi/workstation${buildQuery(params || {})}`, { method: "GET" })
  },

  async getProductivity(params?: { startDate?: string; endDate?: string; limit?: number; offset?: number }) {
    return request<ListResponse<{
      date: string | null
      daily_average: number | null
      weekly_average: number | null
      monthly_total: number | null
      trend: string | null
    }>>(`/api/kpi/productivity${buildQuery(params || {})}`, { method: "GET" })
  },

  async getIntraday(params?: { date?: string; limit?: number; offset?: number }) {
    return request<ListResponse<{
      date: string | null
      hour: number | null
      dispatches: number | null
      volume: number | null
      timestamp: string | null
    }>>(`/api/kpi/intraday${buildQuery(params || {})}`, { method: "GET" })
  },
}
