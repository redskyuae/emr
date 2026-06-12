# Permissions Are a System-Wide Catalogue

Permissions are seeded once and shared across Tenants as the Permission Catalogue. We are treating Permissions as system-wide rather than Tenant-scoped because Role assignment needs a stable set of authorization capabilities across all Tenants; Tenant-specific access is modeled by assigning those shared Permissions to Tenant-scoped Roles.
