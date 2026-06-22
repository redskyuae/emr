-- Reset development-stage authorization defaults.
-- Existing Permission Assignments cascade through role_permission.permission_id.
DELETE FROM "permission";
--> statement-breakpoint

-- Tenant Provisioning no longer creates default System Roles. Remove previously seeded System Roles
-- so existing development Tenants match newly provisioned Tenants.
-- Existing Role Assignments cascade through user_role.role_id.
DELETE FROM "role"
WHERE "is_system" = true;