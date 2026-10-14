DROP INDEX "patient_tenant_emirates_id_idx";--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "title" varchar(20);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "race" varchar(20);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "ethnic_group" varchar(30);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "patient_identification_category" varchar(60);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "passport_number" varchar(50);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "uid" varchar(30);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "is_vip" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "sms_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "is_medical_tourist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "emergency_contact_gender" varchar(20);--> statement-breakpoint
CREATE UNIQUE INDEX "patient_tenant_emirates_id_idx" ON "patient" USING btree ("tenant_id","emirates_id") WHERE "patient"."is_deleted" = false and "patient"."emirates_id" is not null and "patient"."emirates_id" like '784%';