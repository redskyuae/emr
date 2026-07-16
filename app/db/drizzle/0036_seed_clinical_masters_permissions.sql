-- Backfill the Clinical Masters permissions into the global Permission Catalogue for
-- already-onboarded Tenants. New onboardings seed these via seedPermissionCatalogue();
-- this migration keeps existing databases in sync. Idempotent via ON CONFLICT DO NOTHING
-- on the unique permission name.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('clinical-masters', 'diagnosis-code', 'read', 'diagnosis-code:read', 'View Diagnosis Codes.'),
  ('clinical-masters', 'diagnosis-code', 'create', 'diagnosis-code:create', 'Create Diagnosis Codes.'),
  ('clinical-masters', 'diagnosis-code', 'update', 'diagnosis-code:update', 'Update Diagnosis Codes.'),
  ('clinical-masters', 'diagnosis-code', 'delete', 'diagnosis-code:delete', 'Delete Diagnosis Codes.'),
  ('clinical-masters', 'allergen', 'read', 'allergen:read', 'View Allergens.'),
  ('clinical-masters', 'allergen', 'create', 'allergen:create', 'Create Allergens.'),
  ('clinical-masters', 'allergen', 'update', 'allergen:update', 'Update Allergens.'),
  ('clinical-masters', 'allergen', 'delete', 'allergen:delete', 'Delete Allergens.'),
  ('clinical-masters', 'clinical-note-type', 'read', 'clinical-note-type:read', 'View Clinical Note Types.'),
  ('clinical-masters', 'clinical-note-type', 'create', 'clinical-note-type:create', 'Create Clinical Note Types.'),
  ('clinical-masters', 'clinical-note-type', 'update', 'clinical-note-type:update', 'Update Clinical Note Types.'),
  ('clinical-masters', 'clinical-note-type', 'delete', 'clinical-note-type:delete', 'Delete Clinical Note Types.')
ON CONFLICT ("name") DO NOTHING;
