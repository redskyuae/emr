-- Newly provisioned Tenants receive default VisitTypes from Tenant Onboarding, but
-- already-onboarded Tenants never re-run onboarding (onboardTenantCommand returns
-- immediately once isOnboarded), and new master families are deliberately not
-- backfilled there. VisitType is required to check a Patient in, so without this
-- backfill every existing Tenant's Check-in is rejected until someone hand-creates
-- master data.
--
-- The usual objection to backfilling a master family — that it resurrects rows a
-- Tenant deliberately soft-deleted — cannot apply here: visit_type is introduced in
-- 0041, so no Tenant has ever had a row in it. Idempotent via ON CONFLICT DO NOTHING
-- against the partial unique indexes.
INSERT INTO "visit_type" ("tenant_id", "name", "code", "description")
SELECT
  "organization"."id",
  "defaults"."name",
  "defaults"."code",
  "defaults"."description"
FROM "organization"
CROSS JOIN (
  VALUES
    ('OPD Consultation', 'OPD', 'Standard outpatient consultation'),
    ('Follow-up', 'FUP', 'Follow-up on an earlier Visit'),
    ('Procedure', 'PROC', 'Day procedure without Admission'),
    ('Vaccination', 'VAC', 'Vaccination or immunisation Visit'),
    ('Emergency', 'EMER', 'Walk-in emergency attendance')
) AS "defaults" ("name", "code", "description")
ON CONFLICT DO NOTHING;
