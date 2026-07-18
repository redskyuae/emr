CREATE TABLE "charge_item" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "charge_item_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(20) NOT NULL,
	"category" varchar(20) DEFAULT 'OTHER' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	CONSTRAINT "charge_item_category_check" CHECK ("charge_item"."category" in ('CONSULTATION', 'PROCEDURE', 'INVESTIGATION', 'BED', 'CONSUMABLE', 'OTHER')),
	CONSTRAINT "charge_item_unit_price_check" CHECK ("charge_item"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "charge_item_tenant_name_idx" ON "charge_item" USING btree ("tenant_id",lower("name")) WHERE "charge_item"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "charge_item_tenant_code_idx" ON "charge_item" USING btree ("tenant_id",lower("code")) WHERE "charge_item"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "charge_item_tenant_category_idx" ON "charge_item" USING btree ("tenant_id","category");