-- Environments that deployed the abandoned Visit Management branch (PR #217, closed
-- unmerged) still carry the "visit", "visit_status", and "visit_number_counter" tables
-- created by its "0032_outstanding_overlord" migration, which no longer exists on this
-- branch. That stale "visit" squats on this migration's table name and its
-- "visit_id_seq" identity sequence, so the CREATE TABLE below aborts with
-- 42P07 relation "visit_id_seq" already exists — and because Drizzle applies every
-- pending migration in a single transaction, it takes the whole batch down with it.
-- The cleanup has to live here, ahead of the CREATE: a later migration is never reached.
--
-- Guarded on "status_id", which exists only in the abandoned shape (the rebuilt "visit"
-- below has no such column), so this drops the stale tables and nothing else. On a clean
-- database — CI, prod, a fresh dev — "visit" does not exist yet and this is a no-op.
-- The abandoned rows are outpatient Visits from a model that never shipped; the rebuild
-- shares no identifiers with them, so there is nothing to carry forward.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'visit'
			AND column_name = 'status_id'
	) THEN
		DROP TABLE IF EXISTS "visit", "visit_status", "visit_number_counter" CASCADE;
	END IF;
END $$;--> statement-breakpoint
CREATE TABLE "visit" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "visit_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"visit_number" varchar(20) NOT NULL,
	"patient_id" integer NOT NULL,
	"doctor_id" integer NOT NULL,
	"visit_type_id" integer NOT NULL,
	"appointment_id" integer,
	"status" varchar(20) DEFAULT 'CHECKED_IN' NOT NULL,
	"visit_date" date NOT NULL,
	"queue_token" integer NOT NULL,
	"chief_complaint" varchar(500),
	"remarks" text,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consultation_started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" varchar(255),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	CONSTRAINT "visit_status_check" CHECK ("visit"."status" in ('CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'))
);
--> statement-breakpoint
CREATE TABLE "visit_number_counter" (
	"tenant_id" varchar(255) PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visit_queue_token_counter" (
	"tenant_id" varchar(255) NOT NULL,
	"doctor_id" integer NOT NULL,
	"token_date" date NOT NULL,
	"last_number" integer NOT NULL,
	CONSTRAINT "visit_queue_token_counter_tenant_id_doctor_id_token_date_pk" PRIMARY KEY("tenant_id","doctor_id","token_date")
);
--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_doctor_id_doctor_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_visit_type_id_visit_type_id_fk" FOREIGN KEY ("visit_type_id") REFERENCES "public"."visit_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "visit_tenant_visit_number_idx" ON "visit" USING btree ("tenant_id",lower("visit_number"));--> statement-breakpoint
CREATE UNIQUE INDEX "visit_active_appointment_idx" ON "visit" USING btree ("tenant_id","appointment_id") WHERE "visit"."is_deleted" = false and "visit"."appointment_id" is not null and "visit"."status" <> 'CANCELLED';--> statement-breakpoint
CREATE UNIQUE INDEX "visit_active_patient_idx" ON "visit" USING btree ("tenant_id","patient_id") WHERE "visit"."is_deleted" = false and "visit"."status" in ('CHECKED_IN', 'IN_CONSULTATION');--> statement-breakpoint
CREATE UNIQUE INDEX "visit_doctor_day_token_idx" ON "visit" USING btree ("tenant_id","doctor_id","visit_date","queue_token") WHERE "visit"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "visit_tenant_visit_date_idx" ON "visit" USING btree ("tenant_id","visit_date");--> statement-breakpoint
-- The visit_id columns predate the "visit" table: the Clinical Note and Vital Sign
-- create APIs accepted an arbitrary visitId with no foreign key and no validation.
-- "visit" is created empty above, so every pre-existing non-null value is dangling
-- by construction and would abort the ADD CONSTRAINT below (or, worse, silently
-- alias a brand-new Visit id). Clear them first — the value never referenced a real
-- Visit, so nothing is lost.
UPDATE "clinical_note" SET "visit_id" = NULL WHERE "visit_id" IS NOT NULL;--> statement-breakpoint
UPDATE "patient_vital_sign" SET "visit_id" = NULL WHERE "visit_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "clinical_note" ADD CONSTRAINT "clinical_note_visit_id_visit_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_vital_sign" ADD CONSTRAINT "patient_vital_sign_visit_id_visit_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visit"("id") ON DELETE no action ON UPDATE no action;