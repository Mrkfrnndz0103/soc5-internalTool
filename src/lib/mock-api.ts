// Mock API Service for Development
// Use this when backend is not available
// Set VITE_USE_MOCK_API=true in .env to enable

import mockData from "./mockup-data"

const MOCK_DELAY = 500 // Simulate network delay

function delay(ms: number = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mockResponse<T>(data: T, error?: string) {
  return error ? { error } : { data }
}

export const mockAuthApi = {
  async login(ops_id: string, password: string) {
    await delay()
    const user = mockData.authenticateUser(ops_id, password)

    if (!user) {
      return mockResponse(null, "Invalid credentials")
    }

    const token = mockData.generateMockToken(user)
    return mockResponse({
      user: {
        ops_id: user.ops_id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      token,
      must_change_password: user.must_change_password,
    })
  },

  async googleLogin(_id_token: string) {
    await delay()
    // Mock Google OAuth - return FTE user
    const fteUser = mockData.users.find((u) => u.role === "FTE")
    if (fteUser) {
      const token = mockData.generateMockToken(fteUser)
      return mockResponse({
        user: {
          email: fteUser.email,
          name: fteUser.name,
          role: fteUser.role,
        },
        token,
      })
    }
    return mockResponse(null, "Google OAuth failed")
  },

  async changePassword(ops_id: string, old_password: string, _new_password: string) {
    await delay()
    const user = mockData.findUserByOpsId(ops_id)

    if (!user) {
      return mockResponse(null, "User not found")
    }

    if (user.password !== old_password) {
      return mockResponse(null, "Incorrect old password")
    }

    // In real implementation, this would update the database
    return mockResponse({ message: "Password updated successfully" })
  },

  async getUserById(_userId: string) {
    await delay()
    const user = mockData.users[0]
    return mockResponse(user)
  },

  async getUser(ops_id: string) {
    await delay()
    const user = mockData.findUserByOpsId(ops_id)
    if (!user) {
      return mockResponse(null, "User not found")
    }
    return mockResponse(user)
  },
}

export const mockLookupApi = {
  async getUser(ops_id: string) {
    await delay()
    const user = mockData.findUserByOpsId(ops_id)

    if (!user) {
      return mockResponse(null, "Ops ID not found")
    }

    return mockResponse({
      ops_id: user.ops_id,
      name: user.name,
      role: user.role,
      is_first_time: user.is_first_time,
      must_change_password: user.must_change_password,
    })
  },

  async getClusters(region?: string, query?: string) {
    await delay()
    const clusters = mockData.searchClusters(query || "", region)
    return mockResponse(clusters)
  },

  async getHubs(cluster?: string) {
    await delay()
    if (cluster) {
      const hubs = mockData.getHubsByCluster(cluster)
      return mockResponse(hubs)
    }
    return mockResponse(mockData.hubs)
  },

  async getProcessors(query?: string) {
    await delay()
    const processors = mockData.searchProcessors(query || "")
    return mockResponse(processors)
  },
}

export const mockDispatchApi = {
  async submitRows(rows: any[], _submitted_by_ops_id: string) {
    await delay()

    // Simulate validation and row creation
    const results = rows.map((_row, index) => ({
      rowIndex: index,
      status: "created",
      dispatch_id: `dispatch-${Date.now()}-${index}`,
      batch_label: `${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"}`,
      batch_sequence: index + 1,
    }))

    return mockResponse({
      results,
      created_count: results.length,
      errors_count: 0,
    })
  },

  async getDispatches(params: any) {
    await delay()

    // Generate mock dispatch entries
    const mockEntries = Array.from({ length: 50 }, (_, i) => ({
      dispatch_id: `dispatch-${i}`,
      batch_label: `${(i % 3) + 1}${i % 3 === 0 ? "st" : i % 3 === 1 ? "nd" : "rd"}`,
      batch_sequence: (i % 3) + 1,
      cluster_name: mockData.clusters[i % mockData.clusters.length].name,
      station_name: mockData.hubs[i % mockData.hubs.length].hub_name,
      region: mockData.hubs[i % mockData.hubs.length].region,
      count_of_to: Math.floor(Math.random() * 50) + 10,
      total_oid_loaded: Math.floor(Math.random() * 200) + 50,
      actual_docked_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      actual_depart_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      dock_number: `D${Math.floor(Math.random() * 5) + 1}`,
      processor_name: mockData.processors[i % mockData.processors.length].name,
      lh_trip: `LT${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      plate_number: `ABC ${Math.floor(Math.random() * 9000) + 1000}`,
      fleet_size: ["4WH", "6W", "6WF", "10WH", "CV"][Math.floor(Math.random() * 5)],
      assigned_ops_id: mockData.users[i % mockData.users.length].ops_id,
      status: ["Pending", "Ongoing", "Completed"][Math.floor(Math.random() * 3)],
      verified_flag: Math.random() > 0.5,
      verified_by: Math.random() > 0.5 ? "DATA001" : undefined,
      verified_at: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      created_by: mockData.users[i % mockData.users.length].ops_id,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }))

    const limit = params.limit || 50
    const offset = params.offset || 0

    return mockResponse({
      total: 250,
      limit,
      offset,
      rows: mockEntries.slice(offset, offset + limit),
    })
  },

  async verifyRows(data: any) {
    await delay()
    const results = data.rows.map((rowId: string) => ({
      batch_label: "1st",
      dispatch_ids: [rowId],
      csv_link: `https://drive.google.com/file/mock_${Date.now()}/view`,
      seatalk_status: "pending",
    }))

    return mockResponse({ results })
  },
}

export const mockHubApi = {
  async getHubs(_params?: any) {
    await delay()
    return mockResponse({
      total: mockData.hubs.length,
      rows: mockData.hubs,
    })
  },

  async createHub(_hubData: any) {
    await delay()
    return mockResponse({
      hub_id: `hub-${Date.now()}`,
      created_at: new Date().toISOString(),
    })
  },

  async updateHub(hub_id: string, _hubData: any) {
    await delay()
    return mockResponse({
      hub_id,
      updated_at: new Date().toISOString(),
    })
  },

  async deleteHub(_hub_id: string) {
    await delay()
    return mockResponse({
      message: "Hub deleted successfully",
    })
  },
}

export const mockKpiApi = {
  async getMDT(_params?: any) {
    await delay()
    // Mock KPI data from Google Sheets
    return mockResponse({
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        mdt_score: Math.floor(Math.random() * 30) + 70,
        target: 85,
      })),
    })
  },

  async getWorkstation(_params?: any) {
    await delay()
    return mockResponse({
      data: Array.from({ length: 20 }, (_, i) => ({
        workstation: `WS-${i + 1}`,
        utilization: Math.floor(Math.random() * 40) + 60,
        efficiency: Math.floor(Math.random() * 30) + 70,
      })),
    })
  },

  async getProductivity(_params?: any) {
    await delay()
    return mockResponse({
      data: {
        daily_average: 234,
        weekly_average: 1638,
        monthly_total: 7020,
        trend: "+12.5%",
      },
    })
  },

  async getIntraday(_date?: string) {
    await delay()
    return mockResponse({
      data: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        dispatches: Math.floor(Math.random() * 50) + 10,
        volume: Math.floor(Math.random() * 500) + 100,
      })),
    })
  },
}

// Check if mock API should be used
export function useMockApi(): boolean {
  return import.meta.env.VITE_USE_MOCK_API === "true"
}

export default {
  auth: mockAuthApi,
  lookup: mockLookupApi,
  dispatch: mockDispatchApi,
  hub: mockHubApi,
  kpi: mockKpiApi,
}
