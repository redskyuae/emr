import { sql } from 'drizzle-orm';
import { check, date, index, integer, pgTable, varchar } from 'drizzle-orm/pg-core';

import { country as countryTable } from './country';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

// Government-issued documents evidencing a Patient's identity. A Patient may
// hold several, including several of the same type — a dual national holds two
// valid passports. The Emirates ID is deliberately NOT a documentType here; it
// lives in its own column on patient so it has exactly one home (ADR 0042).
//
// There is no unique index. Passport numbers are unique only within their
// issuing country, so India and Brazil can both issue J8369854; a uniqueness
// constraint would reject the second patient as a duplicate.
export const patientIdentityDocument = pgTable(
  'patient_identity_document',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patientTable.id),
    documentType: varchar('document_type', {
      length: 30,
      enum: ['passport', 'national-id', 'residence-visa', 'driving-license', 'other'],
    }).notNull(),
    documentNumber: varchar('document_number', { length: 50 }).notNull(),
    issuingCountryId: integer('issuing_country_id').references(() => countryTable.id),
    expiryDate: date('expiry_date'),
    label: varchar({ length: 100 }),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    documentTypeCheck: check(
      'patient_identity_document_type_check',
      sql`${table.documentType} in ('passport', 'national-id', 'residence-visa', 'driving-license', 'other')`
    ),
    tenantPatientIdx: index('patient_identity_document_tenant_patient_idx').on(
      table.tenantId,
      table.patientId
    ),
  })
);
