CREATE TABLE "visit_document" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "visit_document_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"visit_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"content_type" varchar(150) NOT NULL,
	"file_size" integer NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "visit_document" ADD CONSTRAINT "visit_document_visit_id_visit_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "visit_document_tenant_visit_idx" ON "visit_document" USING btree ("tenant_id","visit_id");