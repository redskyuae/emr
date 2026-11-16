-- Backfill the Visit amend permission for already-onboarded Tenants. New onboardings
-- receive it through the Permission Catalogue seed path.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('visits', 'visit', 'amend', 'visit:amend', 'Amend a Completed Visit, its Clinical Notes and Vital Signs.')
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
  AND "permission"."name" = 'visit:amend'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
