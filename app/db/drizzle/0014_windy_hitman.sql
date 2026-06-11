CREATE TABLE "staff_profile" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "staff_profile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"staff_code" varchar(20),
	"designation" varchar(100),
	"gender" varchar(20),
	"date_of_birth" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_tenant_id_organization_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "staff_profile_user_tenant_idx" ON "staff_profile" USING btree ("user_id","tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_profile_user_not_deleted_idx" ON "staff_profile" USING btree ("user_id") WHERE "staff_profile"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "staff_profile_tenant_staff_code_idx" ON "staff_profile" USING btree ("tenant_id",lower("staff_code")) WHERE "staff_profile"."is_deleted" = false and "staff_profile"."staff_code" is not null;