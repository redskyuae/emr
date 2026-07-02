
## 2026-07-02 - [Missing Global Security Headers]
**Vulnerability:** The application was missing basic security headers (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Permissions-Policy, Referrer-Policy).
**Learning:** Next.js uses an async `headers()` function in `next.config.ts` to set global HTTP headers since there's no `middleware.ts` for this purpose.
**Prevention:** Always verify that security headers are configured globally in Next.js projects via `next.config.ts` to enforce browser-level protections.
