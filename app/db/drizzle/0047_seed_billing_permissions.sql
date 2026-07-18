-- Backfill the Billing permissions into the global Permission Catalogue for already-onboarded
-- Tenants. New onboardings seed these via seedPermissionCatalogue(); this migration keeps
-- existing databases in sync. Idempotent via ON CONFLICT DO NOTHING on the unique permission name.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('billing-masters', 'charge-item', 'read', 'charge-item:read', 'View Charge Items.'),
  ('billing-masters', 'charge-item', 'create', 'charge-item:create', 'Create Charge Items.'),
  ('billing-masters', 'charge-item', 'update', 'charge-item:update', 'Update Charge Items.'),
  ('billing-masters', 'charge-item', 'delete', 'charge-item:delete', 'Delete Charge Items.'),
  ('billing', 'invoice', 'read', 'invoice:read', 'View Invoices.'),
  ('billing', 'invoice', 'create', 'invoice:create', 'Create Invoices.'),
  ('billing', 'invoice', 'update', 'invoice:update', 'Update Draft Invoice details.'),
  ('billing', 'invoice', 'delete', 'invoice:delete', 'Delete Draft or Void Invoices.'),
  ('billing', 'invoice', 'finalize', 'invoice:finalize', 'Finalize a Draft Invoice.'),
  ('billing', 'invoice', 'void', 'invoice:void', 'Void an Invoice without Payments.'),
  ('billing', 'invoice', 'generate-charges', 'invoice:generate-charges', 'Generate Bed-Day Charges for an Admission Invoice.'),
  ('billing', 'payment', 'read', 'payment:read', 'View Payments recorded against Invoices.'),
  ('billing', 'payment', 'record', 'payment:record', 'Record Payments against Invoices.')
ON CONFLICT ("name") DO NOTHING;
