# API_REFERENCE

This reference documents the internal API layer and route endpoints.

## Health Endpoint

- GET `/api/health`
- Response:
  - status
  - timestamp
  - app
  - version

## Auth API (Client Layer)

- `authApi.login(ops_id, password)`
- `authApi.createSeatalkSession(session_id)`
- `authApi.checkSeatalkAuth(session_id)`
- `authApi.googleLogin(id_token)`
- `authApi.changePassword(ops_id, old_password, new_password)`
- `authApi.getUserById(userId)`
- `authApi.getUser(ops_id)`

## Lookup API

- `lookupApi.getClusters(region, query)`
- `lookupApi.getHubs(cluster)`
- `lookupApi.getProcessors(query)`

## Dispatch API

- `dispatchApi.submitRows(rows, submitted_by_ops_id)`
- `dispatchApi.getDispatches(params)`
- `dispatchApi.verifyRows(verifyData)`

## Hub API

- `hubApi.getHubs(params)`
- `hubApi.createHub(hubData)`
- `hubApi.updateHub(hub_id, hubData)`
- `hubApi.deleteHub(hub_id)`

## KPI API

- `kpiApi.getMDT(params)`
- `kpiApi.getWorkstation(params)`
- `kpiApi.getProductivity(params)`
- `kpiApi.getIntraday(date)`

## Error Model

All methods return:

- `data` on success
- `error` string on failure

## Notes

This layer targets PostgreSQL-backed API routes. Client method signatures remain stable while the backend uses `DATABASE_URL`.

Last Updated: 2026-01-14
