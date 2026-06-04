# Nationality Is Global Reference Data

Nationality values are seeded once and shared across Tenants for Patient registration and demographics. We are treating Nationality as global reference data rather than a Tenant-scoped Master because nationalities are universal reference values and the Nationality API task specifies a schema without `tenantId`; Tenant-specific availability can be modeled separately if it becomes necessary.
