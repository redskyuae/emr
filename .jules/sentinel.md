## 2026-07-15 - Missing Authentication on Master Data Endpoints
**Vulnerability:** The master data endpoints for global master data entities (countries, languages, states, religions, nationalities) in `/app/api/v1/...` were missing authentication checks.
**Learning:** These endpoints were previously entirely open, allowing unauthenticated users to create or list master data, leading to a missing authentication vulnerability. Global master data is not tenant-specific, so it requires `requireAuth()` rather than `requireTenantSession()`.
**Prevention:** Always verify that every API endpoint in `/app/api/` invokes an authentication or authorization helper, e.g., `requireAuth()`, `requireTenantSession()`, or `requireTenantAdminSession()`.
