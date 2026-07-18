## 2026-07-18 - [Missing Auth on Global Master Data]
**Vulnerability:** Global master data API endpoints (e.g., languages, states, religions, nationalities, countries) were accessible without authentication.
**Learning:** Even though these entities are not tenant-specific, their APIs still require protection using `requireAuth()` to prevent unauthorized access and potential data scraping or unauthenticated mutation.
**Prevention:** Ensure all new route handlers explicitly include an authentication check (e.g., `requireAuth()` or `requireTenantSession()`) at the beginning of the handler function, as the project does not use a global middleware for authentication.
