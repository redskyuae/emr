import { sql } from 'drizzle-orm';
import { boolean, date, integer, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { country as countryTable } from './country';
import { masterColumns } from './helpers';
import { language as languageTable } from './language';
import { nationality as nationalityTable } from './nationality';
import { religion as religionTable } from './religion';
import { state as stateTable } from './state';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const patient = pgTable(
  'patient',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    mrn: varchar({ length: 20 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    middleName: varchar('middle_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    gender: varchar({ length: 20 }).notNull(),
    dateOfBirth: date('date_of_birth').notNull(),
    bloodGroup: varchar('blood_group', { length: 5 }),
    maritalStatus: varchar('marital_status', { length: 20 }),
    phone: varchar({ length: 20 }).notNull(),
    alternatePhone: varchar('alternate_phone', { length: 20 }),
    email: varchar({ length: 255 }),
    addressLine1: varchar('address_line1', { length: 255 }),
    addressLine2: varchar('address_line2', { length: 255 }),
    city: varchar({ length: 100 }),
    stateId: integer('state_id').references(() => stateTable.id),
    countryId: integer('country_id').references(() => countryTable.id),
    postalCode: varchar('postal_code', { length: 20 }),
    nationalityId: integer('nationality_id').references(() => nationalityTable.id),
    languageId: integer('language_id').references(() => languageTable.id),
    religionId: integer('religion_id').references(() => religionTable.id),
    govtIdType: varchar('govt_id_type', { length: 30 }),
    govtIdNumber: varchar('govt_id_number', { length: 50 }),
    emergencyContactName: varchar('emergency_contact_name', { length: 150 }),
    emergencyContactRelationship: varchar('emergency_contact_relationship', { length: 50 }),
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
    isActive: boolean('is_active').notNull().default(true),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantMrnUniqueIdx: uniqueIndex('patient_tenant_mrn_idx').on(
      table.tenantId,
      sql`lower(${table.mrn})`
    ),
    tenantGovtIdUniqueIdx: uniqueIndex('patient_tenant_govt_id_idx')
      .on(table.tenantId, table.govtIdType, sql`lower(${table.govtIdNumber})`)
      .where(sql`${table.isDeleted} = false and ${table.govtIdNumber} is not null`),
  })
);

export const patientMrnCounter = pgTable('patient_mrn_counter', {
  tenantId: varchar('tenant_id', { length: 255 }).primaryKey(),
  lastNumber: integer('last_number').notNull(),
});
