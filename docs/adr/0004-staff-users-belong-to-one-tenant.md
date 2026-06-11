# Staff Users Belong to One Tenant

Staff auth users belong to exactly one Tenant, even though BetterAuth organizations can represent membership in multiple organizations. We are choosing one-Tenant Staff identities because it keeps Staff provisioning, deactivation, and credential ownership simple and tenant-isolated; if the same person works for another Tenant, that Tenant must provision a separate user identity. Staff email addresses are not changed through Staff profile APIs, and Staff password changes belong in a dedicated credential flow.
