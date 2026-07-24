ALTER TABLE "appointment" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "deactivated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "reactivated_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "admission_tenant_patient_idx" ON "admission" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE INDEX "appointment_tenant_patient_idx" ON "appointment" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE INDEX "clinical_note_tenant_patient_idx" ON "clinical_note" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE INDEX "visit_tenant_patient_idx" ON "visit" USING btree ("tenant_id","patient_id");