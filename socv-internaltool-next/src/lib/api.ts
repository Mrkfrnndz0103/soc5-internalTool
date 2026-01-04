// API Service Layer for Supabase integration
import { supabase } from './supabase'

// Authentication APIs
export const authApi = {
  async login(ops_id: string, password: string) {
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_ops_id: ops_id,
      p_password: password
    })
    if (error) return { error: error.message }
    return { data }
  },

  async createSeatalkSession(session_id: string) {
    const { error } = await supabase
      .from('seatalk_sessions')
      .insert({ session_id })
    if (error) return { error: error.message }
    return { data: { success: true } }
  },

  async checkSeatalkAuth(session_id: string) {
    const { data, error } = await supabase
      .from('seatalk_sessions')
      .select('email, authenticated')
      .eq('session_id', session_id)
      .eq('authenticated', true)
      .single()
    if (error) return { data: null }
    return { data }
  },

  async googleLogin(id_token: string) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: id_token
    })
    if (error) return { error: error.message }
    return { data }
  },

  async changePassword(ops_id: string, old_password: string, new_password: string) {
    const { data, error } = await supabase.rpc('change_user_password', {
      p_ops_id: ops_id,
      p_old_password: old_password,
      p_new_password: new_password
    })
    if (error) return { error: error.message }
    return { data }
  },

  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) return { error: error.message }
    return { data }
  },

  async getUser(ops_id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('ops_id', ops_id)
      .single()
    if (error) return { error: error.message }
    return { data }
  },
}

// User lookup APIs
export const lookupApi = {
  async getUser(ops_id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('ops_id', ops_id)
      .single()
    if (error) return { error: error.message }
    return { data }
  },

  async getClusters(region?: string, query?: string) {
    let queryBuilder = supabase.from('outbound_map').select('*')
    if (region) queryBuilder = queryBuilder.eq('region', region)
    if (query) queryBuilder = queryBuilder.ilike('cluster_name', `%${query}%`)
    const { data, error } = await queryBuilder
    if (error) return { error: error.message }
    return { data }
  },

  async getHubs(cluster?: string) {
    let queryBuilder = supabase.from('outbound_map').select('hub_name, dock_number')
    if (cluster) queryBuilder = queryBuilder.eq('cluster_name', cluster)
    const { data, error } = await queryBuilder
    if (error) return { error: error.message }
    return { data }
  },

  async getProcessors(query?: string) {
    let queryBuilder = supabase.from('users').select('name, ops_id').eq('role', 'Processor')
    if (query) queryBuilder = queryBuilder.ilike('name', `%${query}%`)
    const { data, error } = await queryBuilder.limit(10)
    if (error) return { error: error.message }
    return { data }
  },
}

// Dispatch Report APIs
export const dispatchApi = {
  async submitRows(rows: any[], submitted_by_ops_id: string) {
    const { data, error } = await supabase
      .from('dispatch_reports')
      .insert(rows.map(row => ({ ...row, submitted_by_ops_id })))
      .select()
    if (error) return { error: error.message }
    return { data: { created_count: data.length } }
  },

  async getDispatches(params: {
    limit?: number
    offset?: number
    status?: string
    region?: string
    startDate?: string
    endDate?: string
  }) {
    let queryBuilder = supabase.from('dispatch_reports').select('*', { count: 'exact' })
    if (params.status) queryBuilder = queryBuilder.eq('status', params.status)
    if (params.region) queryBuilder = queryBuilder.eq('region', params.region)
    if (params.startDate) queryBuilder = queryBuilder.gte('created_at', params.startDate)
    if (params.endDate) queryBuilder = queryBuilder.lte('created_at', params.endDate)
    if (params.limit) queryBuilder = queryBuilder.limit(params.limit)
    if (params.offset) queryBuilder = queryBuilder.range(params.offset, params.offset + (params.limit || 10) - 1)
    const { data, error, count } = await queryBuilder.order('created_at', { ascending: false })
    if (error) return { error: error.message }
    return { data: { rows: data, total: count } }
  },

  async verifyRows(verifyData: {
    rows: string[]
    verified_by_ops_id: string
    send_csv?: boolean
    send_mode?: "per_batch" | "all"
  }) {
    const { data, error } = await supabase.rpc('verify_dispatch_rows', verifyData)
    if (error) return { error: error.message }
    return { data }
  },
}

// Hub Management APIs
export const hubApi = {
  async getHubs(params?: { limit?: number; offset?: number; active?: boolean }) {
    let queryBuilder = supabase.from('outbound_map').select('*', { count: 'exact' })
    if (params?.active !== undefined) queryBuilder = queryBuilder.eq('active', params.active)
    if (params?.limit) queryBuilder = queryBuilder.limit(params.limit)
    if (params?.offset) queryBuilder = queryBuilder.range(params.offset, params.offset + (params.limit || 10) - 1)
    const { data, error, count } = await queryBuilder
    if (error) return { error: error.message }
    return { data: { hubs: data, total: count } }
  },

  async createHub(hubData: any) {
    const { data, error } = await supabase.from('outbound_map').insert(hubData).select().single()
    if (error) return { error: error.message }
    return { data }
  },

  async updateHub(hub_id: string, hubData: any) {
    const { data, error } = await supabase.from('outbound_map').update(hubData).eq('id', hub_id).select().single()
    if (error) return { error: error.message }
    return { data }
  },

  async deleteHub(hub_id: string) {
    const { data, error } = await supabase.from('outbound_map').update({ active: false }).eq('id', hub_id).select().single()
    if (error) return { error: error.message }
    return { data }
  },
}

// KPI & Compliance APIs (Google Sheets data synced to Supabase)
export const kpiApi = {
  async getMDT(params?: { startDate?: string; endDate?: string }) {
    let queryBuilder = supabase.from('kpi_mdt').select('*')
    if (params?.startDate) queryBuilder = queryBuilder.gte('date', params.startDate)
    if (params?.endDate) queryBuilder = queryBuilder.lte('date', params.endDate)
    const { data, error } = await queryBuilder.order('date', { ascending: false })
    if (error) return { error: error.message }
    return { data }
  },

  async getWorkstation(params?: { startDate?: string; endDate?: string }) {
    let queryBuilder = supabase.from('kpi_workstation').select('*')
    if (params?.startDate) queryBuilder = queryBuilder.gte('date', params.startDate)
    if (params?.endDate) queryBuilder = queryBuilder.lte('date', params.endDate)
    const { data, error } = await queryBuilder.order('date', { ascending: false })
    if (error) return { error: error.message }
    return { data }
  },

  async getProductivity(params?: { startDate?: string; endDate?: string }) {
    let queryBuilder = supabase.from('kpi_productivity').select('*')
    if (params?.startDate) queryBuilder = queryBuilder.gte('date', params.startDate)
    if (params?.endDate) queryBuilder = queryBuilder.lte('date', params.endDate)
    const { data, error } = await queryBuilder.order('date', { ascending: false })
    if (error) return { error: error.message }
    return { data }
  },

  async getIntraday(date?: string) {
    let queryBuilder = supabase.from('kpi_intraday').select('*')
    if (date) queryBuilder = queryBuilder.eq('date', date)
    const { data, error } = await queryBuilder.order('timestamp', { ascending: false })
    if (error) return { error: error.message }
    return { data }
  },
}
