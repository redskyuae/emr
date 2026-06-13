## 2025-02-12 - Critical IDOR via client-provided tenantId

**Vulnerability:** Found a critical Missing Authentication and Insecure Direct Object Reference (IDOR) vulnerability in the appointment statuses endpoints (`app/api/v1/appointments/statuses/route.ts` and `[id]/route.ts`). The endpoints read `tenantId` from unauthenticated client requests (query parameters or body) instead of an authenticated session.

**Learning:** Endpoints created prior to the auth implementation relied on a placeholder `getTenantId` function which blindly extracted the tenant ID from the request. This pattern allows an attacker to bypass authentication entirely and perform CRUD operations on any tenant's data by simply providing a target `tenantId`. Other sub-directories in `app/api/v1/appointments/` (reasons, types, modes, cancelled-reasons) likely suffer from this identical vulnerability due to the presence of `// TODO: extract tenantId...` comments.

**Prevention:** Always enforce tenant context using the authenticated session (`requireTenantSession`) and explicitly override the `tenantId` field in incoming payloads with the session's verified `tenantId` to enforce isolation. Remove stubbed helper functions like `getTenantId(request)` that rely on user input.
