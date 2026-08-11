import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

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
    title: varchar({ length: 20 }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    middleName: varchar('middle_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    gender: varchar({ length: 20 }),
    dateOfBirth: date('date_of_birth'),
    registrationStatus: varchar('registration_status', {
      length: 20,
      enum: ['provisional', 'registered'],
    })
      .notNull()
      .default('registered'),
    bloodGroup: varchar('blood_group', { length: 5 }),
    maritalStatus: varchar('marital_status', { length: 20 }),
    preferredPaymentMethod: varchar('preferred_payment_method', { length: 20 }),
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
    race: varchar({ length: 20 }),
    ethnicGroup: varchar('ethnic_group', { length: 30 }),
    // Stored digit-normalised (784199012345671), never in the dashed form the
    // card is printed with — three spellings of one ID would otherwise insert
    // as three patients past the unique index below (ADR 0042).
    emiratesId: varchar('emirates_id', { length: 15 }),
    photoUrl: text('photo_url'),
    patientIdentificationCategory: varchar('patient_identification_category', { length: 60 }),
    passportNumber: varchar('passport_number', { length: 50 }),
    uid: varchar({ length: 30 }),
    isVip: boolean('is_vip').notNull().default(false),
    smsConsent: boolean('sms_consent').notNull().default(false),
    isMedicalTourist: boolean('is_medical_tourist').notNull().default(false),
    emergencyContactName: varchar('emergency_contact_name', { length: 150 }),
    emergencyContactRelationship: varchar('emergency_contact_relationship', { length: 50 }),
    emergencyContactGender: varchar('emergency_contact_gender', { length: 20 }),
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
    isActive: boolean('is_active').notNull().default(true),
    // Deactivation/reactivation instants for the Patient Timeline. isActive
    // alone records only the current state; modifiedOn is clobbered by any
    // unrelated edit, so it is not a usable proxy (ADR 0041).
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    reactivatedAt: timestamp('reactivated_at', { withTimezone: true }),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    registrationStatusCheck: check(
      'patient_registration_status_check',
      sql`${table.registrationStatus} in ('provisional', 'registered')`
    ),
    tenantMrnUniqueIdx: uniqueIndex('patient_tenant_mrn_idx').on(
      table.tenantId,
      sql`lower(${table.mrn})`
    ),
    // An Emirates ID is issued once per person and persists for life, so two
    // active Patients sharing one is never legitimate. Identity Documents get
    // no equivalent index on purpose — passport numbers are unique only within
    // their issuing country (ADR 0042). Partial on isDeleted so a soft-deleted
    // Patient does not permanently burn the number (lessons.md).
    tenantEmiratesIdUniqueIdx: uniqueIndex('patient_tenant_emirates_id_idx')
      .on(table.tenantId, table.emiratesId)
      .where(sql`${table.isDeleted} = false and ${table.emiratesId} is not null`),
  })
);

export const patientMrnCounter = pgTable('patient_mrn_counter', {
  tenantId: varchar('tenant_id', { length: 255 }).primaryKey(),
  lastNumber: integer('last_number').notNull(),
});
