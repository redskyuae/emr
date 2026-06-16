# Tenant Creation Through Signup Provisioning

Tenant creation happens only through public signup-backed Tenant Provisioning, not through an authenticated create-Tenant API. We are removing the authenticated `POST /api/v1/tenants` path because initial onboarding must create the Tenant Owner, Tenant, active Tenant session, System Roles, default Permission Assignments, and required editable Tenant defaults as one all-or-nothing flow; allowing arbitrary additional Tenant creation would introduce multi-Tenant ownership and partial-provisioning complexity before the product needs it.
