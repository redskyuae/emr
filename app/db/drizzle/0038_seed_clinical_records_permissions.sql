-- Backfill the Clinical Records permissions into the global Permission Catalogue for
-- already-onboarded Tenants. New onboardings seed these via seedPermissionCatalogue();
-- this migration keeps existing databases in sync. Idempotent via ON CONFLICT DO NOTHING
-- on the unique permission name.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('clinical-records', 'allergy', 'read', 'allergy:read', 'View Patient Allergies.'),
  ('clinical-records', 'allergy', 'create', 'allergy:create', 'Create Patient Allergies.'),
  ('clinical-records', 'allergy', 'update', 'allergy:update', 'Update Patient Allergies.'),
  ('clinical-records', 'allergy', 'delete', 'allergy:delete', 'Delete Patient Allergies.'),
  ('clinical-records', 'problem', 'read', 'problem:read', 'View Patient Problems.'),
  ('clinical-records', 'problem', 'create', 'problem:create', 'Create Patient Problems.'),
  ('clinical-records', 'problem', 'update', 'problem:update', 'Update Patient Problems.'),
  ('clinical-records', 'problem', 'delete', 'problem:delete', 'Delete Patient Problems.'),
  ('clinical-records', 'vital-sign', 'read', 'vital-sign:read', 'View Patient Vital Signs.'),
  ('clinical-records', 'vital-sign', 'create', 'vital-sign:create', 'Create Patient Vital Signs.'),
  ('clinical-records', 'vital-sign', 'update', 'vital-sign:update', 'Update Patient Vital Signs.'),
  ('clinical-records', 'vital-sign', 'delete', 'vital-sign:delete', 'Delete Patient Vital Signs.'),
  ('clinical-records', 'medication', 'read', 'medication:read', 'View Patient Medications.'),
  ('clinical-records', 'medication', 'create', 'medication:create', 'Create Patient Medications.'),
  ('clinical-records', 'medication', 'update', 'medication:update', 'Update Patient Medications.'),
  ('clinical-records', 'medication', 'delete', 'medication:delete', 'Delete Patient Medications.'),
  ('clinical-records', 'clinical-note', 'read', 'clinical-note:read', 'View Clinical Notes.'),
  ('clinical-records', 'clinical-note', 'create', 'clinical-note:create', 'Create Clinical Notes.'),
  ('clinical-records', 'clinical-note', 'update', 'clinical-note:update', 'Update Clinical Notes.'),
  ('clinical-records', 'clinical-note', 'delete', 'clinical-note:delete', 'Delete Clinical Notes.'),
  ('clinical-records', 'clinical-note', 'sign', 'clinical-note:sign', 'Sign Clinical Notes.')
ON CONFLICT ("name") DO NOTHING;
