
## 2026-06-05 - Added HTTP Security Headers
**Vulnerability:** Missing fundamental security HTTP headers (e.g., CSP, HSTS, X-Frame-Options) exposing the application to clickjacking, MITM, XSS, and MIME-sniffing attacks.
**Learning:** Next.js applications require explicit configuration in `next.config.ts` to enable defense-in-depth headers.
**Prevention:** Establish a baseline configuration for all Next.js applications that includes standard security headers via the `headers()` configuration block.
