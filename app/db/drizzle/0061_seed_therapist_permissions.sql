-- Backfill Therapist identity, skill-master, and reassignment permissions for existing tenants.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('identity-access', 'therapist', 'read', 'therapist:read', 'View Therapists.'),
  ('identity-access', 'therapist', 'create', 'therapist:create', 'Create Therapists.'),
  ('identity-access', 'therapist', 'update', 'therapist:update', 'Update Therapist details.'),
  ('identity-access', 'therapist', 'deactivate', 'therapist:deactivate', 'Deactivate Therapists.'),
  ('identity-access', 'therapist', 'reactivate', 'therapist:reactivate', 'Reactivate Therapists.'),
  ('clinical-masters', 'therapist-skill', 'read', 'therapist-skill:read', 'View Therapist Skills.'),
  ('clinical-masters', 'therapist-skill', 'create', 'therapist-skill:create', 'Create Therapist Skills.'),
  ('clinical-masters', 'therapist-skill', 'update', 'therapist-skill:update', 'Update Therapist Skills.'),
  ('clinical-masters', 'therapist-skill', 'delete', 'therapist-skill:delete', 'Delete Therapist Skills.'),
  ('appointments', 'appointment', 'reassign-therapist', 'appointment:reassign-therapist', 'Reassign Appointment Therapists.')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role" ("tenant_id", "name", "code", "description", "is_system", "is_deleted")
SELECT "id", 'Therapist', 'THERAPIST', 'Clinical staff who perform Treatment Sessions', true, false
FROM "organization"
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT "role"."tenant_id", "role"."id", "permission"."id"
FROM "role"
CROSS JOIN "permission"
WHERE "role"."code" = 'THERAPIST'
  AND "role"."is_system" = true
  AND "role"."is_deleted" = false
  AND "permission"."name" IN ('appointment:read', 'patient:read', 'treatment:read', 'therapist:read', 'therapist-skill:read')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
