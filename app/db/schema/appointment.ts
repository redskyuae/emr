import { sql } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { appointmentCancelledReason as appointmentCancelledReasonTable } from './appointment-cancelled-reason';
import { appointmentMode as appointmentModeTable } from './appointment-mode';
import { appointmentReason as appointmentReasonTable } from './appointment-reason';
import { appointmentStatus as appointmentStatusTable } from './appointment-status';
import { appointmentType as appointmentTypeTable } from './appointment-type';
import { doctor as doctorTable } from './doctor';
import { doctorRota as doctorRotaTable } from './doctor-rota';
import { masterColumns } from './helpers';
import { patient as patientTable } from './patient';

const { id, isDeleted, createdOn, modifiedOn, deletedOn } = masterColumns();

export const appointment = pgTable(
  'appointment',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    bookingNumber: varchar('booking_number', { length: 20 }).notNull(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patientTable.id),
    doctorId: integer('doctor_id')
      .notNull()
      .references(() => doctorTable.id),
    appointmentModeId: integer('appointment_mode_id')
      .notNull()
      .references(() => appointmentModeTable.id),
    appointmentTypeId: integer('appointment_type_id')
      .notNull()
      .references(() => appointmentTypeTable.id),
    appointmentReasonId: integer('appointment_reason_id')
      .notNull()
      .references(() => appointmentReasonTable.id),
    appointmentStatusId: integer('appointment_status_id')
      .notNull()
      .references(() => appointmentStatusTable.id),
    appointmentCancelledReasonId: integer('appointment_cancelled_reason_id').references(
      () => appointmentCancelledReasonTable.id
    ),
    slotDate: date('slot_date').notNull(),
    rotaName: varchar('rota_name', { length: 100 }).notNull(),
    remarks: text(),
    // Set when the Appointment moves to a cancelled AppointmentStatus. Rows
    // predating the Patient Timeline hold null and yield no cancelled event
    // rather than a wrong one derived from modifiedOn (ADR 0041).
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    tenantBookingNumberUniqueIdx: uniqueIndex('appointment_tenant_booking_number_idx').on(
      table.tenantId,
      sql`lower(${table.bookingNumber})`
    ),
    tenantPatientIdx: index('appointment_tenant_patient_idx').on(table.tenantId, table.patientId),
  })
);

export const appointmentSlotReservation = pgTable(
  'appointment_slot_reservation',
  {
    id,
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    appointmentId: integer('appointment_id')
      .notNull()
      .references(() => appointment.id),
    doctorId: integer('doctor_id')
      .notNull()
      .references(() => doctorTable.id),
    doctorRotaId: integer('doctor_rota_id')
      .notNull()
      .references(() => doctorRotaTable.id),
    slotDate: date('slot_date').notNull(),
    slotTime: varchar('slot_time', { length: 5 }).notNull(),
    isDeleted,
    createdOn,
    modifiedOn,
    deletedOn,
  },
  (table) => ({
    activeDoctorSlotUniqueIdx: uniqueIndex('appointment_slot_reservation_active_doctor_slot_idx')
      .on(table.tenantId, table.doctorId, table.slotDate, table.slotTime)
      .where(sql`${table.isDeleted} = false`),
  })
);

export const appointmentBookingNumberCounter = pgTable('appointment_booking_number_counter', {
  tenantId: varchar('tenant_id', { length: 255 }).primaryKey(),
  lastNumber: integer('last_number').notNull(),
});
