CREATE TABLE "visit_status" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "visit_status_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"category" varchar(20) NOT NULL,
	"color" varchar(7) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	CONSTRAINT "visit_status_category_check" CHECK ("visit_status"."category" in ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);
--> statement-breakpoint
CREATE TABLE "visit" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "visit_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"visit_number" varchar(20) NOT NULL,
	"patient_id" integer NOT NULL,
	"doctor_id" integer,
	"appointment_type_id" integer NOT NULL,
	"appointment_reason_id" integer,
	"status_id" integer NOT NULL,
	"chief_complaint" text,
	"notes" text,
	"cancelled_reason" text,
	"started_on" timestamp with time zone,
	"completed_on" timestamp with time zone,
	"cancelled_on" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "visit_number_counter" (
	"tenant_id" varchar(255) PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_doctor_id_doctor_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_appointment_type_id_appointment_type_id_fk" FOREIGN KEY ("appointment_type_id") REFERENCES "public"."appointment_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_appointment_reason_id_appointment_reason_id_fk" FOREIGN KEY ("appointment_reason_id") REFERENCES "public"."appointment_reason"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_status_id_visit_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."visit_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "visit_status_tenant_name_idx" ON "visit_status" USING btree ("tenant_id",lower("name")) WHERE "visit_status"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "visit_status_tenant_code_idx" ON "visit_status" USING btree ("tenant_id",lower("code")) WHERE "visit_status"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "visit_tenant_visit_number_idx" ON "visit" USING btree ("tenant_id",lower("visit_number"));