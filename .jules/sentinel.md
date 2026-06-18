## 2026-06-18 - [HTTP Security Headers Missing globally]
**Vulnerability:** The application was missing basic defense-in-depth HTTP security headers globally.
**Learning:** Next.js applications should define standard security headers (X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options, etc.) inside `next.config.ts` if a `middleware.ts` is not used.
**Prevention:** Implement basic security headers at the framework configuration level to ensure they are returned globally.
