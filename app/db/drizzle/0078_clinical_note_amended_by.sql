ALTER TABLE "clinical_note" ADD COLUMN "amended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "clinical_note" ADD COLUMN "amended_by_user_id" varchar(255);