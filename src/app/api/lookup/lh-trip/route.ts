import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lhTripRaw = searchParams.get("lhTrip") || searchParams.get("lh_trip")
  const lhTrip = lhTripRaw?.trim().toUpperCase()

  if (!lhTrip) {
    return NextResponse.json({ error: "lhTrip is required" }, { status: 400 })
  }

  const result = await query(
    `SELECT
       trip_number AS lh_trip_number,
       NULL::text AS cluster_name,
       MAX(to_dest_station_name) AS station_name,
       NULL::text AS region,
       NULLIF(
         STRING_AGG(DISTINCT to_number, ', ') FILTER (WHERE to_number IS NOT NULL),
         ''
       ) AS count_of_to,
       COALESCE(SUM(to_parcel_quantity), 0)::int AS total_oid_loaded,
       NULL::timestamptz AS actual_docked_time,
       NULL::text AS dock_number,
       MAX(departure_timestamp) AS actual_depart_time,
       NULL::text AS processor_name,
       MAX(vehicle_number) AS plate_number,
       MAX(truck_size) AS fleet_size,
       NULL::text AS assigned_ops_id,
       MAX(dispatch_date) AS source_updated_at,
       MAX(updated_at) AS updated_at
     FROM dispatch_google_sheet_rows
     WHERE trip_number = $1
     GROUP BY trip_number`,
    [lhTrip]
  )

  return NextResponse.json({ row: result.rows[0] || null })
}
