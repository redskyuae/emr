CREATE TABLE "invoice_line" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoice_line_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"invoice_id" integer NOT NULL,
	"charge_item_id" integer,
	"description" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"source" varchar(10) DEFAULT 'MANUAL' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	CONSTRAINT "invoice_line_quantity_check" CHECK ("invoice_line"."quantity" >= 1),
	CONSTRAINT "invoice_line_unit_price_check" CHECK ("invoice_line"."unit_price" >= 0),
	CONSTRAINT "invoice_line_source_check" CHECK ("invoice_line"."source" in ('MANUAL', 'BED_AUTO'))
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoice_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"invoice_number" varchar(20) NOT NULL,
	"patient_id" integer NOT NULL,
	"visit_id" integer,
	"admission_id" integer,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT 0 NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"grand_total" numeric(12, 2) DEFAULT 0 NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT 0 NOT NULL,
	"notes" text,
	"finalized_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"void_reason" varchar(255),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	CONSTRAINT "invoice_status_check" CHECK ("invoice"."status" in ('DRAFT', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'VOID')),
	CONSTRAINT "invoice_single_parent_check" CHECK (not ("invoice"."visit_id" is not null and "invoice"."admission_id" is not null)),
	CONSTRAINT "invoice_discount_check" CHECK ("invoice"."discount_amount" >= 0 and "invoice"."discount_amount" <= "invoice"."subtotal"),
	CONSTRAINT "invoice_amount_paid_check" CHECK ("invoice"."amount_paid" >= 0 and "invoice"."amount_paid" <= "invoice"."grand_total")
);
--> statement-breakpoint
CREATE TABLE "invoice_number_counter" (
	"tenant_id" varchar(255) PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt_number_counter" (
	"tenant_id" varchar(255) PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"receipt_number" varchar(20) NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" varchar(20) NOT NULL,
	"reference" varchar(100),
	"notes" varchar(255),
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"modified_on" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_on" timestamp with time zone,
	CONSTRAINT "payment_amount_check" CHECK ("payment"."amount" > 0),
	CONSTRAINT "payment_method_check" CHECK ("payment"."method" in ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'))
);
--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line" ADD CONSTRAINT "invoice_line_charge_item_id_charge_item_id_fk" FOREIGN KEY ("charge_item_id") REFERENCES "public"."charge_item"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_visit_id_visit_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_admission_id_admission_id_fk" FOREIGN KEY ("admission_id") REFERENCES "public"."admission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoice_line_tenant_invoice_idx" ON "invoice_line" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_tenant_number_idx" ON "invoice" USING btree ("tenant_id",lower("invoice_number"));--> statement-breakpoint
CREATE INDEX "invoice_tenant_status_idx" ON "invoice" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "invoice_tenant_patient_idx" ON "invoice" USING btree ("tenant_id","patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_tenant_receipt_idx" ON "payment" USING btree ("tenant_id",lower("receipt_number"));--> statement-breakpoint
CREATE INDEX "payment_tenant_invoice_idx" ON "payment" USING btree ("tenant_id","invoice_id");