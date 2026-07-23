import { type SQL, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import {
  TIMELINE_FEED_SOURCES,
  type PatientTimelineParams,
  type TimelineEventRow,
  type TimelineSource,
} from '../schemas/patient-timeline-schema';

type Branch = {
  source: TimelineSource;
  sql: SQL;
};

type Scope = {
  tenantId: string;
  patientId: number;
};

// Every branch projects this identical column list, in this order. NULLs carry an
// explicit cast so Postgres can resolve the union's column types, and no branch
// builds a display string — wording lives in the UI (ADR 0041).
//
//   occurred_at, source_type, source_id, event_type, reference,
//   doctor_name, amount, detail, detail_count, parent_id

function appointmentBranches({ tenantId, patientId }: Scope): Branch[] {
  const transitions = [
    { column: sql`a.created_on`, eventType: 'APPOINTMENT_BOOKED', onlyWhenSet: false },
    { column: sql`a.cancelled_at`, eventType: 'APPOINTMENT_CANCELLED', onlyWhenSet: true },
  ];

  return transitions.map(({ column, eventType, onlyWhenSet }) => ({
    source: 'APPOINTMENT' as const,
    sql: sql`
      select
        ${column} as occurred_at,
        'APPOINTMENT' as source_type,
        a.id as source_id,
        ${eventType} as event_type,
        a.booking_number as reference,
        u.name as doctor_name,
        null::numeric as amount,
        a.slot_date::text as detail,
        null::integer as detail_count,
        null::integer as parent_id
      from appointment a
      join doctor d on d.id = a.doctor_id and d.tenant_id = a.tenant_id
      join "user" u on u.id = d.user_id
      where a.tenant_id = ${tenantId}
        and a.patient_id = ${patientId}
        and a.is_deleted = false
        ${onlyWhenSet ? sql`and ${column} is not null` : sql``}
    `,
  }));
}

function visitBranches({ tenantId, patientId }: Scope): Branch[] {
  const transitions = [
    { column: sql`v.checked_in_at`, eventType: 'VISIT_CHECKED_IN' },
    { column: sql`v.consultation_started_at`, eventType: 'VISIT_IN_CONSULTATION' },
    { column: sql`v.completed_at`, eventType: 'VISIT_COMPLETED' },
    { column: sql`v.cancelled_at`, eventType: 'VISIT_CANCELLED' },
  ];

  return transitions.map(({ column, eventType }) => ({
    source: 'VISIT' as const,
    sql: sql`
      select
        ${column} as occurred_at,
        'VISIT' as source_type,
        v.id as source_id,
        ${eventType} as event_type,
        v.visit_number as reference,
        u.name as doctor_name,
        null::numeric as amount,
        null::varchar as detail,
        null::integer as detail_count,
        null::integer as parent_id
      from visit v
      join doctor d on d.id = v.doctor_id and d.tenant_id = v.tenant_id
      join "user" u on u.id = d.user_id
      where v.tenant_id = ${tenantId}
        and v.patient_id = ${patientId}
        and v.is_deleted = false
        and ${column} is not null
    `,
  }));
}

function admissionBranches({ tenantId, patientId }: Scope): Branch[] {
  const transitions = [
    { column: sql`adm.admitted_at`, eventType: 'ADMISSION_ADMITTED' },
    { column: sql`adm.discharged_at`, eventType: 'ADMISSION_DISCHARGED' },
    { column: sql`adm.cancelled_at`, eventType: 'ADMISSION_CANCELLED' },
  ];

  return transitions.map(({ column, eventType }) => ({
    source: 'ADMISSION' as const,
    sql: sql`
      select
        ${column} as occurred_at,
        'ADMISSION' as source_type,
        adm.id as source_id,
        ${eventType} as event_type,
        adm.admission_number as reference,
        u.name as doctor_name,
        null::numeric as amount,
        null::varchar as detail,
        null::integer as detail_count,
        null::integer as parent_id
      from admission adm
      join doctor d on d.id = adm.doctor_id and d.tenant_id = adm.tenant_id
      join "user" u on u.id = d.user_id
      where adm.tenant_id = ${tenantId}
        and adm.patient_id = ${patientId}
        and adm.is_deleted = false
        and ${column} is not null
    `,
  }));
}

function bedTransferBranch({ tenantId, patientId }: Scope): Branch {
  return {
    source: 'BED_TRANSFER',
    sql: sql`
      select
        t.transferred_at as occurred_at,
        'BED_TRANSFER' as source_type,
        t.id as source_id,
        'BED_TRANSFERRED' as event_type,
        adm.admission_number as reference,
        null::text as doctor_name,
        null::numeric as amount,
        b.bed_number as detail,
        null::integer as detail_count,
        adm.id as parent_id
      from admission_bed_transfer t
      join admission adm on adm.id = t.admission_id and adm.tenant_id = t.tenant_id
      join bed b on b.id = t.to_bed_id and b.tenant_id = t.tenant_id
      where t.tenant_id = ${tenantId}
        and adm.patient_id = ${patientId}
        and t.is_deleted = false
        and adm.is_deleted = false
    `,
  };
}

function invoiceBranches({ tenantId, patientId }: Scope): Branch[] {
  const transitions = [
    { column: sql`i.finalized_at`, eventType: 'INVOICE_FINALIZED' },
    { column: sql`i.voided_at`, eventType: 'INVOICE_VOIDED' },
  ];

  return transitions.map(({ column, eventType }) => ({
    source: 'INVOICE' as const,
    sql: sql`
      select
        ${column} as occurred_at,
        'INVOICE' as source_type,
        i.id as source_id,
        ${eventType} as event_type,
        i.invoice_number as reference,
        null::text as doctor_name,
        i.grand_total as amount,
        null::varchar as detail,
        null::integer as detail_count,
        null::integer as parent_id
      from invoice i
      where i.tenant_id = ${tenantId}
        and i.patient_id = ${patientId}
        and i.is_deleted = false
        and ${column} is not null
    `,
  }));
}

// Payment has no patient_id of its own; it reaches the Patient through its Invoice.
function paymentBranch({ tenantId, patientId }: Scope): Branch {
  return {
    source: 'PAYMENT',
    sql: sql`
      select
        p.received_at as occurred_at,
        'PAYMENT' as source_type,
        p.id as source_id,
        'PAYMENT_RECEIVED' as event_type,
        p.receipt_number as reference,
        null::text as doctor_name,
        p.amount as amount,
        p.method as detail,
        null::integer as detail_count,
        i.id as parent_id
      from payment p
      join invoice i on i.id = p.invoice_id and i.tenant_id = p.tenant_id
      where p.tenant_id = ${tenantId}
        and i.patient_id = ${patientId}
        and p.is_deleted = false
        and i.is_deleted = false
    `,
  };
}

// Documents collapse to one event per Visit rather than one per file (ADR 0041),
// so source_id is the Visit. A lone document keeps its filename, because
// "1 document uploaded" reads badly.
function visitDocumentBranch({ tenantId, patientId }: Scope): Branch {
  return {
    source: 'VISIT_DOCUMENT',
    sql: sql`
      select
        max(vd.created_on) as occurred_at,
        'VISIT_DOCUMENT' as source_type,
        v.id as source_id,
        'DOCUMENTS_UPLOADED' as event_type,
        v.visit_number as reference,
        null::text as doctor_name,
        null::numeric as amount,
        (case when count(*) = 1 then min(vd.file_name) else null end)::varchar as detail,
        count(*)::integer as detail_count,
        null::integer as parent_id
      from visit_document vd
      join visit v on v.id = vd.visit_id and v.tenant_id = vd.tenant_id
      where vd.tenant_id = ${tenantId}
        and v.patient_id = ${patientId}
        and vd.is_deleted = false
        and v.is_deleted = false
      group by v.id, v.visit_number
    `,
  };
}

function clinicalNoteBranch({ tenantId, patientId }: Scope): Branch {
  return {
    source: 'CLINICAL_NOTE',
    sql: sql`
      select
        cn.signed_at as occurred_at,
        'CLINICAL_NOTE' as source_type,
        cn.id as source_id,
        'CLINICAL_NOTE_SIGNED' as event_type,
        null::varchar as reference,
        null::text as doctor_name,
        null::numeric as amount,
        cnt.name as detail,
        null::integer as detail_count,
        null::integer as parent_id
      from clinical_note cn
      join clinical_note_type cnt on cnt.id = cn.note_type_id and cnt.tenant_id = cn.tenant_id
      where cn.tenant_id = ${tenantId}
        and cn.patient_id = ${patientId}
        and cn.is_deleted = false
        and cn.signed_at is not null
    `,
  };
}

function patientBranches({ tenantId, patientId }: Scope): Branch[] {
  const transitions = [
    { column: sql`p.created_on`, eventType: 'PATIENT_REGISTERED' },
    { column: sql`p.deactivated_at`, eventType: 'PATIENT_DEACTIVATED' },
    { column: sql`p.reactivated_at`, eventType: 'PATIENT_REACTIVATED' },
  ];

  return transitions.map(({ column, eventType }) => ({
    source: 'PATIENT' as const,
    sql: sql`
      select
        ${column} as occurred_at,
        'PATIENT' as source_type,
        p.id as source_id,
        ${eventType} as event_type,
        null::varchar as reference,
        null::text as doctor_name,
        null::numeric as amount,
        null::varchar as detail,
        null::integer as detail_count,
        null::integer as parent_id
      from patient p
      where p.tenant_id = ${tenantId}
        and p.id = ${patientId}
        and p.is_deleted = false
        and ${column} is not null
    `,
  }));
}

function allBranches(scope: Scope): Branch[] {
  return [
    ...appointmentBranches(scope),
    ...visitBranches(scope),
    ...admissionBranches(scope),
    bedTransferBranch(scope),
    ...invoiceBranches(scope),
    paymentBranch(scope),
    visitDocumentBranch(scope),
    clinicalNoteBranch(scope),
    ...patientBranches(scope),
  ];
}

async function getPatientTimeline({
  feed,
  limit,
  cursor,
  tenantId,
  patientId,
}: PatientTimelineParams): Promise<TimelineEventRow[]> {
  const admittedSources = TIMELINE_FEED_SOURCES[feed];
  // An excluded source is a branch we never emit, so a filtered feed is cheaper
  // to run than the unfiltered one.
  const branches = allBranches({ tenantId, patientId }).filter((branch) =>
    admittedSources.includes(branch.source)
  );

  if (branches.length === 0) {
    return [];
  }

  const unioned = sql.join(
    branches.map((branch) => sql`(${branch.sql})`),
    sql.raw(' union all ')
  );

  // The cursor names a position in the merged ordering, so rows arriving above it
  // cannot shift what the next page returns (ADR 0041). Fetching limit + 1 tells
  // us whether another page exists without a second count query.
  // `event_type` completes the key: two transitions of the same record can share an
  // instant, and without it the pair is one indistinguishable key that the strict
  // `<` predicate would skip past at a page boundary. The tuple must list the same
  // columns, in the same order, as the ORDER BY below.
  //
  // The instant arrives as microsecond-precision text and is cast back here, never
  // round-tripped through a JS Date — a Date holds only milliseconds, so it would
  // round the boundary down and skip every event inside the truncated microsecond.
  const cursorFilter = cursor
    ? sql`where (e.occurred_at, e.source_type, e.source_id, e.event_type) < (${cursor.occurredAt}::timestamptz, ${cursor.sourceType}, ${cursor.sourceId}, ${cursor.eventType})`
    : sql``;

  const statement = sql`
    select
      e.occurred_at as "occurredAt",
      to_char(e.occurred_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as "occurredAtKey",
      e.source_type as "sourceType",
      e.source_id as "sourceId",
      e.event_type as "eventType",
      e.reference as "reference",
      e.doctor_name as "doctorName",
      e.amount as "amount",
      e.detail as "detail",
      e.detail_count as "detailCount",
      e.parent_id as "parentId"
    from (${unioned}) as e
    ${cursorFilter}
    order by e.occurred_at desc, e.source_type desc, e.source_id desc, e.event_type desc
    limit ${limit + 1}
  `;

  const result = await db.execute(statement);

  return result.rows as unknown as TimelineEventRow[];
}

export const patientTimelineRepository = {
  getPatientTimeline,
};
