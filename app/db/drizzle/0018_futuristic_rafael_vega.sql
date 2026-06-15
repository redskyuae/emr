CREATE TABLE "user_role" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_role_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"role_id" integer NOT NULL,
	"tenant_id" text NOT NULL,
	"assigned_by" text NOT NULL,
	"assigned_on" timestamp with time zone DEFAULT now() NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_tenant_id_organization_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_role_tenant_idx" ON "user_role" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "user_role_user_tenant_idx" ON "user_role" USING btree ("user_id","tenant_id");--> statement-breakpoint
CREATE INDEX "user_role_role_tenant_idx" ON "user_role" USING btree ("role_id","tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_user_id_role_id_tenant_id_idx" ON "user_role" USING btree ("user_id","role_id","tenant_id");--> statement-breakpoint
INSERT INTO "user_role" ("user_id", "role_id", "tenant_id", "assigned_by")
SELECT
	"staff_profile"."user_id",
	"role"."id",
	"staff_profile"."tenant_id",
	"staff_profile"."user_id"
FROM "staff_profile"
INNER JOIN "role"
	ON "role"."tenant_id" = "staff_profile"."tenant_id"
	AND "role"."code" = 'TENANT_ADMIN'
	AND "role"."is_deleted" = false
WHERE "staff_profile"."is_deleted" = false
	AND NOT EXISTS (
		SELECT 1
		FROM "user_role"
		WHERE "user_role"."user_id" = "staff_profile"."user_id"
			AND "user_role"."tenant_id" = "staff_profile"."tenant_id"
	);
