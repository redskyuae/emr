-- Backfill the Visits permissions into the global Permission Catalogue for already-onboarded
-- Tenants. New onboardings seed these via seedPermissionCatalogue(); this migration keeps
-- existing databases in sync. Idempotent via ON CONFLICT DO NOTHING on the unique permission name.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('visits', 'visit-type', 'read', 'visit-type:read', 'View VisitTypes.'),
  ('visits', 'visit-type', 'create', 'visit-type:create', 'Create VisitTypes.'),
  ('visits', 'visit-type', 'update', 'visit-type:update', 'Update VisitTypes.'),
  ('visits', 'visit-type', 'delete', 'visit-type:delete', 'Delete VisitTypes.'),
  ('visits', 'visit', 'read', 'visit:read', 'View Visits.'),
  ('visits', 'visit', 'create', 'visit:create', 'Check Patients in for Visits.'),
  ('visits', 'visit', 'update', 'visit:update', 'Update Visit details.'),
  ('visits', 'visit', 'delete', 'visit:delete', 'Delete Visits.'),
  ('visits', 'visit', 'start', 'visit:start', 'Start the consultation for a Visit.'),
  ('visits', 'visit', 'complete', 'visit:complete', 'Complete a Visit.'),
  ('visits', 'visit', 'cancel', 'visit:cancel', 'Cancel a Visit.')
ON CONFLICT ("name") DO NOTHING;
