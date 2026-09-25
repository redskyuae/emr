CREATE TABLE "therapist_schedule" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "therapist_schedule_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"therapist_id" integer NOT NULL,
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
CREATE TABLE "therapist_schedule_rota" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "therapist_schedule_rota_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"doctor_rota_id" integer NOT NULL,
	"therapist_schedule_id" integer NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "therapist_schedule" ADD CONSTRAINT "therapist_schedule_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_schedule_rota" ADD CONSTRAINT "therapist_schedule_rota_doctor_rota_id_doctor_rota_id_fk" FOREIGN KEY ("doctor_rota_id") REFERENCES "public"."doctor_rota"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_schedule_rota" ADD CONSTRAINT "therapist_schedule_rota_therapist_schedule_id_therapist_schedule_id_fk" FOREIGN KEY ("therapist_schedule_id") REFERENCES "public"."therapist_schedule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "therapist_schedule_rota_active_idx" ON "therapist_schedule_rota" USING btree ("therapist_schedule_id","doctor_rota_id") WHERE "therapist_schedule_rota"."is_deleted" = false;
--> statement-breakpoint
-- therapist-schedule-permissions
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('therapist-scheduling', 'therapist-schedule', 'read', 'therapist-schedule:read', 'View Therapist Schedules.'),
  ('therapist-scheduling', 'therapist-schedule', 'create', 'therapist-schedule:create', 'Create Therapist Schedules.'),
  ('therapist-scheduling', 'therapist-schedule', 'update', 'therapist-schedule:update', 'Update Therapist Schedule details.')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permission" ("tenant_id", "role_id", "permission_id")
SELECT "role"."tenant_id", "role"."id", "permission"."id"
FROM "role"
CROSS JOIN "permission"
WHERE "role"."code" = 'TENANT_ADMIN'
  AND "role"."is_system" = true
  AND "role"."is_deleted" = false
  AND "permission"."is_active" = true
  AND "permission"."name" IN (
    'therapist-schedule:read',
    'therapist-schedule:create',
    'therapist-schedule:update'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
