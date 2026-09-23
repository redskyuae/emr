CREATE TABLE "treatment_import_batch" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "treatment_import_batch_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"source_system" varchar(50) DEFAULT 'DHATHRI' NOT NULL,
	"original_filename" text NOT NULL,
	"workbook_sha256" varchar(64) NOT NULL,
	"status" varchar(40) DEFAULT 'RUNNING' NOT NULL,
	"imported_row_count" integer DEFAULT 0 NOT NULL,
	"skipped_row_count" integer DEFAULT 0 NOT NULL,
	"quarantined_row_count" integer DEFAULT 0 NOT NULL,
	"imported_plan_count" integer DEFAULT 0 NOT NULL,
	"skipped_plan_count" integer DEFAULT 0 NOT NULL,
	"quarantined_plan_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"failure_summary" text,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treatment_import_batch_source_system_check" CHECK ("treatment_import_batch"."source_system" = 'DHATHRI'),
	CONSTRAINT "treatment_import_batch_status_check" CHECK ("treatment_import_batch"."status" in ('RUNNING', 'COMPLETED', 'COMPLETED_WITH_QUARANTINE', 'FAILED')),
	CONSTRAINT "treatment_import_batch_workbook_hash_check" CHECK (char_length("treatment_import_batch"."workbook_sha256") = 64),
	CONSTRAINT "treatment_import_batch_nonnegative_counts_check" CHECK ("treatment_import_batch"."imported_row_count" >= 0
        and "treatment_import_batch"."skipped_row_count" >= 0
        and "treatment_import_batch"."quarantined_row_count" >= 0
        and "treatment_import_batch"."imported_plan_count" >= 0
        and "treatment_import_batch"."skipped_plan_count" >= 0
        and "treatment_import_batch"."quarantined_plan_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "treatment_import_row" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "treatment_import_row_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"batch_id" integer NOT NULL,
	"sheet_name" text NOT NULL,
	"source_row_number" integer NOT NULL,
	"row_sha256" varchar(64) NOT NULL,
	"raw_treatment" text,
	"raw_total_session" text,
	"raw_mrn" text,
	"raw_visit_id" text,
	"raw_visit_number" text,
	"raw_treatment_status" text,
	"raw_session_number" text,
	"raw_conduction_note" text,
	"raw_session_status" text,
	"legacy_treatment_identity" text,
	"legacy_plan_key" varchar(64),
	"outcome" varchar(20) NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"canonical_treatment_id" integer,
	"canonical_patient_treatment_plan_id" integer,
	"canonical_patient_treatment_plan_session_id" integer,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treatment_import_row_source_row_number_check" CHECK ("treatment_import_row"."source_row_number" > 0),
	CONSTRAINT "treatment_import_row_hash_check" CHECK (char_length("treatment_import_row"."row_sha256") = 64),
	CONSTRAINT "treatment_import_row_legacy_plan_key_check" CHECK ("treatment_import_row"."legacy_plan_key" is null or char_length("treatment_import_row"."legacy_plan_key") = 64),
	CONSTRAINT "treatment_import_row_outcome_check" CHECK ("treatment_import_row"."outcome" in ('IMPORTED', 'SKIPPED', 'QUARANTINED'))
);
--> statement-breakpoint
ALTER TABLE "patient_treatment_plan" ADD COLUMN "legacy_source_key" varchar(64);--> statement-breakpoint
ALTER TABLE "patient_treatment_plan" ADD COLUMN "legacy_source_content_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "patient_treatment_plan" ADD COLUMN "source_import_batch_id" integer;--> statement-breakpoint
ALTER TABLE "treatment_import_row" ADD CONSTRAINT "treatment_import_row_batch_id_treatment_import_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."treatment_import_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_import_row" ADD CONSTRAINT "treatment_import_row_canonical_treatment_id_treatment_id_fk" FOREIGN KEY ("canonical_treatment_id") REFERENCES "public"."treatment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_import_row" ADD CONSTRAINT "treatment_import_row_canonical_patient_treatment_plan_id_patient_treatment_plan_id_fk" FOREIGN KEY ("canonical_patient_treatment_plan_id") REFERENCES "public"."patient_treatment_plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_import_row" ADD CONSTRAINT "treatment_import_row_canonical_patient_treatment_plan_session_id_patient_treatment_plan_session_id_fk" FOREIGN KEY ("canonical_patient_treatment_plan_session_id") REFERENCES "public"."patient_treatment_plan_session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "treatment_import_batch_tenant_status_idx" ON "treatment_import_batch" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "treatment_import_batch_tenant_source_workbook_idx" ON "treatment_import_batch" USING btree ("tenant_id","source_system","workbook_sha256");--> statement-breakpoint
CREATE INDEX "treatment_import_row_tenant_batch_idx" ON "treatment_import_row" USING btree ("tenant_id","batch_id");--> statement-breakpoint
CREATE INDEX "treatment_import_row_tenant_legacy_plan_idx" ON "treatment_import_row" USING btree ("tenant_id","legacy_plan_key");--> statement-breakpoint
CREATE INDEX "treatment_import_row_tenant_outcome_idx" ON "treatment_import_row" USING btree ("tenant_id","outcome");--> statement-breakpoint
CREATE UNIQUE INDEX "treatment_import_row_batch_sheet_number_idx" ON "treatment_import_row" USING btree ("batch_id","sheet_name","source_row_number");--> statement-breakpoint
ALTER TABLE "patient_treatment_plan" ADD CONSTRAINT "patient_treatment_plan_source_import_batch_id_treatment_import_batch_id_fk" FOREIGN KEY ("source_import_batch_id") REFERENCES "public"."treatment_import_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "patient_treatment_plan_tenant_legacy_source_key_idx" ON "patient_treatment_plan" USING btree ("tenant_id","legacy_source_key") WHERE "patient_treatment_plan"."legacy_source_key" is not null;--> statement-breakpoint
CREATE INDEX "patient_treatment_plan_tenant_source_import_batch_idx" ON "patient_treatment_plan" USING btree ("tenant_id","source_import_batch_id");