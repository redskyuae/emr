## 2024-07-17 - [CRITICAL] Fix unauthenticated global master data API endpoints
**Vulnerability:** The global master data API endpoints (`languages`, `states`, `religions`, `nationalities`, `countries`) lacked any authentication requirement, exposing them to unauthorized data fetching and modifications.
**Learning:** Global master data entities are not tenant-specific, so `requireTenantSession()` isn't applicable, but they must still be protected by `requireAuth()`.
**Prevention:** Always verify that newly created endpoints have explicit authentication checks using route-level auth helpers before processing incoming requests. For master data entities, use `requireAuth()`.
