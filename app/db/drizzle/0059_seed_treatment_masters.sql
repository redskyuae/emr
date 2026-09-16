-- Backfill Treatment permissions into the global Permission Catalogue for already-onboarded
-- Tenants. New onboardings seed these via seedPermissionCatalogue(); this migration keeps
-- existing databases in sync. Idempotent via ON CONFLICT DO NOTHING on the unique permission name.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('visits', 'treatment', 'read', 'treatment:read', 'View Treatments and their Sessions.'),
  ('visits', 'treatment', 'create', 'treatment:create', 'Create Treatments and Sessions.'),
  ('visits', 'treatment', 'update', 'treatment:update', 'Update Treatment details.'),
  ('visits', 'treatment', 'delete', 'treatment:delete', 'Delete Treatments.')
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
  AND "permission"."resource" = 'treatment'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint
-- Seed the default Treatment catalogue for existing Tenants so Procedure booking is usable
-- before a Treatment masters UI exists. Skips Tenants that already have the codes.
INSERT INTO "treatment" (
  "tenant_id",
  "name",
  "code",
  "duration_minutes",
  "setup_minutes",
  "cleaning_minutes",
  "room_type",
  "therapist_skill"
)
SELECT
  "organization"."id",
  seed."name",
  seed."code",
  seed."duration_minutes",
  seed."setup_minutes",
  seed."cleaning_minutes",
  seed."room_type",
  seed."therapist_skill"
FROM "organization"
CROSS JOIN (
  VALUES
    (
      'Abhyanga wellness programme',
      'TRT-0400',
      60,
      10,
      5,
      'Panchakarma room',
      'Abhyanga'
    ),
    (
      'Shirodhara relaxation programme',
      'TRT-0401',
      60,
      10,
      5,
      'Therapy room',
      'Shirodhara'
    )
) AS seed (
  "name",
  "code",
  "duration_minutes",
  "setup_minutes",
  "cleaning_minutes",
  "room_type",
  "therapist_skill"
)
WHERE NOT EXISTS (
  SELECT 1
  FROM "treatment"
  WHERE "treatment"."tenant_id" = "organization"."id"
    AND lower("treatment"."code") = lower(seed."code")
    AND "treatment"."is_deleted" = false
);
--> statement-breakpoint
INSERT INTO "treatment_session" (
  "tenant_id",
  "treatment_id",
  "session_number",
  "label",
  "procedure",
  "duration_minutes",
  "setup_minutes",
  "cleaning_minutes",
  "preparation",
  "warning",
  "equipment",
  "room_type",
  "therapist_skill"
)
SELECT
  "treatment"."tenant_id",
  "treatment"."id",
  session."session_number",
  session."label",
  session."procedure",
  60,
  10,
  5,
  session."preparation",
  session."warning",
  session."equipment",
  "treatment"."room_type",
  "treatment"."therapist_skill"
FROM "treatment"
INNER JOIN (
  VALUES
    (
      'TRT-0400',
      1,
      'Session 1 of 6 · Abhyanga + Swedana',
      'Abhyanga + Swedana',
      'Patient to arrive hydrated; remove jewellery before treatment.',
      'Confirm oil allergy screening before starting.',
      'Steam cabinet, warm sesame oil, towels'
    ),
    (
      'TRT-0400',
      2,
      'Session 2 of 6 · Abhyanga + Swedana',
      'Abhyanga + Swedana',
      'Patient to arrive hydrated; remove jewellery before treatment.',
      'Confirm oil allergy screening before starting.',
      'Steam cabinet, warm sesame oil, towels'
    ),
    (
      'TRT-0400',
      3,
      'Session 3 of 6 · Abhyanga + Swedana',
      'Abhyanga + Swedana',
      'Patient to arrive hydrated; remove jewellery before treatment.',
      'Confirm oil allergy screening before starting.',
      'Steam cabinet, warm sesame oil, towels'
    ),
    (
      'TRT-0400',
      4,
      'Session 4 of 6 · Abhyanga + Swedana',
      'Abhyanga + Swedana',
      'Patient to arrive hydrated; remove jewellery before treatment.',
      'Confirm oil allergy screening before starting.',
      'Steam cabinet, warm sesame oil, towels'
    ),
    (
      'TRT-0400',
      5,
      'Session 5 of 6 · Abhyanga + Swedana',
      'Abhyanga + Swedana',
      'Patient to arrive hydrated; remove jewellery before treatment.',
      'Confirm oil allergy screening before starting.',
      'Steam cabinet, warm sesame oil, towels'
    ),
    (
      'TRT-0400',
      6,
      'Session 6 of 6 · Abhyanga + Swedana',
      'Abhyanga + Swedana',
      'Patient to arrive hydrated; remove jewellery before treatment.',
      'Confirm oil allergy screening before starting.',
      'Steam cabinet, warm sesame oil, towels'
    ),
    (
      'TRT-0401',
      1,
      'Session 1 of 2 · Shirodhara',
      'Shirodhara',
      'Patient to rest with eyes closed; hair should be clean and oil-free at the crown.',
      'Stop if the Patient reports dizziness or discomfort at the forehead.',
      'Dhara pot, warm herbal oil, towels, reclining table'
    ),
    (
      'TRT-0401',
      2,
      'Session 2 of 2 · Shirodhara',
      'Shirodhara',
      'Patient to rest with eyes closed; hair should be clean and oil-free at the crown.',
      'Stop if the Patient reports dizziness or discomfort at the forehead.',
      'Dhara pot, warm herbal oil, towels, reclining table'
    )
) AS session (
  "code",
  "session_number",
  "label",
  "procedure",
  "preparation",
  "warning",
  "equipment"
) ON lower("treatment"."code") = lower(session."code")
WHERE "treatment"."is_deleted" = false
  AND NOT EXISTS (
    SELECT 1
    FROM "treatment_session"
    WHERE "treatment_session"."treatment_id" = "treatment"."id"
      AND "treatment_session"."session_number" = session."session_number"
      AND "treatment_session"."is_deleted" = false
  );
