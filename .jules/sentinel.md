## 2026-06-27 - [Master Data Authentication Gap]
**Vulnerability:** Global reference/master data endpoints (countries, languages, nationalities, religions, states) were missing authentication checks.
**Learning:** In Next.js applications using route handlers without global middleware, developers must explicitly secure every individual route. It's easy to overlook read/write endpoints for entities that don't belong to a specific tenant.
**Prevention:** Implement a standard pattern of including `requireAuth()` or `requireTenantSession()` at the top of every new route handler. Consider using a linter rule to enforce this or transition to Next.js Middleware for centralized authentication checks.
