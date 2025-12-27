// Mockup data for development and testing
// This file contains sample Ops IDs, users, clusters, hubs, and other test data

export interface MockUser {
  ops_id: string
  name: string
  role: "FTE" | "Backroom" | "Data Team" | "Admin"
  email?: string
  password: string // In production, never store passwords in frontend!
  is_first_time: boolean
  must_change_password: boolean
}

export interface MockCluster {
  name: string
  region: string
  hubs: string[]
}

export interface MockHub {
  hub_id: string
  hub_name: string
  region: string
  dock_number: string
  contact_person_name: string
  contact_person_email: string
  active: boolean
}

export interface MockProcessor {
  name: string
  ops_id: string
}

// Sample Ops IDs and Users
export const mockUsers: MockUser[] = [
  {
    ops_id: "OPS93568",
    name: "Juan Dela Cruz",
    role: "Backroom",
    password: "SOC5-Outbound",
    is_first_time: false,
    must_change_password: false,
  },
  {
    ops_id: "OPS002",
    name: "Maria Santos",
    role: "Backroom",
    password: "SOC5-Outbound",
    is_first_time: true,
    must_change_password: true,
  },
  {
    ops_id: "OPS003",
    name: "Pedro Gonzales",
    role: "Backroom",
    password: "MyPassword123!",
    is_first_time: false,
    must_change_password: false,
  },
  {
    ops_id: "OPS004",
    name: "Ana Reyes",
    role: "Backroom",
    password: "SOC5-Outbound",
    is_first_time: false,
    must_change_password: false,
  },
  {
    ops_id: "OPS005",
    name: "Carlos Rivera",
    role: "Backroom",
    password: "MyPassword456!",
    is_first_time: false,
    must_change_password: false,
  },
  {
    ops_id: "DATA001",
    name: "Lisa Chen",
    role: "Data Team",
    password: "DataTeam2024!",
    is_first_time: false,
    must_change_password: false,
  },
  {
    ops_id: "DATA002",
    name: "Michael Tan",
    role: "Data Team",
    password: "DataTeam2024!",
    is_first_time: false,
    must_change_password: false,
  },
  {
    ops_id: "ADMIN001",
    name: "Sarah Johnson",
    role: "Admin",
    password: "Admin2024!",
    is_first_time: false,
    must_change_password: false,
  },
  {
    ops_id: "FTE001",
    name: "Robert Brown",
    role: "FTE",
    email: "robert.brown@company.com",
    password: "", // FTE uses Google OAuth
    is_first_time: false,
    must_change_password: false,
  },
  {
    ops_id: "FTE002",
    name: "Jennifer Lee",
    role: "FTE",
    email: "jennifer.lee@company.com",
    password: "",
    is_first_time: false,
    must_change_password: false,
  },
]

// Sample Clusters with Regions
export const mockClusters: MockCluster[] = [
  {
    name: "Masbate Hub",
    region: "FAR SOL",
    hubs: ["Masbate Hub"],
  },
  {
    name: "Masbate Hub,Tugbo Hub,Aroroy Hub",
    region: "FAR SOL",
    hubs: ["Masbate Hub", "Tugbo Hub", "Aroroy Hub"],
  },
  {
    name: "Sorsogon Hub",
    region: "FAR SOL",
    hubs: ["Sorsogon Hub"],
  },
  {
    name: "Legazpi Hub",
    region: "FAR SOL",
    hubs: ["Legazpi Hub"],
  },
  {
    name: "Naga Hub",
    region: "FAR SOL",
    hubs: ["Naga Hub"],
  },
  {
    name: "Manila Hub",
    region: "METRO MANILA",
    hubs: ["Manila Hub"],
  },
  {
    name: "Quezon City Hub",
    region: "METRO MANILA",
    hubs: ["Quezon City Hub"],
  },
  {
    name: "Makati Hub",
    region: "METRO MANILA",
    hubs: ["Makati Hub"],
  },
  {
    name: "Pasig Hub",
    region: "METRO MANILA",
    hubs: ["Pasig Hub"],
  },
  {
    name: "Caloocan Hub",
    region: "METRO MANILA",
    hubs: ["Caloocan Hub"],
  },
  {
    name: "Cebu Hub",
    region: "VISMIN",
    hubs: ["Cebu Hub"],
  },
  {
    name: "Mandaue Hub",
    region: "VISMIN",
    hubs: ["Mandaue Hub"],
  },
  {
    name: "Davao Hub",
    region: "VISMIN",
    hubs: ["Davao Hub"],
  },
  {
    name: "Iloilo Hub",
    region: "VISMIN",
    hubs: ["Iloilo Hub"],
  },
  {
    name: "Bacolod Hub",
    region: "VISMIN",
    hubs: ["Bacolod Hub"],
  },
]

// Sample Hubs with Details
export const mockHubs: MockHub[] = [
  {
    hub_id: "hub-001",
    hub_name: "Masbate Hub",
    region: "FAR SOL",
    dock_number: "D1",
    contact_person_name: "Antonio Cruz",
    contact_person_email: "antonio.cruz@company.com",
    active: true,
  },
  {
    hub_id: "hub-002",
    hub_name: "Tugbo Hub",
    region: "FAR SOL",
    dock_number: "D2",
    contact_person_name: "Rosa Mendoza",
    contact_person_email: "rosa.mendoza@company.com",
    active: true,
  },
  {
    hub_id: "hub-003",
    hub_name: "Aroroy Hub",
    region: "FAR SOL",
    dock_number: "D3",
    contact_person_name: "Luis Garcia",
    contact_person_email: "luis.garcia@company.com",
    active: true,
  },
  {
    hub_id: "hub-004",
    hub_name: "Sorsogon Hub",
    region: "FAR SOL",
    dock_number: "D4",
    contact_person_name: "Elena Santos",
    contact_person_email: "elena.santos@company.com",
    active: true,
  },
  {
    hub_id: "hub-005",
    hub_name: "Legazpi Hub",
    region: "FAR SOL",
    dock_number: "D5",
    contact_person_name: "Diego Ramos",
    contact_person_email: "diego.ramos@company.com",
    active: true,
  },
  {
    hub_id: "hub-006",
    hub_name: "Manila Hub",
    region: "METRO MANILA",
    dock_number: "M1",
    contact_person_name: "Sofia Reyes",
    contact_person_email: "sofia.reyes@company.com",
    active: true,
  },
  {
    hub_id: "hub-007",
    hub_name: "Quezon City Hub",
    region: "METRO MANILA",
    dock_number: "M2",
    contact_person_name: "Marco Villar",
    contact_person_email: "marco.villar@company.com",
    active: true,
  },
  {
    hub_id: "hub-008",
    hub_name: "Cebu Hub",
    region: "VISMIN",
    dock_number: "C1",
    contact_person_name: "Carmen Diaz",
    contact_person_email: "carmen.diaz@company.com",
    active: true,
  },
  {
    hub_id: "hub-009",
    hub_name: "Davao Hub",
    region: "VISMIN",
    dock_number: "C2",
    contact_person_name: "Ricardo Fernandez",
    contact_person_email: "ricardo.fernandez@company.com",
    active: true,
  },
]

// Sample Processors
export const mockProcessors: MockProcessor[] = [
  { name: "Juan Dela Cruz", ops_id: "PROC001" },
  { name: "Maria Santos", ops_id: "PROC002" },
  { name: "Pedro Gonzales", ops_id: "PROC003" },
  { name: "Ana Reyes", ops_id: "PROC004" },
  { name: "Carlos Rivera", ops_id: "PROC005" },
  { name: "Rosa Mendoza", ops_id: "PROC006" },
  { name: "Luis Garcia", ops_id: "PROC007" },
  { name: "Elena Santos", ops_id: "PROC008" },
  { name: "Diego Ramos", ops_id: "PROC009" },
  { name: "Sofia Reyes", ops_id: "PROC010" },
]

// Helper functions for mockup API calls

export function findUserByOpsId(ops_id: string): MockUser | undefined {
  return mockUsers.find((user) => user.ops_id === ops_id)
}

export function authenticateUser(ops_id: string, password: string): MockUser | null {
  const user = findUserByOpsId(ops_id)
  if (user && user.password === password) {
    return user
  }
  return null
}

export function searchClusters(query: string, region?: string): MockCluster[] {
  let results = mockClusters

  if (region) {
    results = results.filter((cluster) => cluster.region === region)
  }

  if (query) {
    const lowerQuery = query.toLowerCase()
    results = results.filter((cluster) =>
      cluster.name.toLowerCase().includes(lowerQuery)
    )
  }

  return results
}

export function getHubsByCluster(clusterName: string): MockHub[] {
  const cluster = mockClusters.find((c) => c.name === clusterName)
  if (!cluster) return []

  return mockHubs.filter((hub) => cluster.hubs.includes(hub.hub_name))
}

export function searchProcessors(query: string): MockProcessor[] {
  if (!query) return mockProcessors

  const lowerQuery = query.toLowerCase()
  return mockProcessors.filter((processor) =>
    processor.name.toLowerCase().includes(lowerQuery)
  )
}

// Generate mock token
export function generateMockToken(user: MockUser): string {
  return `mock_token_${user.ops_id}_${Date.now()}`
}

// Export all for easy import
export default {
  users: mockUsers,
  clusters: mockClusters,
  hubs: mockHubs,
  processors: mockProcessors,
  findUserByOpsId,
  authenticateUser,
  searchClusters,
  getHubsByCluster,
  searchProcessors,
  generateMockToken,
}
