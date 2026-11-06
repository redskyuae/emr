-- Backfill Admit Source permissions into the global Permission Catalogue for already-onboarded
-- Tenants. New onboardings seed these via seedPermissionCatalogue(); this migration keeps
-- existing databases in sync. Idempotent via ON CONFLICT DO NOTHING on the unique permission name.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('visits', 'admit-source', 'read', 'admit-source:read', 'View Admit Sources.'),
  ('visits', 'admit-source', 'create', 'admit-source:create', 'Create Admit Sources.'),
  ('visits', 'admit-source', 'update', 'admit-source:update', 'Update Admit Sources.'),
  ('visits', 'admit-source', 'delete', 'admit-source:delete', 'Delete Admit Sources.')
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
  AND "permission"."resource" = 'admit-source'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint
-- Seed the default Admit Sources for existing Tenants so the Create Visit dropdown has options.
-- New onboardings seed these via seedDefaultVisitMastersCommand().
INSERT INTO "admit_source" ("tenant_id", "code", "name", "description")
SELECT o."id", defaults."code", defaults."name", defaults."description"
FROM "organization" o
CROSS JOIN (VALUES
  ('SELF', 'Self / Walk-in', 'Patient came without a referral'),
  ('DOCREF', 'Doctor Referral', 'Referred by an external Doctor'),
  ('HOSPTRF', 'Hospital Transfer', 'Transferred from another hospital'),
  ('CLINREF', 'Clinic Referral', 'Referred by another clinic'),
  ('EMER', 'Emergency', 'Arrived as an emergency'),
  ('CAMP', 'Camp / Outreach', 'Came through a camp or outreach event'),
  ('OTHER', 'Other', 'Any other source')
) AS defaults("code", "name", "description")
ON CONFLICT DO NOTHING;
