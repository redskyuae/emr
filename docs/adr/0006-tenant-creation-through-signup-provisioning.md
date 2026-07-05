# Tenant Creation Through Signup Provisioning

Tenant creation happens only through public signup-backed Tenant Provisioning, not through an authenticated create-Tenant API. We are removing the authenticated `POST /api/v1/tenants` path because initial onboarding must create the Tenant Owner, Tenant, active Tenant session, Permission Catalogue, and required editable Tenant defaults as one all-or-nothing flow; allowing arbitrary additional Tenant creation would introduce multi-Tenant ownership and partial-provisioning complexity before the product needs it. Default Role creation and default Permission Assignments are intentionally not part of Tenant Provisioning; see ADR-0007.

Amended by ADR-0017: the all-or-nothing flow is now limited to signup (Tenant Owner, Tenant, active Tenant session); the Permission Catalogue and editable Tenant defaults are installed in a second Tenant Onboarding phase.
