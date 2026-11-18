-- Backfill the Ayurveda Diagnosis Code permissions for already-onboarded Tenants. New
-- onboardings receive these through the Permission Catalogue seed path.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('clinical-masters', 'ayurveda-diagnosis-code', 'read', 'ayurveda-diagnosis-code:read', 'View Ayurveda Diagnosis Codes.'),
  ('clinical-masters', 'ayurveda-diagnosis-code', 'create', 'ayurveda-diagnosis-code:create', 'Create Ayurveda Diagnosis Codes.'),
  ('clinical-masters', 'ayurveda-diagnosis-code', 'update', 'ayurveda-diagnosis-code:update', 'Update Ayurveda Diagnosis Codes.'),
  ('clinical-masters', 'ayurveda-diagnosis-code', 'delete', 'ayurveda-diagnosis-code:delete', 'Delete Ayurveda Diagnosis Codes.')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT "role"."tenant_id", "role"."id", "permission"."id"
FROM "role"
CROSS JOIN "permission"
WHERE "role"."code" = 'TENANT_ADMIN'
  AND "role"."is_system" = true
  AND "role"."is_deleted" = false
  AND "permission"."is_active" = true
  AND "permission"."name" IN (
    'ayurveda-diagnosis-code:read',
    'ayurveda-diagnosis-code:create',
    'ayurveda-diagnosis-code:update',
    'ayurveda-diagnosis-code:delete'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
