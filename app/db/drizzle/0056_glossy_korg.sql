ALTER TABLE "patient" ADD COLUMN "patient_identification_category" varchar(60);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "uid" varchar(30);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "is_vip" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "sms_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "is_medical_tourist" boolean DEFAULT false NOT NULL;