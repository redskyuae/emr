## 2023-10-27 - [Missing Authentication on Master Data Endpoints]
**Vulnerability:** Unauthenticated users could perform CRUD operations on global master data endpoints (countries, languages, nationalities, religions, states).
**Learning:** This codebase relies on route-level authentication guards in each endpoint rather than a global middleware. Some endpoints were missed.
**Prevention:** Always verify that every new API route in `app/api/v1/` includes the appropriate `requireAuth`, `requireTenantSession`, or `requireTenantAdminSession` check at the beginning of each HTTP method handler.
