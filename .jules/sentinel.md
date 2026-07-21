## 2024-07-21 - [Missing Authentication on Global Master Data Endpoints]
**Vulnerability:** Several global master data API endpoints (`languages`, `states`, `religions`, `nationalities`, `countries`) lacked authentication completely, allowing any unauthenticated user to view, create, update, and delete global application records.
**Learning:** While tenant-specific endpoints were properly secured with `requireTenantSession()`, endpoints that handle non-tenant master data were completely overlooked, likely because they didn't require a tenant context.
**Prevention:** Always apply a default `requireAuth()` check to all API route handlers, even for generic master data, unless the endpoint is explicitly meant to be public (like signin/signup).
