CREATE TABLE "doctor_schedule" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "doctor_schedule_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"doctor_id" integer NOT NULL,
	"slot_to_date" date NOT NULL,
	"slot_from_date" date NOT NULL,
	"slot_duration_minutes" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "doctor_schedule_rota" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "doctor_schedule_rota_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"doctor_rota_id" integer NOT NULL,
	"doctor_schedule_id" integer NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "doctor_schedule" ADD CONSTRAINT "doctor_schedule_doctor_id_doctor_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_schedule_rota" ADD CONSTRAINT "doctor_schedule_rota_doctor_rota_id_doctor_rota_id_fk" FOREIGN KEY ("doctor_rota_id") REFERENCES "public"."doctor_rota"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_schedule_rota" ADD CONSTRAINT "doctor_schedule_rota_doctor_schedule_id_doctor_schedule_id_fk" FOREIGN KEY ("doctor_schedule_id") REFERENCES "public"."doctor_schedule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_schedule_rota_active_idx" ON "doctor_schedule_rota" USING btree ("doctor_schedule_id","doctor_rota_id") WHERE "doctor_schedule_rota"."is_deleted" = false;