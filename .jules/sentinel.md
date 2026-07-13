## 2024-07-13 - [Missing Security Headers]
**Vulnerability:** Next.js application was missing crucial security headers (CSP, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Referrer-Policy).
**Learning:** Security headers should be explicitly configured in Next.js via the `headers()` function in `next.config.ts`.
**Prevention:** Ensure `next.config.ts` always includes a comprehensive security headers configuration.
