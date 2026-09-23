CREATE TABLE "therapist_skill_assignment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "therapist_skill_assignment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" text NOT NULL,
	"therapist_id" integer NOT NULL,
	"therapist_skill_id" integer NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_skill" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "therapist_skill_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20),
	"description" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "therapist" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "therapist_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"qualifications" text,
	"registration_number" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "therapist_id" integer;--> statement-breakpoint
ALTER TABLE "treatment" ADD COLUMN "therapist_skill_id" integer;--> statement-breakpoint
ALTER TABLE "treatment_session" ADD COLUMN "therapist_skill_id" integer;--> statement-breakpoint
ALTER TABLE "therapist_skill_assignment" ADD CONSTRAINT "therapist_skill_assignment_tenant_id_organization_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_skill_assignment" ADD CONSTRAINT "therapist_skill_assignment_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_skill_assignment" ADD CONSTRAINT "therapist_skill_assignment_therapist_skill_id_therapist_skill_id_fk" FOREIGN KEY ("therapist_skill_id") REFERENCES "public"."therapist_skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist" ADD CONSTRAINT "therapist_tenant_id_organization_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist" ADD CONSTRAINT "therapist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "therapist_skill_assignment_tenant_idx" ON "therapist_skill_assignment" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "therapist_skill_assignment_therapist_idx" ON "therapist_skill_assignment" USING btree ("therapist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "therapist_skill_assignment_unique_idx" ON "therapist_skill_assignment" USING btree ("therapist_id","therapist_skill_id","tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "therapist_skill_tenant_name_idx" ON "therapist_skill" USING btree ("tenant_id",lower("name")) WHERE "therapist_skill"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "therapist_skill_tenant_code_idx" ON "therapist_skill" USING btree ("tenant_id",lower("code")) WHERE "therapist_skill"."is_deleted" = false AND "therapist_skill"."code" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "therapist_user_not_deleted_idx" ON "therapist" USING btree ("user_id") WHERE "therapist"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "therapist_tenant_registration_number_idx" ON "therapist" USING btree ("tenant_id",lower("registration_number")) WHERE "therapist"."is_deleted" = false AND "therapist"."registration_number" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment" ADD CONSTRAINT "treatment_therapist_skill_id_therapist_skill_id_fk" FOREIGN KEY ("therapist_skill_id") REFERENCES "public"."therapist_skill"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_session" ADD CONSTRAINT "treatment_session_therapist_skill_id_therapist_skill_id_fk" FOREIGN KEY ("therapist_skill_id") REFERENCES "public"."therapist_skill"("id") ON DELETE no action ON UPDATE no action;