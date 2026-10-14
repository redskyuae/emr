-- Before the rebase, this branch shipped the Patient columns as migrations
-- 0056-0060. Some databases applied those migrations, so this reconciliation
-- must also work when the columns already exist.
DROP INDEX IF EXISTS "patient_tenant_emirates_id_idx";--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "title" varchar(20);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "race" varchar(20);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "ethnic_group" varchar(30);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "photo_url" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "patient_identification_category" varchar(60);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "passport_number" varchar(50);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "uid" varchar(30);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "is_vip" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "sms_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "is_medical_tourist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN IF NOT EXISTS "emergency_contact_gender" varchar(20);--> statement-breakpoint
CREATE UNIQUE INDEX "patient_tenant_emirates_id_idx" ON "patient" USING btree ("tenant_id","emirates_id") WHERE "patient"."is_deleted" = false and "patient"."emirates_id" is not null and "patient"."emirates_id" like '784%';
