import { serializeDispatchRow } from "@/server/repositories/dispatch-report-fields"

describe("serializeDispatchRow", () => {
  it("maps prisma fields to API field names", () => {
    const row = {
      dispatchId: "dispatch-1",
      clusterName: "Cluster A",
      status: "Pending",
    }
    const result = serializeDispatchRow(row as Record<string, unknown>, [
      "dispatch_id",
      "cluster_name",
      "status",
    ])

    expect(result).toEqual({
      dispatch_id: "dispatch-1",
      cluster_name: "Cluster A",
      status: "Pending",
    })
  })
})
