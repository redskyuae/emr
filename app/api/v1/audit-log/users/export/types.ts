// GET /api/v1/audit-log/users/export responds with a file body, not JSON: text/csv
// for `format=csv` (the default) and application/pdf for `format=pdf`.
export type ExportUserAuditListResponse = string | Uint8Array;
