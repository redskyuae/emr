ALTER TABLE "patient_treatment_plan_session" ADD COLUMN "started_visit_id" integer;--> statement-breakpoint
ALTER TABLE "patient_treatment_plan_session" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patient_treatment_plan_session" ADD CONSTRAINT "patient_treatment_plan_session_started_visit_id_visit_id_fk" FOREIGN KEY ("started_visit_id") REFERENCES "public"."visit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "patient_treatment_plan_session_tenant_plan_started_visit_idx" ON "patient_treatment_plan_session" USING btree ("tenant_id","patient_treatment_plan_id","started_visit_id") WHERE "patient_treatment_plan_session"."started_visit_id" is not null and "patient_treatment_plan_session"."is_deleted" = false;--> statement-breakpoint
ALTER TABLE "patient_treatment_plan_session" ADD CONSTRAINT "patient_treatment_plan_session_started_check" CHECK (("patient_treatment_plan_session"."started_visit_id" is null) = ("patient_treatment_plan_session"."started_at" is null));--> statement-breakpoint
-- Backfill the Session plan and start permissions for already-onboarded Tenants. New
-- onboardings receive these through the Permission Catalogue seed path.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('appointments', 'patient-treatment-plan', 'update', 'patient-treatment-plan:update', 'Edit the plan of Patient Treatment Plan Sessions.'),
  ('appointments', 'patient-treatment-plan', 'start', 'patient-treatment-plan:start', 'Start Patient Treatment Plan Sessions in a Visit.')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT "role"."tenant_id", "role"."id", "permission"."id"
FROM "role"
CROSS JOIN "permission"
WHERE "role"."code" = 'TENANT_ADMIN'
  AND "role"."is_system" = true
  AND "role"."is_deleted" = false
  AND "permission"."is_active" = true
  AND "permission"."name" IN ('patient-treatment-plan:update', 'patient-treatment-plan:start')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
