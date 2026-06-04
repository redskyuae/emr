# Language Is Global Reference Data

Language values are seeded once and shared across Tenants for Patient registration and communication preferences. We are treating Language as global reference data rather than a Tenant-scoped Master because languages are universal reference values and the Language API task specifies a schema without `tenantId`; Tenant-specific availability can be modeled separately if it becomes necessary.
