-- 0085 derived some new Permissions from a narrower source than the one that reached the
-- feature before it had its own Permission:
-- * Cancel, Reschedule and Doctor Slots were open to anyone who could open Appointments
--   (`appointment:read`), not only to Roles with `appointment:create`.
-- * Visit Document upload and delete were open to anyone who could open a Visit
--   (`visit:read`), not only to Roles with `visit:create` or `visit:update`.
-- This grants them from the wider source so no Role loses access. It runs after 0085 on
-- databases that already applied it, and is idempotent via ON CONFLICT DO NOTHING.
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT DISTINCT "role"."tenant_id", "role"."id", "granted"."id"
FROM (
  VALUES
    ('appointment:cancel', 'appointment:read'),
    ('appointment:reschedule', 'appointment:read'),
    ('doctor-slot:read', 'appointment:read'),
    ('visit-document:upload', 'visit:read'),
    ('visit-document:delete', 'visit:read')
) AS "rule" ("granted_name", "source_name")
INNER JOIN "permission" AS "source"
  ON "source"."name" = "rule"."source_name" AND "source"."is_active" = true
INNER JOIN "role_permission" AS "existing" ON "existing"."permission_id" = "source"."id"
INNER JOIN "role" ON "role"."id" = "existing"."role_id" AND "role"."is_deleted" = false
INNER JOIN "permission" AS "granted"
  ON "granted"."name" = "rule"."granted_name" AND "granted"."is_active" = true
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
