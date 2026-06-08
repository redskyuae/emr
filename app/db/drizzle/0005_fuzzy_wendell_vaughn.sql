CREATE TABLE "religion" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "religion_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "religion_name_idx" ON "religion" USING btree (lower("name")) WHERE "religion"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "religion_code_idx" ON "religion" USING btree (lower("code")) WHERE "religion"."is_deleted" = false;