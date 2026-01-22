export type ModuleKey = "dashboard" | "outbound" | "data-team" | "admin" | "kpi" | "midmile"

const ALL_MODULES: ModuleKey[] = ["dashboard", "outbound", "data-team", "admin", "kpi", "midmile"]
const DEFAULT_DISABLED: ModuleKey[] = ["outbound", "admin", "kpi", "midmile"]

const MODULE_ALIASES: Record<string, ModuleKey> = {
  dashboard: "dashboard",
  outbound: "outbound",
  "data-team": "data-team",
  datateam: "data-team",
  "data_team": "data-team",
  admin: "admin",
  kpi: "kpi",
  midmile: "midmile",
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-")
}

function parseModuleList(value?: string | null): ModuleKey[] {
  if (!value) return []
  const tokens = value.split(",").map((token) => normalizeToken(token))
  const modules = new Set<ModuleKey>()
  tokens.forEach((token) => {
    const alias = MODULE_ALIASES[token]
    if (alias) modules.add(alias)
  })
  return Array.from(modules)
}

const disabledOverrideRaw = process.env.NEXT_PUBLIC_MODULES_DISABLED
const hasDisabledOverride = disabledOverrideRaw !== undefined
const disabledOverride = parseModuleList(disabledOverrideRaw)
const disabledModules = new Set<ModuleKey>(hasDisabledOverride ? disabledOverride : DEFAULT_DISABLED)

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  outbound: "Outbound",
  "data-team": "Data Team",
  admin: "Admin",
  kpi: "KPI & Compliance",
  midmile: "Midmile",
}

export function isModuleEnabled(moduleKey: ModuleKey) {
  return !disabledModules.has(moduleKey)
}

export function getModuleForPath(pathname?: string | null): ModuleKey | null {
  if (!pathname) return null
  const normalized = pathname.toLowerCase()
  if (normalized === "/dashboard" || normalized.startsWith("/dashboard/")) return "dashboard"
  if (normalized.startsWith("/outbound")) return "outbound"
  if (normalized.startsWith("/data-team")) return "data-team"
  if (normalized.startsWith("/admin")) return "admin"
  if (normalized.startsWith("/kpi")) return "kpi"
  if (normalized.startsWith("/midmile")) return "midmile"
  return null
}

export function getEnabledModules() {
  return ALL_MODULES.filter((moduleKey) => isModuleEnabled(moduleKey))
}
