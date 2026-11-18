-- Seed the starter Ayurveda Diagnosis Codes for already-onboarded Tenants so the Visit
-- Diagnoses picker and the Ayurveda Diagnosis Code master are not empty. New onboardings seed
-- these via seedDefaultClinicalMastersCommand(). The codes are left unmapped to ICD-10-CM.
-- A code the Tenant already holds, including one it deleted, is skipped, so re-running this
-- neither duplicates codes nor restores ones a Tenant removed.
INSERT INTO "ayurveda_diagnosis_code" ("tenant_id", "code", "name", "english_name", "category")
SELECT o."id", defaults."code", defaults."name", defaults."english_name", defaults."category"
FROM "organization" o
CROSS JOIN (VALUES
  ('AYU-JVARA', 'Jvara', 'Fever', 'General'),
  ('AYU-PANDU', 'Pandu', 'Anaemia', 'General'),
  ('AYU-KASA', 'Kasa', 'Cough', 'Respiratory'),
  ('AYU-SHVASA', 'Shvasa', 'Dyspnoea', 'Respiratory'),
  ('AYU-PRATISHYAYA', 'Pratishyaya', 'Rhinitis', 'Respiratory'),
  ('AYU-AGNIMANDYA', 'Agnimandya', 'Impaired digestion', 'Digestive'),
  ('AYU-AJIRNA', 'Ajirna', 'Indigestion', 'Digestive'),
  ('AYU-AMLAPITTA', 'Amlapitta', 'Hyperacidity', 'Digestive'),
  ('AYU-GRAHANI', 'Grahani', 'Malabsorption disorders', 'Digestive'),
  ('AYU-ATISARA', 'Atisara', 'Diarrhoea', 'Digestive'),
  ('AYU-VIBANDHA', 'Vibandha', 'Constipation', 'Digestive'),
  ('AYU-ARSHA', 'Arsha', 'Haemorrhoids', 'Digestive'),
  ('AYU-KAMALA', 'Kamala', 'Jaundice', 'Digestive'),
  ('AYU-AMAVATA', 'Amavata', 'Rheumatoid arthritis', 'Musculoskeletal'),
  ('AYU-SANDHIVATA', 'Sandhivata', 'Osteoarthritis', 'Musculoskeletal'),
  ('AYU-VATARAKTA', 'Vatarakta', 'Gout', 'Musculoskeletal'),
  ('AYU-GRIDHRASI', 'Gridhrasi', 'Sciatica', 'Musculoskeletal'),
  ('AYU-KATIGRAHA', 'Katigraha', 'Low back stiffness', 'Musculoskeletal'),
  ('AYU-MANYASTAMBHA', 'Manyastambha', 'Neck stiffness', 'Musculoskeletal'),
  ('AYU-AVABAHUKA', 'Avabahuka', 'Frozen shoulder', 'Musculoskeletal'),
  ('AYU-PAKSHAGHATA', 'Pakshaghata', 'Hemiplegia', 'Neurological'),
  ('AYU-ARDITA', 'Ardita', 'Facial palsy', 'Neurological'),
  ('AYU-ARDHAVABHEDAKA', 'Ardhavabhedaka', 'Migraine', 'Neurological'),
  ('AYU-PRAMEHA', 'Prameha', 'Urinary and metabolic disorders', 'Metabolic'),
  ('AYU-MADHUMEHA', 'Madhumeha', 'Diabetes mellitus', 'Metabolic'),
  ('AYU-STHAULYA', 'Sthaulya', 'Obesity', 'Metabolic'),
  ('AYU-KUSHTHA', 'Kushtha', 'Skin disorders', 'Skin'),
  ('AYU-VICHARCHIKA', 'Vicharchika', 'Eczema', 'Skin'),
  ('AYU-SHVITRA', 'Shvitra', 'Vitiligo', 'Skin'),
  ('AYU-MUTRAKRICHRA', 'Mutrakrichra', 'Dysuria', 'Urinary'),
  ('AYU-ASHMARI', 'Ashmari', 'Urinary calculi', 'Urinary'),
  ('AYU-ANIDRA', 'Anidra', 'Insomnia', 'Mental'),
  ('AYU-CHITTODVEGA', 'Chittodvega', 'Anxiety', 'Mental'),
  ('AYU-KASHTARTAVA', 'Kashtartava', 'Dysmenorrhoea', 'Women''s health')
) AS defaults("code", "name", "english_name", "category")
WHERE NOT EXISTS (
  SELECT 1
  FROM "ayurveda_diagnosis_code" existing
  WHERE existing."tenant_id" = o."id"
    AND lower(existing."code") = lower(defaults."code")
)
ON CONFLICT DO NOTHING;
