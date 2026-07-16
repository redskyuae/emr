CREATE TABLE "appointment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "appointment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"booking_number" varchar(20) NOT NULL,
	"patient_id" integer NOT NULL,
	"doctor_id" integer NOT NULL,
	"appointment_mode_id" integer NOT NULL,
	"appointment_type_id" integer NOT NULL,
	"appointment_reason_id" integer NOT NULL,
	"appointment_status_id" integer NOT NULL,
	"appointment_cancelled_reason_id" integer,
	"slot_date" date NOT NULL,
	"rota_name" varchar(100) NOT NULL,
	"remarks" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "appointment_booking_number_counter" (
	"tenant_id" varchar(255) PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_slot_reservation" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "appointment_slot_reservation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"appointment_id" integer NOT NULL,
	"doctor_id" integer NOT NULL,
	"doctor_rota_id" integer NOT NULL,
	"slot_date" date NOT NULL,
	"slot_time" varchar(5) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "patient" ALTER COLUMN "gender" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ALTER COLUMN "date_of_birth" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment_status" ADD COLUMN "category" varchar(20);--> statement-breakpoint
ALTER TABLE "appointment_status" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "appointment_status"
SET "category" = CASE
	WHEN upper("code") IN ('SCH', 'SCHEDULED') OR lower("name") = 'scheduled' THEN 'SCHEDULED'
	WHEN upper("code") IN ('CNF', 'CONFIRMED') OR lower("name") = 'confirmed' THEN 'CONFIRMED'
	WHEN upper("code") IN ('CHI', 'CHECKED_IN') OR lower("name") IN ('checked in', 'checked-in') THEN 'CHECKED_IN'
	WHEN upper("code") IN ('CMP', 'COMPLETED') OR lower("name") = 'completed' THEN 'COMPLETED'
	WHEN upper("code") IN ('CAN', 'CANCELLED', 'CANCELED') OR lower("name") IN ('cancelled', 'canceled') THEN 'CANCELLED'
	WHEN upper("code") IN ('NOS', 'NO_SHOW') OR lower("name") IN ('no show', 'no-show') THEN 'NO_SHOW'
	ELSE 'SCHEDULED'
END;--> statement-breakpoint
UPDATE "appointment_status"
SET "is_system" = true
WHERE "category" IN ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW')
AND upper("code") IN ('SCH', 'SCHEDULED', 'CNF', 'CONFIRMED', 'CHI', 'CHECKED_IN', 'CMP', 'COMPLETED', 'CAN', 'CANCELLED', 'CANCELED', 'NOS', 'NO_SHOW');--> statement-breakpoint
ALTER TABLE "appointment_status" ALTER COLUMN "category" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "registration_status" varchar(20) DEFAULT 'registered' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_doctor_id_doctor_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_appointment_mode_id_appointment_mode_id_fk" FOREIGN KEY ("appointment_mode_id") REFERENCES "public"."appointment_mode"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_appointment_type_id_appointment_type_id_fk" FOREIGN KEY ("appointment_type_id") REFERENCES "public"."appointment_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_appointment_reason_id_appointment_reason_id_fk" FOREIGN KEY ("appointment_reason_id") REFERENCES "public"."appointment_reason"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_appointment_status_id_appointment_status_id_fk" FOREIGN KEY ("appointment_status_id") REFERENCES "public"."appointment_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_appointment_cancelled_reason_id_appointment_cancelled_reason_id_fk" FOREIGN KEY ("appointment_cancelled_reason_id") REFERENCES "public"."appointment_cancelled_reason"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_slot_reservation" ADD CONSTRAINT "appointment_slot_reservation_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_slot_reservation" ADD CONSTRAINT "appointment_slot_reservation_doctor_id_doctor_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_slot_reservation" ADD CONSTRAINT "appointment_slot_reservation_doctor_rota_id_doctor_rota_id_fk" FOREIGN KEY ("doctor_rota_id") REFERENCES "public"."doctor_rota"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_tenant_booking_number_idx" ON "appointment" USING btree ("tenant_id",lower("booking_number"));--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_slot_reservation_active_doctor_slot_idx" ON "appointment_slot_reservation" USING btree ("tenant_id","doctor_id","slot_date","slot_time") WHERE "appointment_slot_reservation"."is_deleted" = false;--> statement-breakpoint
ALTER TABLE "appointment_status" ADD CONSTRAINT "appointment_status_category_check" CHECK ("appointment_status"."category" in ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_registration_status_check" CHECK ("patient"."registration_status" in ('provisional', 'registered'));
