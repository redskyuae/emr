import { sql } from 'drizzle-orm';
import { integer, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { diagnosisCode as diagnosisCodeTable } from './diagnosis-code';
import { masterColumns } from './helpers';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const ayurvedaDiagnosisCode = pgTable(
  'ayurveda_diagnosis_code',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    code: varchar({ length: 20 }).notNull(),
    name: varchar({ length: 255 }).notNull(),
    englishName: varchar('english_name', { length: 255 }),
    category: varchar({ length: 100 }),
    // The ICD-10-CM code claimed for this Roga; Ayurveda codes have no payer code set.
    icdDiagnosisCodeId: integer('icd_diagnosis_code_id').references(() => diagnosisCodeTable.id),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantCodeUniqueIdx: uniqueIndex('ayurveda_diagnosis_code_tenant_code_idx')
      .on(table.tenantId, sql`lower(${table.code})`)
      .where(sql`${table.isDeleted} = false`),
  })
);
