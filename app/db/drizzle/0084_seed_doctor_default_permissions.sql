-- Backfill the Doctor System Role's default Permissions for already-onboarded Tenants so a
-- Doctor can work Patients, Appointments, Book Appointment, Visits and Previous Visits. New
-- onboardings receive the same list from DEFAULT_PERMISSION_NAMES_BY_SYSTEM_ROLE. Assignments
-- are only added, never removed, so a Tenant's own additions to the Doctor Role are kept.
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT "role"."tenant_id", "role"."id", "permission"."id"
FROM "role"
CROSS JOIN "permission"
WHERE "role"."code" = 'DOCTOR'
  AND "role"."is_system" = true
  AND "role"."is_deleted" = false
  AND "permission"."is_active" = true
  AND "permission"."name" IN (
    'appointment-mode:read',
    'appointment-type:read',
    'appointment-status:read',
    'appointment-reason:read',
    'appointment-cancelled-reason:read',
    'language:read',
    'nationality:read',
    'religion:read',
    'country:read',
    'state:read',
    'specialty:read',
    'doctor:read',
    'patient:read',
    'patient:create',
    'patient:update',
    'appointment:read',
    'appointment:create',
    'visit:read',
    'visit:create',
    'visit:update',
    'visit:start',
    'visit:complete',
    'visit:cancel',
    'visit-type:read',
    'admit-source:read',
    'clinical-note:read',
    'clinical-note:create',
    'clinical-note:update',
    'clinical-note:sign',
    'vital-sign:read',
    'vital-sign:create',
    'vital-sign:update',
    'allergy:read',
    'allergy:create',
    'allergy:update',
    'problem:read',
    'problem:create',
    'problem:update',
    'medication:read',
    'medication:create',
    'medication:update',
    'diagnosis-code:read',
    'ayurveda-diagnosis-code:read',
    'allergen:read',
    'clinical-note-type:read',
    'treatment:read',
    'patient-treatment-plan:read',
    'patient-treatment-plan:assign',
    'patient-treatment-plan:update'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
