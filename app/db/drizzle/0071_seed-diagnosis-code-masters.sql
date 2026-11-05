-- Backfill the Ayurveda Diagnosis Code permissions into the global Permission Catalogue.
-- New onboardings seed these via seedPermissionCatalogue(); this migration keeps existing
-- databases in sync. Idempotent via ON CONFLICT DO NOTHING on the unique permission name.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('clinical-masters', 'ayurveda-diagnosis-code', 'read', 'ayurveda-diagnosis-code:read', 'View Ayurveda Diagnosis Codes.'),
  ('clinical-masters', 'ayurveda-diagnosis-code', 'create', 'ayurveda-diagnosis-code:create', 'Create Ayurveda Diagnosis Codes.'),
  ('clinical-masters', 'ayurveda-diagnosis-code', 'update', 'ayurveda-diagnosis-code:update', 'Update Ayurveda Diagnosis Codes.'),
  ('clinical-masters', 'ayurveda-diagnosis-code', 'delete', 'ayurveda-diagnosis-code:delete', 'Delete Ayurveda Diagnosis Codes.')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
-- Existing tenants already have their System Roles, so give active Tenant Admin roles the
-- same full-access default that onboarding applies after seeding the Permission Catalogue.
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT "role"."tenant_id", "role"."id", "permission"."id"
FROM "role"
CROSS JOIN "permission"
WHERE "role"."code" = 'TENANT_ADMIN'
  AND "role"."is_system" = true
  AND "role"."is_deleted" = false
  AND "permission"."is_active" = true
  AND "permission"."resource" = 'ayurveda-diagnosis-code'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint
-- Add starter Diagnosis Codes for Tenants that do not have them yet.
-- Existing codes, including removed ones, take precedence.
INSERT INTO "diagnosis_code" ("tenant_id", "code", "title", "category")
SELECT o."id", defaults."code", defaults."title", defaults."category"
FROM "organization" o
CROSS JOIN (VALUES
  ('I10', 'Essential (primary) hypertension', 'Circulatory'),
  ('E11', 'Type 2 diabetes mellitus', 'Endocrine'),
  ('J45', 'Asthma', 'Respiratory'),
  ('J06', 'Acute upper respiratory infection', 'Respiratory'),
  ('J02', 'Acute pharyngitis', 'Respiratory'),
  ('J20', 'Acute bronchitis', 'Respiratory'),
  ('A09', 'Infectious gastroenteritis and colitis', 'Infectious'),
  ('K21', 'Gastro-oesophageal reflux disease', 'Digestive'),
  ('K29', 'Gastritis and duodenitis', 'Digestive'),
  ('M54', 'Dorsalgia (back pain)', 'Musculoskeletal'),
  ('M25', 'Joint disorder, unspecified', 'Musculoskeletal'),
  ('R51', 'Headache', 'Symptoms'),
  ('R10', 'Abdominal and pelvic pain', 'Symptoms'),
  ('R50', 'Fever of unknown origin', 'Symptoms'),
  ('N39', 'Urinary tract infection, site not specified', 'Genitourinary'),
  ('E78', 'Disorders of lipoprotein metabolism', 'Endocrine'),
  ('F32', 'Depressive episode', 'Mental'),
  ('F41', 'Anxiety disorder', 'Mental'),
  ('L20', 'Atopic dermatitis', 'Skin'),
  ('H66', 'Suppurative and unspecified otitis media', 'Ear')
) AS defaults("code", "title", "category")
WHERE NOT EXISTS (
  SELECT 1 FROM "diagnosis_code" existing
  WHERE existing."tenant_id" = o."id"
    AND lower(existing."code") = lower(defaults."code")
)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Add starter Ayurveda Diagnosis Codes to every existing Tenant. The AYU- codes are local
-- identifiers, not NAMASTE or ICD-11 TM2 codes.
INSERT INTO "ayurveda_diagnosis_code" ("tenant_id", "code", "title", "category")
SELECT o."id", defaults."code", defaults."title", defaults."category"
FROM "organization" o
CROSS JOIN (VALUES
  ('AYU-JVARA', 'Jvara (Fever)', 'General'),
  ('AYU-PANDU', 'Pandu (Anaemia)', 'General'),
  ('AYU-KASA', 'Kasa (Cough)', 'Respiratory'),
  ('AYU-SHVASA', 'Shvasa (Dyspnoea)', 'Respiratory'),
  ('AYU-PRATISHYAYA', 'Pratishyaya (Rhinitis)', 'Respiratory'),
  ('AYU-AGNIMANDYA', 'Agnimandya (Impaired digestion)', 'Digestive'),
  ('AYU-AJIRNA', 'Ajirna (Indigestion)', 'Digestive'),
  ('AYU-AMLAPITTA', 'Amlapitta (Hyperacidity)', 'Digestive'),
  ('AYU-GRAHANI', 'Grahani (Malabsorption disorders)', 'Digestive'),
  ('AYU-ATISARA', 'Atisara (Diarrhoea)', 'Digestive'),
  ('AYU-VIBANDHA', 'Vibandha (Constipation)', 'Digestive'),
  ('AYU-ARSHA', 'Arsha (Haemorrhoids)', 'Digestive'),
  ('AYU-KAMALA', 'Kamala (Jaundice)', 'Digestive'),
  ('AYU-AMAVATA', 'Amavata (Rheumatoid arthritis)', 'Musculoskeletal'),
  ('AYU-SANDHIVATA', 'Sandhivata (Osteoarthritis)', 'Musculoskeletal'),
  ('AYU-VATARAKTA', 'Vatarakta (Gout)', 'Musculoskeletal'),
  ('AYU-GRIDHRASI', 'Gridhrasi (Sciatica)', 'Musculoskeletal'),
  ('AYU-KATIGRAHA', 'Katigraha (Low back stiffness)', 'Musculoskeletal'),
  ('AYU-MANYASTAMBHA', 'Manyastambha (Neck stiffness)', 'Musculoskeletal'),
  ('AYU-AVABAHUKA', 'Avabahuka (Frozen shoulder)', 'Musculoskeletal'),
  ('AYU-PAKSHAGHATA', 'Pakshaghata (Hemiplegia)', 'Neurological'),
  ('AYU-ARDITA', 'Ardita (Facial palsy)', 'Neurological'),
  ('AYU-ARDHAVABHEDAKA', 'Ardhavabhedaka (Migraine)', 'Neurological'),
  ('AYU-PRAMEHA', 'Prameha (Urinary and metabolic disorders)', 'Metabolic'),
  ('AYU-MADHUMEHA', 'Madhumeha (Diabetes mellitus)', 'Metabolic'),
  ('AYU-STHAULYA', 'Sthaulya (Obesity)', 'Metabolic'),
  ('AYU-KUSHTHA', 'Kushtha (Skin disorders)', 'Skin'),
  ('AYU-VICHARCHIKA', 'Vicharchika (Eczema)', 'Skin'),
  ('AYU-SHVITRA', 'Shvitra (Vitiligo)', 'Skin'),
  ('AYU-MUTRAKRICHRA', 'Mutrakrichra (Dysuria)', 'Urinary'),
  ('AYU-ASHMARI', 'Ashmari (Urinary calculi)', 'Urinary'),
  ('AYU-ANIDRA', 'Anidra (Insomnia)', 'Mental'),
  ('AYU-CHITTODVEGA', 'Chittodvega (Anxiety)', 'Mental'),
  ('AYU-KASHTARTAVA', 'Kashtartava (Dysmenorrhoea)', 'Women''s health')
) AS defaults("code", "title", "category")
WHERE NOT EXISTS (
  SELECT 1 FROM "ayurveda_diagnosis_code" existing
  WHERE existing."tenant_id" = o."id"
    AND lower(existing."code") = lower(defaults."code")
)
ON CONFLICT DO NOTHING;
