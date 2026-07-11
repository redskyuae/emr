## 2026-07-11 - [Missing Authentication on Global Reference Master Data]
**Vulnerability:** Several global reference master data API endpoints (countries, languages, nationalities, religions, states) were missing any authentication checks.
**Learning:** Some developers might assume that because global master data is not tenant-scoped, it doesn't need authentication. This allows unauthenticated users to access, create, update, or delete global master data, which affects all tenants in the system.
**Prevention:** Always secure all API endpoints, even for non-tenant-scoped master data, with at least `requireAuth()`. Ensure route-level authentication is consistently applied.
