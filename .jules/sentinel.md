## 2026-06-29 - Missing Authentication on Master Data APIs
**Vulnerability:** Global master data API endpoints (languages, states, religions, nationalities, countries) lacked authentication completely, allowing unauthorized CRUD operations.
**Learning:** While most endpoints in this architecture are secured via `requireTenantSession()` or `requireTenantAdminSession()`, global/tenant-agnostic resources need to be explicitly guarded by `requireAuth()`. Missing route-level middleware means each file must independently implement access control.
**Prevention:** Ensure new route handlers for global entities invoke `requireAuth()` and check the session validity before executing commands/queries.
