import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { ayurvedaDiagnosisCode as ayurvedaDiagnosisCodeTable } from './ayurveda-diagnosis-code';
import { diagnosisCode as diagnosisCodeTable } from './diagnosis-code';
import { masterColumns } from './helpers';
import { visit as visitTable } from './visit';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const VISIT_DIAGNOSIS_CODE_SYSTEMS = ['ICD10CM', 'AYURVEDA'] as const;

export const VISIT_DIAGNOSIS_TYPES = ['PRINCIPAL', 'SECONDARY'] as const;

export const visitDiagnosis = pgTable(
  'visit_diagnosis',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    visitId: integer('visit_id')
      .notNull()
      .references(() => visitTable.id),
    codeSystem: varchar('code_system', {
      length: 10,
      enum: VISIT_DIAGNOSIS_CODE_SYSTEMS,
    }).notNull(),
    diagnosisCodeId: integer('diagnosis_code_id').references(() => diagnosisCodeTable.id),
    ayurvedaDiagnosisCodeId: integer('ayurveda_diagnosis_code_id').references(
      () => ayurvedaDiagnosisCodeTable.id
    ),
    diagnosisType: varchar('diagnosis_type', { length: 10, enum: VISIT_DIAGNOSIS_TYPES }).notNull(),
    sortOrder: integer('sort_order').notNull(),
    notes: varchar({ length: 500 }),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    codeSystemCheck: check(
      'visit_diagnosis_code_system_check',
      sql`${table.codeSystem} in ('ICD10CM', 'AYURVEDA')`
    ),
    diagnosisTypeCheck: check(
      'visit_diagnosis_diagnosis_type_check',
      sql`${table.diagnosisType} in ('PRINCIPAL', 'SECONDARY')`
    ),
    codeReferenceCheck: check(
      'visit_diagnosis_code_reference_check',
      sql`(${table.codeSystem} = 'ICD10CM' and ${table.diagnosisCodeId} is not null and ${table.ayurvedaDiagnosisCodeId} is null) or (${table.codeSystem} = 'AYURVEDA' and ${table.ayurvedaDiagnosisCodeId} is not null and ${table.diagnosisCodeId} is null)`
    ),
    tenantVisitIdx: index('visit_diagnosis_tenant_visit_idx').on(table.tenantId, table.visitId),
    tenantVisitPrincipalUniqueIdx: uniqueIndex('visit_diagnosis_tenant_visit_principal_idx')
      .on(table.tenantId, table.visitId, table.codeSystem)
      .where(sql`${table.diagnosisType} = 'PRINCIPAL' and ${table.isDeleted} = false`),
  })
);
