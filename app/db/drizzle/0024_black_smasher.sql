CREATE TABLE "asset" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "asset_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(150) NOT NULL,
	"category_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"condition_id" integer,
	"manufacturer" varchar(150),
	"model" varchar(150),
	"serial_number" varchar(100) NOT NULL,
	"facility" varchar(150),
	"department" varchar(150),
	"location" varchar(200),
	"custodian" varchar(150),
	"purchase_date" date,
	"warranty_expiry" date,
	"cost" numeric(14, 2),
	"current_value" numeric(14, 2),
	"last_service_date" date,
	"next_service_date" date,
	"calibration_date" date,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_category_id_asset_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."asset_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_status_id_asset_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."asset_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_condition_id_asset_condition_id_fk" FOREIGN KEY ("condition_id") REFERENCES "public"."asset_condition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "asset_tenant_serial_idx" ON "asset" USING btree ("tenant_id",lower("serial_number")) WHERE "asset"."is_deleted" = false;