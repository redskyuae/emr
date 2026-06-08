# Religion Is Global Reference Data

Religion values are seeded once and shared across Tenants for Patient registration and care planning. We are treating Religion as global reference data rather than a Tenant-scoped Master because religions are universal reference values and the Religion API task specifies a schema without `tenantId`; Tenant-specific availability can be modeled separately if it becomes necessary.
