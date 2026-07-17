-- Backfill the Inpatient permissions into the global Permission Catalogue for already-onboarded
-- Tenants. New onboardings seed these via seedPermissionCatalogue(); this migration keeps
-- existing databases in sync. Idempotent via ON CONFLICT DO NOTHING on the unique permission name.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('inpatient-masters', 'ward', 'read', 'ward:read', 'View Wards.'),
  ('inpatient-masters', 'ward', 'create', 'ward:create', 'Create Wards.'),
  ('inpatient-masters', 'ward', 'update', 'ward:update', 'Update Wards.'),
  ('inpatient-masters', 'ward', 'delete', 'ward:delete', 'Delete Wards without assigned Beds.'),
  ('inpatient-masters', 'bed', 'read', 'bed:read', 'View Beds.'),
  ('inpatient-masters', 'bed', 'create', 'bed:create', 'Create Beds.'),
  ('inpatient-masters', 'bed', 'update', 'bed:update', 'Update Beds.'),
  ('inpatient-masters', 'bed', 'delete', 'bed:delete', 'Delete unoccupied Beds.'),
  ('inpatient-masters', 'admission-type', 'read', 'admission-type:read', 'View AdmissionTypes.'),
  ('inpatient-masters', 'admission-type', 'create', 'admission-type:create', 'Create AdmissionTypes.'),
  ('inpatient-masters', 'admission-type', 'update', 'admission-type:update', 'Update AdmissionTypes.'),
  ('inpatient-masters', 'admission-type', 'delete', 'admission-type:delete', 'Delete AdmissionTypes.'),
  ('inpatient', 'admission', 'read', 'admission:read', 'View Admissions.'),
  ('inpatient', 'admission', 'create', 'admission:create', 'Admit Patients.'),
  ('inpatient', 'admission', 'update', 'admission:update', 'Update Admission details.'),
  ('inpatient', 'admission', 'delete', 'admission:delete', 'Delete Admissions.'),
  ('inpatient', 'admission', 'transfer', 'admission:transfer', 'Transfer an Admission to another Bed.'),
  ('inpatient', 'admission', 'discharge', 'admission:discharge', 'Discharge an Admission.'),
  ('inpatient', 'admission', 'cancel', 'admission:cancel', 'Cancel an Admission.')
ON CONFLICT ("name") DO NOTHING;
