CREATE TABLE "asset_category" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "asset_category_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"color" varchar(7) NOT NULL,
	"description" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "asset_category_tenant_name_idx" ON "asset_category" USING btree ("tenant_id",lower("name")) WHERE "asset_category"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "asset_category_tenant_code_idx" ON "asset_category" USING btree ("tenant_id",lower("code")) WHERE "asset_category"."is_deleted" = false;