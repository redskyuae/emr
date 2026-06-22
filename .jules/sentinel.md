## 2024-05-18 - Missing authentication on master data API endpoints
**Vulnerability:** Master data endpoints (e.g., countries) were exposed without any authentication checks (`requireAuth()`), allowing unauthenticated users to create, read, update, or delete records.
**Learning:** Since the project does not use a global middleware for authentication, every single API route must explicitly enforce authentication/authorization. Omitting this check leaves the endpoint entirely public.
**Prevention:** Always include `requireAuth()`, `requireTenantSession()`, or `requireTenantAdminSession()` at the very top of API route handlers to secure them by default.
