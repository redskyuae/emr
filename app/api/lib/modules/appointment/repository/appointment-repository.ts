import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import {
  appointment as appointmentTable,
  appointmentBookingNumberCounter as appointmentBookingNumberCounterTable,
  appointmentSlotReservation as appointmentSlotReservationTable,
} from '@/app/db/schema/appointment';
import { appointmentMode as appointmentModeTable } from '@/app/db/schema/appointment-mode';
import { appointmentReason as appointmentReasonTable } from '@/app/db/schema/appointment-reason';
import { appointmentStatus as appointmentStatusTable } from '@/app/db/schema/appointment-status';
import { appointmentType as appointmentTypeTable } from '@/app/db/schema/appointment-type';
import { user as userTable } from '@/app/db/schema/auth';
import { doctor as doctorTable } from '@/app/db/schema/doctor';
import { doctorRota as doctorRotaTable } from '@/app/db/schema/doctor-rota';
import {
  doctorSchedule as doctorScheduleTable,
  doctorScheduleRota as doctorScheduleRotaTable,
} from '@/app/db/schema/doctor-schedule';
import {
  patient as patientTable,
  patientMrnCounter as patientMrnCounterTable,
} from '@/app/db/schema/patient';
import { formatPatientMrn } from '../../patient/repository/patient-mrn';
import { formatAppointmentBookingNumber } from './appointment-booking-number';
import type {
  Appointment,
  PotentialPatientMatch,
  ValidatedCreateAppointmentData,
} from '../schemas/appointment-schema';
import { formatAppointmentDate } from '../schemas/appointment-schema';
import { isFutureSlotSelection, isValidSlotSelection } from '../schemas/appointment-slot';

type SelectExecutor = Pick<typeof db, 'select'>;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type AppointmentSlotBookingContext = {
  rotaName: string;
  doctorName: string;
  toTime: string;
  fromTime: string;
  durationMinutes: number;
};

const appointmentColumns = {
  id: appointmentTable.id,
  remarks: appointmentTable.remarks,
  rotaName: appointmentTable.rotaName,
  tenantId: appointmentTable.tenantId,
  slotDate: appointmentTable.slotDate,
  bookingNumber: appointmentTable.bookingNumber,
  createdOn: appointmentTable.createdOn,
  doctor: {
    id: doctorTable.id,
    name: userTable.name,
  },
  patient: {
    id: patientTable.id,
    mrn: patientTable.mrn,
    phone: patientTable.phone,
    lastName: patientTable.lastName,
    firstName: patientTable.firstName,
    registrationStatus: patientTable.registrationStatus,
  },
  appointmentMode: {
    id: appointmentModeTable.id,
    name: appointmentModeTable.name,
    code: appointmentModeTable.code,
  },
  appointmentType: {
    id: appointmentTypeTable.id,
    name: appointmentTypeTable.name,
    code: appointmentTypeTable.code,
  },
  appointmentReason: {
    id: appointmentReasonTable.id,
    name: appointmentReasonTable.name,
    code: appointmentReasonTable.code,
  },
  appointmentStatus: {
    id: appointmentStatusTable.id,
    name: appointmentStatusTable.name,
    code: appointmentStatusTable.code,
    category: appointmentStatusTable.category,
  },
};

function appointmentJoins(executor: SelectExecutor = db) {
  return executor
    .select(appointmentColumns)
    .from(appointmentTable)
    .innerJoin(
      patientTable,
      and(
        eq(patientTable.id, appointmentTable.patientId),
        eq(patientTable.tenantId, appointmentTable.tenantId),
        eq(patientTable.isDeleted, false)
      )
    )
    .innerJoin(
      doctorTable,
      and(
        eq(doctorTable.id, appointmentTable.doctorId),
        eq(doctorTable.tenantId, appointmentTable.tenantId),
        eq(doctorTable.isDeleted, false)
      )
    )
    .innerJoin(userTable, eq(userTable.id, doctorTable.userId))
    .innerJoin(
      appointmentModeTable,
      and(
        eq(appointmentModeTable.id, appointmentTable.appointmentModeId),
        eq(appointmentModeTable.tenantId, appointmentTable.tenantId)
      )
    )
    .innerJoin(
      appointmentTypeTable,
      and(
        eq(appointmentTypeTable.id, appointmentTable.appointmentTypeId),
        eq(appointmentTypeTable.tenantId, appointmentTable.tenantId)
      )
    )
    .innerJoin(
      appointmentReasonTable,
      and(
        eq(appointmentReasonTable.id, appointmentTable.appointmentReasonId),
        eq(appointmentReasonTable.tenantId, appointmentTable.tenantId)
      )
    )
    .innerJoin(
      appointmentStatusTable,
      and(
        eq(appointmentStatusTable.id, appointmentTable.appointmentStatusId),
        eq(appointmentStatusTable.tenantId, appointmentTable.tenantId)
      )
    );
}

async function getAppointmentById(
  id: number,
  tenantId: string,
  executor: SelectExecutor = db
): Promise<Appointment | undefined> {
  const [row] = await appointmentJoins(executor)
    .where(
      and(
        eq(appointmentTable.id, id),
        eq(appointmentTable.tenantId, tenantId),
        eq(appointmentTable.isDeleted, false)
      )
    )
    .limit(1);

  if (!row) {
    return undefined;
  }

  const slots = await executor
    .select({ slotTime: appointmentSlotReservationTable.slotTime })
    .from(appointmentSlotReservationTable)
    .where(
      and(
        eq(appointmentSlotReservationTable.appointmentId, id),
        eq(appointmentSlotReservationTable.tenantId, tenantId),
        eq(appointmentSlotReservationTable.isDeleted, false)
      )
    )
    .orderBy(appointmentSlotReservationTable.slotTime);

  return {
    ...row,
    slotDate: formatAppointmentDate(row.slotDate),
    appointmentStatus: {
      ...row.appointmentStatus,
      category:
        row.appointmentStatus.category.toLowerCase() as Appointment['appointmentStatus']['category'],
    },
    slots: slots.map((slot) => ({ ...slot, status: 'Booked' as const })),
  };
}

async function getAppointmentByBookingNumber(
  bookingNumber: string,
  tenantId: string,
  executor: SelectExecutor = db
): Promise<Appointment | undefined> {
  const [row] = await appointmentJoins(executor)
    .where(
      and(
        sql`lower(${appointmentTable.bookingNumber}) = ${bookingNumber.trim().toLowerCase()}`,
        eq(appointmentTable.tenantId, tenantId),
        eq(appointmentTable.isDeleted, false)
      )
    )
    .limit(1);

  if (!row) {
    return undefined;
  }

  return getAppointmentById(row.id, tenantId, executor);
}

async function getSlotBookingContext(
  tenantId: string,
  doctorId: number,
  doctorRotaId: number,
  slotDate: string,
  executor: SelectExecutor = db,
  lock = false
): Promise<AppointmentSlotBookingContext | undefined> {
  const query = executor
    .select({
      rotaName: doctorRotaTable.name,
      doctorName: userTable.name,
      toTime: doctorRotaTable.toTime,
      fromTime: doctorRotaTable.fromTime,
      durationMinutes: doctorScheduleTable.slotDurationMinutes,
    })
    .from(doctorScheduleTable)
    .innerJoin(
      doctorScheduleRotaTable,
      and(
        eq(doctorScheduleRotaTable.doctorScheduleId, doctorScheduleTable.id),
        eq(doctorScheduleRotaTable.tenantId, tenantId),
        eq(doctorScheduleRotaTable.isDeleted, false)
      )
    )
    .innerJoin(
      doctorRotaTable,
      and(
        eq(doctorRotaTable.id, doctorScheduleRotaTable.doctorRotaId),
        eq(doctorRotaTable.tenantId, tenantId),
        eq(doctorRotaTable.isActive, true),
        eq(doctorRotaTable.isDeleted, false)
      )
    )
    .innerJoin(
      doctorTable,
      and(
        eq(doctorTable.id, doctorScheduleTable.doctorId),
        eq(doctorTable.tenantId, tenantId),
        eq(doctorTable.isActive, true),
        eq(doctorTable.isDeleted, false)
      )
    )
    .innerJoin(userTable, eq(userTable.id, doctorTable.userId))
    .where(
      and(
        eq(doctorScheduleTable.tenantId, tenantId),
        eq(doctorScheduleTable.doctorId, doctorId),
        eq(doctorScheduleRotaTable.doctorRotaId, doctorRotaId),
        eq(doctorScheduleTable.isActive, true),
        eq(doctorScheduleTable.isDeleted, false),
        lte(doctorScheduleTable.slotFromDate, slotDate),
        gte(doctorScheduleTable.slotToDate, slotDate)
      )
    )
    .limit(1);

  const rows = lock && 'for' in query ? await query.for('update') : await query;
  return rows[0];
}

async function findPotentialPatientMatches(
  tenantId: string,
  firstName: string,
  lastName: string,
  phone: string,
  executor: SelectExecutor = db
): Promise<PotentialPatientMatch[]> {
  return executor
    .select({
      id: patientTable.id,
      mrn: patientTable.mrn,
      phone: patientTable.phone,
      isActive: patientTable.isActive,
      lastName: patientTable.lastName,
      firstName: patientTable.firstName,
      registrationStatus: patientTable.registrationStatus,
    })
    .from(patientTable)
    .where(
      and(
        eq(patientTable.tenantId, tenantId),
        eq(patientTable.isDeleted, false),
        sql`lower(trim(${patientTable.firstName})) = ${firstName.trim().toLowerCase()}`,
        sql`lower(trim(${patientTable.lastName})) = ${lastName.trim().toLowerCase()}`,
        sql`trim(${patientTable.phone}) = ${phone.trim()}`
      )
    );
}

async function getReservedSlotTimes(
  tenantId: string,
  doctorId: number,
  slotDate: string,
  slotTimes?: string[],
  executor: SelectExecutor = db
) {
  if (slotTimes?.length === 0) {
    return [];
  }

  return executor
    .select({ slotTime: appointmentSlotReservationTable.slotTime })
    .from(appointmentSlotReservationTable)
    .where(
      and(
        eq(appointmentSlotReservationTable.tenantId, tenantId),
        eq(appointmentSlotReservationTable.doctorId, doctorId),
        eq(appointmentSlotReservationTable.slotDate, slotDate),
        eq(appointmentSlotReservationTable.isDeleted, false),
        slotTimes ? inArray(appointmentSlotReservationTable.slotTime, slotTimes) : undefined
      )
    );
}

async function createProvisionalPatient(tx: Transaction, data: ValidatedCreateAppointmentData) {
  const provisionalPatient = data.provisionalPatient;

  if (!provisionalPatient) {
    throw new Error('Provisional Patient details are required');
  }

  const [counter] = await tx
    .insert(patientMrnCounterTable)
    .values({ tenantId: data.tenantId, lastNumber: 1001 })
    .onConflictDoUpdate({
      target: patientMrnCounterTable.tenantId,
      set: { lastNumber: sql`${patientMrnCounterTable.lastNumber} + 1` },
    })
    .returning({ lastNumber: patientMrnCounterTable.lastNumber });

  const [patient] = await tx
    .insert(patientTable)
    .values({
      tenantId: data.tenantId,
      mrn: formatPatientMrn(counter.lastNumber),
      firstName: provisionalPatient.firstName,
      middleName: provisionalPatient.middleName ?? null,
      lastName: provisionalPatient.lastName,
      gender: provisionalPatient.gender ?? null,
      dateOfBirth: provisionalPatient.dateOfBirth ?? null,
      bloodGroup: provisionalPatient.bloodGroup ?? null,
      maritalStatus: provisionalPatient.maritalStatus ?? null,
      phone: provisionalPatient.phone,
      alternatePhone: provisionalPatient.alternatePhone ?? null,
      email: provisionalPatient.email ?? null,
      addressLine1: provisionalPatient.addressLine1 ?? null,
      addressLine2: provisionalPatient.addressLine2 ?? null,
      city: provisionalPatient.city ?? null,
      stateId: provisionalPatient.stateId ?? null,
      countryId: provisionalPatient.countryId ?? null,
      postalCode: provisionalPatient.postalCode ?? null,
      nationalityId: provisionalPatient.nationalityId ?? null,
      languageId: provisionalPatient.languageId ?? null,
      religionId: provisionalPatient.religionId ?? null,
      govtIdType: provisionalPatient.govtIdType ?? null,
      govtIdNumber: provisionalPatient.govtIdNumber ?? null,
      emergencyContactName: provisionalPatient.emergencyContactName ?? null,
      emergencyContactRelationship: provisionalPatient.emergencyContactRelationship ?? null,
      emergencyContactPhone: provisionalPatient.emergencyContactPhone ?? null,
      registrationStatus: 'provisional',
      isActive: true,
    })
    .returning({ id: patientTable.id });

  return patient.id;
}

export type CreateAppointmentRepositoryResult =
  | { success: true; data: Appointment }
  | { success: false; outcome: 'invalid-reference'; invalidReferences: string[] }
  | { success: false; outcome: 'patient-inactive' }
  | { success: false; outcome: 'potential-patient-match'; patientMatches: PotentialPatientMatch[] }
  | { success: false; outcome: 'slot-invalid' | 'slot-unavailable' | 'slot-past' };

async function createAppointment(
  data: ValidatedCreateAppointmentData
): Promise<CreateAppointmentRepositoryResult> {
  return db.transaction(async (tx) => {
    const invalidReferences: string[] = [];
    const slotContext = await getSlotBookingContext(
      data.tenantId,
      data.doctorId,
      data.doctorRotaId,
      data.slotDate,
      tx,
      true
    );

    if (!slotContext) invalidReferences.push('Doctor slot');

    const [mode] = await tx
      .select({ id: appointmentModeTable.id })
      .from(appointmentModeTable)
      .where(
        and(
          eq(appointmentModeTable.id, data.appointmentModeId),
          eq(appointmentModeTable.tenantId, data.tenantId),
          eq(appointmentModeTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);
    if (!mode) invalidReferences.push('Appointment mode');

    const [type] = await tx
      .select({ id: appointmentTypeTable.id })
      .from(appointmentTypeTable)
      .where(
        and(
          eq(appointmentTypeTable.id, data.appointmentTypeId),
          eq(appointmentTypeTable.tenantId, data.tenantId),
          eq(appointmentTypeTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);
    if (!type) invalidReferences.push('Appointment type');

    const [reason] = await tx
      .select({ id: appointmentReasonTable.id })
      .from(appointmentReasonTable)
      .where(
        and(
          eq(appointmentReasonTable.id, data.appointmentReasonId),
          eq(appointmentReasonTable.tenantId, data.tenantId),
          eq(appointmentReasonTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);
    if (!reason) invalidReferences.push('Appointment reason');

    const [scheduledStatus] = await tx
      .select({ id: appointmentStatusTable.id })
      .from(appointmentStatusTable)
      .where(
        and(
          eq(appointmentStatusTable.tenantId, data.tenantId),
          eq(appointmentStatusTable.category, 'SCHEDULED'),
          eq(appointmentStatusTable.isSystem, true),
          eq(appointmentStatusTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);
    if (!scheduledStatus) invalidReferences.push('Scheduled appointment status');

    if (invalidReferences.length > 0 || !slotContext || !scheduledStatus) {
      return { success: false, outcome: 'invalid-reference', invalidReferences };
    }

    if (!isValidSlotSelection(slotContext, data.slotTimes)) {
      return { success: false, outcome: 'slot-invalid' };
    }

    if (!isFutureSlotSelection(data.slotDate, data.slotTimes[0], data.timeZone)) {
      return { success: false, outcome: 'slot-past' };
    }

    const reserved = await getReservedSlotTimes(
      data.tenantId,
      data.doctorId,
      data.slotDate,
      data.slotTimes,
      tx
    );

    if (reserved.length > 0) {
      return { success: false, outcome: 'slot-unavailable' };
    }

    let patientId = data.patientId;

    if (patientId !== undefined) {
      const [patient] = await tx
        .select({ id: patientTable.id, isActive: patientTable.isActive })
        .from(patientTable)
        .where(
          and(
            eq(patientTable.id, patientId),
            eq(patientTable.tenantId, data.tenantId),
            eq(patientTable.isDeleted, false)
          )
        )
        .for('update')
        .limit(1);

      if (!patient) {
        return {
          success: false,
          outcome: 'invalid-reference',
          invalidReferences: ['Patient'],
        };
      }

      if (!patient.isActive) {
        return { success: false, outcome: 'patient-inactive' };
      }
    } else {
      const provisionalPatient = data.provisionalPatient;

      if (!provisionalPatient) {
        return {
          success: false,
          outcome: 'invalid-reference',
          invalidReferences: ['Provisional Patient'],
        };
      }

      const patientMatches = await findPotentialPatientMatches(
        data.tenantId,
        provisionalPatient.firstName,
        provisionalPatient.lastName,
        provisionalPatient.phone,
        tx
      );

      if (patientMatches.length > 0) {
        return { success: false, outcome: 'potential-patient-match', patientMatches };
      }

      patientId = await createProvisionalPatient(tx, data);
    }

    const [counter] = await tx
      .insert(appointmentBookingNumberCounterTable)
      .values({ tenantId: data.tenantId, lastNumber: 1001 })
      .onConflictDoUpdate({
        target: appointmentBookingNumberCounterTable.tenantId,
        set: { lastNumber: sql`${appointmentBookingNumberCounterTable.lastNumber} + 1` },
      })
      .returning({ lastNumber: appointmentBookingNumberCounterTable.lastNumber });

    const [createdAppointment] = await tx
      .insert(appointmentTable)
      .values({
        tenantId: data.tenantId,
        bookingNumber: formatAppointmentBookingNumber(counter.lastNumber),
        patientId,
        doctorId: data.doctorId,
        appointmentModeId: data.appointmentModeId,
        appointmentTypeId: data.appointmentTypeId,
        appointmentReasonId: data.appointmentReasonId,
        appointmentStatusId: scheduledStatus.id,
        slotDate: data.slotDate,
        rotaName: slotContext.rotaName,
        remarks: data.remarks ?? null,
      })
      .returning({ id: appointmentTable.id });

    await tx.insert(appointmentSlotReservationTable).values(
      data.slotTimes.map((slotTime) => ({
        tenantId: data.tenantId,
        appointmentId: createdAppointment.id,
        doctorId: data.doctorId,
        doctorRotaId: data.doctorRotaId,
        slotDate: data.slotDate,
        slotTime,
      }))
    );

    const created = await getAppointmentById(createdAppointment.id, data.tenantId, tx);

    if (!created) {
      throw new Error('Created Appointment could not be read');
    }

    return { success: true, data: created };
  });
}

export const appointmentRepository = {
  createAppointment,
  getAppointmentById,
  getReservedSlotTimes,
  getSlotBookingContext,
  findPotentialPatientMatches,
  getAppointmentByBookingNumber,
};
