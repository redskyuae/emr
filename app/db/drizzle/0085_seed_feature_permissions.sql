-- Adds Permissions for features that were open to every signed-in user: the Dashboard,
-- Previous Visits, Reports, Visit Documents, Visit Diagnoses, the Patient Chart and Timeline,
-- Appointment cancel/reschedule/export and Doctor Slots. New onboardings seed these via
-- seedPermissionCatalogue(); this migration keeps existing databases in sync.
-- Idempotent via ON CONFLICT DO NOTHING.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('dashboard', 'dashboard', 'read', 'dashboard:read', 'View the Dashboard.'),
  ('doctor-scheduling', 'doctor-slot', 'read', 'doctor-slot:read', 'View available Doctor Slots when booking or rescheduling.'),
  ('patient-management', 'patient-chart', 'read', 'patient-chart:read', 'View the Patient Chart.'),
  ('patient-management', 'patient-timeline', 'read', 'patient-timeline:read', 'View the Patient Timeline.'),
  ('appointments', 'appointment', 'cancel', 'appointment:cancel', 'Cancel Appointments.'),
  ('appointments', 'appointment', 'reschedule', 'appointment:reschedule', 'Reschedule Appointments.'),
  ('appointments', 'appointment', 'export', 'appointment:export', 'Export Appointments.'),
  ('visits', 'previous-visit', 'read', 'previous-visit:read', 'View Previous Visits.'),
  ('visits', 'visit-document', 'read', 'visit-document:read', 'View Visit Documents.'),
  ('visits', 'visit-document', 'upload', 'visit-document:upload', 'Upload Visit Documents.'),
  ('visits', 'visit-document', 'delete', 'visit-document:delete', 'Delete Visit Documents.'),
  ('visits', 'visit-diagnosis', 'read', 'visit-diagnosis:read', 'View Visit Diagnoses.'),
  ('visits', 'visit-diagnosis', 'update', 'visit-diagnosis:update', 'Record and update Visit Diagnoses.'),
  ('reports', 'report', 'read', 'report:read', 'View Reports, including the Consolidated Patient Report.')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
-- Nobody loses access: every Role (System or custom) that already reached a feature through an
-- older Permission is granted the new Permission that now guards it.
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT DISTINCT "role"."tenant_id", "role"."id", "granted"."id"
FROM (
  VALUES
    ('previous-visit:read', 'visit:read'),
    ('report:read', 'visit:read'),
    ('visit-document:read', 'visit:read'),
    ('visit-document:upload', 'visit:create'),
    ('visit-document:upload', 'visit:update'),
    ('visit-document:delete', 'visit:update'),
    ('visit-diagnosis:read', 'visit:read'),
    ('visit-diagnosis:update', 'visit:update'),
    ('patient-chart:read', 'patient:read'),
    ('patient-chart:read', 'visit:read'),
    ('patient-chart:read', 'admission:read'),
    ('patient-timeline:read', 'patient:read'),
    ('appointment:cancel', 'appointment:create'),
    ('appointment:reschedule', 'appointment:create'),
    ('appointment:export', 'appointment:read'),
    ('doctor-slot:read', 'appointment:create')
) AS "rule" ("granted_name", "source_name")
INNER JOIN "permission" AS "source" ON "source"."name" = "rule"."source_name"
INNER JOIN "role_permission" AS "existing" ON "existing"."permission_id" = "source"."id"
INNER JOIN "role" ON "role"."id" = "existing"."role_id" AND "role"."is_deleted" = false
INNER JOIN "permission" AS "granted"
  ON "granted"."name" = "rule"."granted_name" AND "granted"."is_active" = true
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint
-- The Dashboard was open to everyone, so every Role keeps it.
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT "role"."tenant_id", "role"."id", "permission"."id"
FROM "role"
CROSS JOIN "permission"
WHERE "role"."is_deleted" = false
  AND "permission"."name" = 'dashboard:read'
  AND "permission"."is_active" = true
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint
-- Tenant Admin System Roles get every new Permission, matching the full-access default that
-- onboarding applies.
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT "role"."tenant_id", "role"."id", "permission"."id"
FROM "role"
CROSS JOIN "permission"
WHERE "role"."code" = 'TENANT_ADMIN'
  AND "role"."is_system" = true
  AND "role"."is_deleted" = false
  AND "permission"."is_active" = true
  AND "permission"."name" IN (
    'dashboard:read',
    'doctor-slot:read',
    'patient-chart:read',
    'patient-timeline:read',
    'appointment:cancel',
    'appointment:reschedule',
    'appointment:export',
    'previous-visit:read',
    'visit-document:read',
    'visit-document:upload',
    'visit-document:delete',
    'visit-diagnosis:read',
    'visit-diagnosis:update',
    'report:read'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
