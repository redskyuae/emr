## 2026-07-20 - Ensure Authentication on Master Data Endpoints
**Vulnerability:** The API endpoints for global master data entities (countries, languages, states, religions, nationalities) were lacking authentication checks, allowing unauthenticated users to perform read and write operations.
**Learning:** Even though these entities are not tenant-specific, their endpoints must still be secured with `requireAuth()` to ensure only authenticated users can access them, rather than relying purely on tenant isolation logic which might not apply to global data.
**Prevention:** Always verify that every API endpoint (unless explicitly public) includes an authentication check at the beginning of the handler, such as `requireAuth()` or `requireTenantSession()`.
