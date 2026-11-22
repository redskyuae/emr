CREATE TABLE "audit_event" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tenant_id" varchar(255) NOT NULL,
	"occurred_on" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" varchar(255),
	"actor_name" varchar(255) NOT NULL,
	"actor_email" varchar(320),
	"action" varchar(100) NOT NULL,
	"category" varchar(20) NOT NULL,
	"outcome" varchar(20) DEFAULT 'success' NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(100),
	"entity_label" varchar(255),
	"patient_id" integer,
	"visit_id" integer,
	"reason" text,
	"changes" jsonb,
	"metadata" jsonb,
	"ip_address" varchar(64),
	"user_agent" text
);
--> statement-breakpoint
CREATE INDEX "audit_event_tenant_occurred_idx" ON "audit_event" USING btree ("tenant_id","occurred_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_event_tenant_patient_idx" ON "audit_event" USING btree ("tenant_id","patient_id","occurred_on" DESC NULLS LAST) WHERE "audit_event"."patient_id" is not null;--> statement-breakpoint
CREATE INDEX "audit_event_tenant_visit_idx" ON "audit_event" USING btree ("tenant_id","visit_id","occurred_on" DESC NULLS LAST) WHERE "audit_event"."visit_id" is not null;--> statement-breakpoint
CREATE INDEX "audit_event_tenant_actor_idx" ON "audit_event" USING btree ("tenant_id","actor_user_id","occurred_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_event_tenant_entity_idx" ON "audit_event" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
-- Audit Events are append-only (ADR 0052): no role used by the application may
-- rewrite or remove one. TRUNCATE is a separate statement-level event and is not
-- blocked, so the integration-test reset keeps working.
CREATE OR REPLACE FUNCTION "audit_event_reject_change"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Audit Events are append-only; % is not allowed', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "audit_event_append_only"
  BEFORE UPDATE OR DELETE ON "audit_event"
  FOR EACH ROW EXECUTE FUNCTION "audit_event_reject_change"();
--> statement-breakpoint
-- Backfill the Audit Log permissions for already-onboarded Tenants. New onboardings
-- receive them through the Permission Catalogue seed path.
INSERT INTO "permission" ("module", "resource", "action", "name", "description")
VALUES
  ('audit', 'audit-log', 'read', 'audit-log:read', 'View the Audit Log.'),
  ('audit', 'audit-log', 'export', 'audit-log:export', 'Export the Audit Log.')
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
  AND "permission"."name" IN ('audit-log:read', 'audit-log:export')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
