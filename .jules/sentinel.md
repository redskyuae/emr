## 2024-07-22 - Add global security HTTP headers

**Vulnerability:** Missing global security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security, Permissions-Policy).
**Learning:** Next.js applications require these to be explicitly defined in `next.config.ts` via an async `headers()` function, since there's no default middleware providing them out-of-the-box.
**Prevention:** Always verify and enforce global security headers in new or existing Next.js apps to prevent clickjacking, MIME-sniffing, and to enforce HTTPS.
