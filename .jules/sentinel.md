## 2024-06-19 - Missing Global Security HTTP Headers
**Vulnerability:** Missing security HTTP headers (such as `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, and `Permissions-Policy`), leaving the app vulnerable to attacks like clickjacking, MIME-type sniffing, and man-in-the-middle attacks.
**Learning:** Next.js allows configuring global headers directly within `next.config.ts` via an async `headers()` function without requiring a `middleware.ts`. This applies headers efficiently to all routes matching the source.
**Prevention:** Always include a comprehensive set of default security HTTP headers in `next.config.ts` whenever setting up a new Next.js application to establish baseline defense-in-depth protections.
