-- Add starter Billing Masters for tenants onboarded before Visit billing existed.
-- Existing services, including removed ones, take precedence.
INSERT INTO "charge_item" (
  "tenant_id", "code", "name", "category", "unit_price", "cash_price",
  "visit_charge_kind", "free_follow_up_eligible"
)
SELECT
  o."id", defaults."code", defaults."name", defaults."category",
  defaults."unit_price", defaults."unit_price", defaults."visit_charge_kind",
  defaults."free_follow_up_eligible"
FROM "organization" o
CROSS JOIN (VALUES
  ('CONS_NEW', 'New Consultation', 'CONSULTATION', 200.00, 'NEW_CONSULTATION', false),
  ('CONS_EST', 'Established Consultation', 'CONSULTATION', 150.00, 'ESTABLISHED_CONSULTATION', false),
  ('CONS_FUP', 'Follow-up Consultation', 'CONSULTATION', 150.00, 'FOLLOW_UP_CONSULTATION', true),
  ('TREAT_SESSION', 'Treatment Session', 'PROCEDURE', 250.00, 'TREATMENT_SESSION', false)
) AS defaults("code", "name", "category", "unit_price", "visit_charge_kind", "free_follow_up_eligible")
WHERE NOT EXISTS (
  SELECT 1 FROM "charge_item" existing
  WHERE existing."tenant_id" = o."id"
    AND (
      lower(existing."code") = lower(defaults."code")
      OR lower(existing."name") = lower(defaults."name")
      OR existing."visit_charge_kind" = defaults."visit_charge_kind"
    )
)
ON CONFLICT DO NOTHING;
