## 2026-07-04 - Missing Authentication on Master Data Endpoints
**Vulnerability:** Found multiple global master data endpoints (e.g., countries, languages, nationalities, religions, states) missing authentication checks in their route handlers.
**Learning:** These endpoints were created without `requireAuth()` because they aren't tenant-specific (like `requireTenantSession()`), but they still need authentication to prevent unauthorized enumeration and creation/updating by unauthenticated users.
**Prevention:** Ensure that even system-wide/global endpoints that don't belong to a specific tenant still enforce generic user authentication using `requireAuth()`.
