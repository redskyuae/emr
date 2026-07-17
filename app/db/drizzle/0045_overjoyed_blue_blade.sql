CREATE TABLE "admission_bed_transfer" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admission_bed_transfer_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"admission_id" integer NOT NULL,
	"from_bed_id" integer NOT NULL,
	"to_bed_id" integer NOT NULL,
	"reason" varchar(255),
	"transferred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "admission_type" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admission_type_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"description" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "admission" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admission_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"admission_number" varchar(20) NOT NULL,
	"patient_id" integer NOT NULL,
	"doctor_id" integer NOT NULL,
	"admission_type_id" integer NOT NULL,
	"bed_id" integer NOT NULL,
	"visit_id" integer,
	"status" varchar(20) DEFAULT 'ADMITTED' NOT NULL,
	"admission_reason" varchar(500),
	"remarks" text,
	"expected_discharge_date" date,
	"admitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"discharged_at" timestamp with time zone,
	"discharge_disposition" varchar(20),
	"discharge_summary" text,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" varchar(255),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	CONSTRAINT "admission_status_check" CHECK ("admission"."status" in ('ADMITTED', 'DISCHARGED', 'CANCELLED')),
	CONSTRAINT "admission_discharge_disposition_check" CHECK ("admission"."discharge_disposition" is null or "admission"."discharge_disposition" in ('ROUTINE', 'LAMA', 'TRANSFERRED', 'DECEASED', 'ABSCONDED'))
);
--> statement-breakpoint
CREATE TABLE "admission_number_counter" (
	"tenant_id" varchar(255) PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bed" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bed_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"bed_number" varchar(20) NOT NULL,
	"ward_id" integer NOT NULL,
	"room_id" integer,
	"status" varchar(20) DEFAULT 'AVAILABLE' NOT NULL,
	"notes" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	CONSTRAINT "bed_status_check" CHECK ("bed"."status" in ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'))
);
--> statement-breakpoint
CREATE TABLE "ward" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ward_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"description" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "clinical_note" ADD COLUMN "admission_id" integer;--> statement-breakpoint
ALTER TABLE "patient_vital_sign" ADD COLUMN "admission_id" integer;--> statement-breakpoint
ALTER TABLE "admission_bed_transfer" ADD CONSTRAINT "admission_bed_transfer_admission_id_admission_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_bed_transfer" ADD CONSTRAINT "admission_bed_transfer_from_bed_id_bed_id_fk" FOREIGN KEY ("from_bed_id") REFERENCES "public"."bed"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_bed_transfer" ADD CONSTRAINT "admission_bed_transfer_to_bed_id_bed_id_fk" FOREIGN KEY ("to_bed_id") REFERENCES "public"."bed"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission" ADD CONSTRAINT "admission_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission" ADD CONSTRAINT "admission_doctor_id_doctor_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission" ADD CONSTRAINT "admission_admission_type_id_admission_type_id_fk" FOREIGN KEY ("admission_type_id") REFERENCES "public"."admission_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission" ADD CONSTRAINT "admission_bed_id_bed_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."bed"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission" ADD CONSTRAINT "admission_visit_id_visit_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed" ADD CONSTRAINT "bed_ward_id_ward_id_fk" FOREIGN KEY ("ward_id") REFERENCES "public"."ward"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed" ADD CONSTRAINT "bed_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admission_bed_transfer_tenant_admission_idx" ON "admission_bed_transfer" USING btree ("tenant_id","admission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admission_type_tenant_name_idx" ON "admission_type" USING btree ("tenant_id",lower("name")) WHERE "admission_type"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "admission_type_tenant_code_idx" ON "admission_type" USING btree ("tenant_id",lower("code")) WHERE "admission_type"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "admission_tenant_number_idx" ON "admission" USING btree ("tenant_id",lower("admission_number"));--> statement-breakpoint
CREATE UNIQUE INDEX "admission_active_patient_idx" ON "admission" USING btree ("tenant_id","patient_id") WHERE "admission"."is_deleted" = false and "admission"."status" = 'ADMITTED';--> statement-breakpoint
CREATE UNIQUE INDEX "admission_active_bed_idx" ON "admission" USING btree ("tenant_id","bed_id") WHERE "admission"."is_deleted" = false and "admission"."status" = 'ADMITTED';--> statement-breakpoint
CREATE INDEX "admission_tenant_status_idx" ON "admission" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "bed_ward_bed_number_idx" ON "bed" USING btree ("tenant_id","ward_id",lower("bed_number")) WHERE "bed"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "bed_tenant_status_idx" ON "bed" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "bed_tenant_ward_idx" ON "bed" USING btree ("tenant_id","ward_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ward_tenant_name_idx" ON "ward" USING btree ("tenant_id",lower("name")) WHERE "ward"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "ward_tenant_code_idx" ON "ward" USING btree ("tenant_id",lower("code")) WHERE "ward"."is_deleted" = false;--> statement-breakpoint
ALTER TABLE "clinical_note" ADD CONSTRAINT "clinical_note_admission_id_admission_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_vital_sign" ADD CONSTRAINT "patient_vital_sign_admission_id_admission_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_note" ADD CONSTRAINT "clinical_note_single_parent_check" CHECK (not ("clinical_note"."visit_id" is not null and "clinical_note"."admission_id" is not null));--> statement-breakpoint
ALTER TABLE "patient_vital_sign" ADD CONSTRAINT "patient_vital_sign_single_parent_check" CHECK (not ("patient_vital_sign"."visit_id" is not null and "patient_vital_sign"."admission_id" is not null));