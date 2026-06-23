## 2026-06-23 - Missing authentication on master data API endpoints
**Vulnerability:** Found unauthenticated API endpoints for master data entities (e.g., countries) in `app/api/v1/countries/route.ts` and `app/api/v1/countries/[id]/route.ts`. Anyone could create, update, or delete master data without logging in.
**Learning:** Global master data entities are not tenant-specific, so they were missing the standard `requireTenantSession()` protection. They should be secured using `requireAuth()` rather than no authentication at all.
**Prevention:** Ensure that even non-tenant specific endpoints (like master data and lookup tables) explicitly use `requireAuth()` at the start of their route handlers to verify a user session exists.
