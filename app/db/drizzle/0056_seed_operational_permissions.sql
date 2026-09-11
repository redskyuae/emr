-- Backfill permissions for implemented operational modules into the global Permission Catalogue.
-- New onboardings seed these via seedPermissionCatalogue(); this migration keeps existing
-- databases in sync. Idempotent via ON CONFLICT DO NOTHING on the unique permission name.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('doctor-scheduling', 'doctor-rota', 'read', 'doctor-rota:read', 'View Doctor Rotas.'),
  ('doctor-scheduling', 'doctor-rota', 'create', 'doctor-rota:create', 'Create Doctor Rotas.'),
  ('doctor-scheduling', 'doctor-rota', 'update', 'doctor-rota:update', 'Update Doctor Rota details.'),
  ('doctor-scheduling', 'doctor-rota', 'delete', 'doctor-rota:delete', 'Delete Doctor Rotas.'),
  ('doctor-scheduling', 'doctor-schedule', 'read', 'doctor-schedule:read', 'View Doctor Schedules.'),
  ('doctor-scheduling', 'doctor-schedule', 'create', 'doctor-schedule:create', 'Create Doctor Schedules.'),
  ('doctor-scheduling', 'doctor-schedule', 'update', 'doctor-schedule:update', 'Update Doctor Schedule details.'),
  ('appointments', 'appointment', 'read', 'appointment:read', 'View Appointments.'),
  ('appointments', 'appointment', 'create', 'appointment:create', 'Book Appointments.'),
  ('room-masters', 'room-type', 'read', 'room-type:read', 'View Room Types.'),
  ('room-masters', 'room-type', 'create', 'room-type:create', 'Create Room Types.'),
  ('room-masters', 'room-type', 'update', 'room-type:update', 'Update Room Type details.'),
  ('room-masters', 'room-type', 'delete', 'room-type:delete', 'Delete Room Types.'),
  ('room-management', 'room', 'read', 'room:read', 'View Rooms.'),
  ('room-management', 'room', 'create', 'room:create', 'Create Rooms.'),
  ('room-management', 'room', 'update', 'room:update', 'Update Room details.'),
  ('room-management', 'room', 'delete', 'room:delete', 'Delete Rooms.'),
  ('asset-management', 'asset', 'read', 'asset:read', 'View Assets.'),
  ('asset-management', 'asset', 'create', 'asset:create', 'Create Assets.'),
  ('asset-management', 'asset', 'update', 'asset:update', 'Update Asset details.'),
  ('asset-management', 'asset', 'delete', 'asset:delete', 'Delete Assets.'),
  ('asset-management', 'work-order', 'read', 'work-order:read', 'View Work Orders.'),
  ('asset-management', 'work-order', 'create', 'work-order:create', 'Create Work Orders.'),
  ('asset-management-masters', 'asset-category', 'read', 'asset-category:read', 'View Asset Categories.'),
  ('asset-management-masters', 'asset-category', 'create', 'asset-category:create', 'Create Asset Categories.'),
  ('asset-management-masters', 'asset-category', 'update', 'asset-category:update', 'Update Asset Category details.'),
  ('asset-management-masters', 'asset-category', 'delete', 'asset-category:delete', 'Delete Asset Categories.'),
  ('asset-management-masters', 'asset-condition', 'read', 'asset-condition:read', 'View Asset Conditions.'),
  ('asset-management-masters', 'asset-condition', 'create', 'asset-condition:create', 'Create Asset Conditions.'),
  ('asset-management-masters', 'asset-condition', 'update', 'asset-condition:update', 'Update Asset Condition details.'),
  ('asset-management-masters', 'asset-condition', 'delete', 'asset-condition:delete', 'Delete Asset Conditions.'),
  ('asset-management-masters', 'asset-status', 'read', 'asset-status:read', 'View Asset Statuses.'),
  ('asset-management-masters', 'asset-status', 'create', 'asset-status:create', 'Create Asset Statuses.'),
  ('asset-management-masters', 'asset-status', 'update', 'asset-status:update', 'Update Asset Status details.'),
  ('asset-management-masters', 'asset-status', 'delete', 'asset-status:delete', 'Delete Asset Statuses.'),
  ('asset-management-masters', 'work-order-type', 'read', 'work-order-type:read', 'View Work Order Types.'),
  ('asset-management-masters', 'work-order-type', 'create', 'work-order-type:create', 'Create Work Order Types.'),
  ('asset-management-masters', 'work-order-type', 'update', 'work-order-type:update', 'Update Work Order Type details.'),
  ('asset-management-masters', 'work-order-type', 'delete', 'work-order-type:delete', 'Delete Work Order Types.'),
  ('asset-management-masters', 'work-order-priority', 'read', 'work-order-priority:read', 'View Work Order Priorities.'),
  ('asset-management-masters', 'work-order-priority', 'create', 'work-order-priority:create', 'Create Work Order Priorities.'),
  ('asset-management-masters', 'work-order-priority', 'update', 'work-order-priority:update', 'Update Work Order Priority details.'),
  ('asset-management-masters', 'work-order-priority', 'delete', 'work-order-priority:delete', 'Delete Work Order Priorities.'),
  ('asset-management-masters', 'work-order-status', 'read', 'work-order-status:read', 'View Work Order Statuses.'),
  ('asset-management-masters', 'work-order-status', 'create', 'work-order-status:create', 'Create Work Order Statuses.'),
  ('asset-management-masters', 'work-order-status', 'update', 'work-order-status:update', 'Update Work Order Status details.'),
  ('asset-management-masters', 'work-order-status', 'delete', 'work-order-status:delete', 'Delete Work Order Statuses.')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
-- Existing tenants already have their System Roles, so give active Tenant Admin roles the
-- same full-access default that onboarding applies after seeding the Permission Catalogue.
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT "role"."tenant_id", "role"."id", "permission"."id"
FROM "role"
CROSS JOIN "permission"
WHERE "role"."code" = 'TENANT_ADMIN'
  AND "role"."is_system" = true
  AND "role"."is_deleted" = false
  AND "permission"."is_active" = true
  AND "permission"."module" IN (
    'doctor-scheduling',
    'appointments',
    'room-masters',
    'room-management',
    'asset-management',
    'asset-management-masters'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
