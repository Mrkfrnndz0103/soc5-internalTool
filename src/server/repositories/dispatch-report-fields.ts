export const DEFAULT_DISPATCH_FIELDS = [
  "dispatch_id",
  "cluster_name",
  "station_name",
  "region",
  "status",
  "actual_docked_time",
  "actual_depart_time",
  "processor_name",
  "plate_number",
  "created_at",
  "status_updated_at",
] as const

export const DISPATCH_FIELD_MAP = {
  dispatch_id: "dispatchId",
  cluster_name: "clusterName",
  station_name: "stationName",
  region: "region",
  status: "status",
  actual_docked_time: "actualDockedTime",
  actual_depart_time: "actualDepartTime",
  processor_name: "processorName",
  plate_number: "plateNumber",
  created_at: "createdAt",
  status_updated_at: "statusUpdatedAt",
  count_of_to: "countOfTo",
  total_oid_loaded: "totalOidLoaded",
  dock_number: "dockNumber",
  dock_confirmed: "dockConfirmed",
  lh_trip_number: "lhTripNumber",
  submitted_by_ops_id: "submittedByOpsId",
  assigned_ops_id: "assignedOpsId",
  fleet_size: "fleetSize",
  assigned_data_team_ops_id: "assignedDataTeamOpsId",
  acknowledged_by_ops_id: "acknowledgedByOpsId",
  acknowledged_at: "acknowledgedAt",
  confirmed_by_ops_id: "confirmedByOpsId",
  confirmed_at: "confirmedAt",
  pending_edit_reason: "pendingEditReason",
  edit_count: "editCount",
} as const

export type DispatchField = keyof typeof DISPATCH_FIELD_MAP

export function serializeDispatchRow(
  row: Record<string, unknown>,
  fields: DispatchField[]
) {
  const result: Record<string, unknown> = {}
  fields.forEach((field) => {
    const prismaKey = DISPATCH_FIELD_MAP[field]
    result[field] = row[prismaKey]
  })
  return result
}
