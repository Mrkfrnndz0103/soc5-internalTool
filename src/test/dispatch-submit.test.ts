import { normalizeDispatchRows } from "@/server/services/dispatch-submit"

describe("normalizeDispatchRows", () => {
  it("returns validation errors for missing required fields", () => {
    const { normalizedRows, validationErrors } = normalizeDispatchRows([{}])
    expect(normalizedRows).toHaveLength(0)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0].errors.cluster_name).toBeDefined()
  })

  it("normalizes valid rows", () => {
    const { normalizedRows, validationErrors } = normalizeDispatchRows([
      {
        cluster_name: "Cluster A",
        station_name: "Station 1",
        region: "North",
        count_of_to: "3",
        total_oid_loaded: 10,
        dock_number: "D1",
        dock_confirmed: true,
        actual_docked_time: "2025-01-01T10:00:00Z",
        actual_depart_time: "2025-01-01T11:00:00Z",
        processor_name: "Processor",
        lh_trip_number: "LT123",
        plate_number: "ABC-123",
        fleet_size: "10T",
        assigned_ops_id: "OPS123",
      },
    ])

    expect(validationErrors).toHaveLength(0)
    expect(normalizedRows).toHaveLength(1)
    expect(normalizedRows[0].lhTrip).toBe("LT123")
  })
})
