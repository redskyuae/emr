## 2026-07-16 - [Security Headers]
**Vulnerability:** Missing global HTTP security headers (e.g., X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options) in the Next.js application, which leaves it susceptible to clickjacking, MIME-sniffing, and downgrade attacks.
**Learning:** Next.js requires these headers to be explicitly configured via an async `headers()` function in `next.config.ts` since there is no global middleware.
**Prevention:** Always configure foundational HTTP security headers at the framework configuration level.
