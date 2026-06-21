## 2024-05-30 - Missing Authentication on System Master Data APIs
**Vulnerability:** Master data endpoints (Countries, States, Languages, Nationalities, Religions) are completely open, allowing unauthenticated users to read and potentially modify data.
**Learning:** Global middleware is not enforcing authentication, and individual routes missed `requireAuth()` or `requireTenantSession()` checks.
**Prevention:** Ensure every API endpoint incorporates a session verification helper such as `requireAuth()`, `requireTenantSession()`, or `requireTenantAdminSession()`.
