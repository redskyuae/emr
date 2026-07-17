-- Newly provisioned Tenants receive default AdmissionTypes from Tenant Onboarding, but
-- already-onboarded Tenants never re-run onboarding (onboardTenantCommand returns
-- immediately once isOnboarded). AdmissionType is required to admit a Patient, so without
-- this backfill every existing Tenant's admissions are rejected until someone hand-creates
-- master data.
--
-- admission_type is introduced in 0045, so no Tenant has ever had a row in it and the
-- soft-delete-resurrection objection cannot apply. Idempotent via ON CONFLICT DO NOTHING
-- against the partial unique indexes.
INSERT INTO "admission_type" ("tenant_id", "name", "code", "description")
SELECT
  "organization"."id",
  "defaults"."name",
  "defaults"."code",
  "defaults"."description"
FROM "organization"
CROSS JOIN (
  VALUES
    ('Emergency', 'EMER', 'Unplanned admission through emergency attendance'),
    ('Elective', 'ELEC', 'Planned admission scheduled in advance'),
    ('Transfer', 'TRF', 'Admission transferred in from another facility or OPD'),
    ('Maternity', 'MAT', 'Admission for delivery or obstetric care'),
    ('Day Care', 'DAYC', 'Same-day admission without an overnight stay')
) AS "defaults" ("name", "code", "description")
ON CONFLICT DO NOTHING;
