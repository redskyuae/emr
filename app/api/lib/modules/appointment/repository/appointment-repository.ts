import { and, asc, count, desc, eq, gte, ilike, inArray, lte, ne, or, sql } from 'drizzle-orm';

import { db } from '@/app/db';
import {
  appointment as appointmentTable,
  appointmentBookingNumberCounter as appointmentBookingNumberCounterTable,
  appointmentSlotReservation as appointmentSlotReservationTable,
} from '@/app/db/schema/appointment';
import { appointmentCancelledReason as appointmentCancelledReasonTable } from '@/app/db/schema/appointment-cancelled-reason';
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
  AppointmentListParams,
  PotentialPatientMatch,
  ValidatedCreateAppointmentData,
  ValidatedCancelAppointmentData,
  ValidatedRescheduleAppointmentData,
} from '../schemas/appointment-schema';
import { formatAppointmentDate } from '../schemas/appointment-schema';
import { isFutureSlotSelection, isValidSlotSelection } from '../schemas/appointment-slot';

type SelectExecutor = Pick<typeof db, 'select'>;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type AppointmentRow = Omit<
  Appointment,
  'doctor' | 'doctorRotaId' | 'slotDate' | 'appointmentStatus' | 'slots'
> & {
  doctor: {
    id: number | null;
    name: string | null;
  };
  slotDate: string;
  appointmentStatus: Omit<Appointment['appointmentStatus'], 'category'> & {
    category: string;
  };
};
type AppointmentReservations = {
  doctorRotaId: number | null;
  slots: Appointment['slots'];
};

export type AppointmentSlotBookingContext = {
  rotaName: string;
  doctorName: string;
  toTime: string;
  fromTime: string;
  durationMinutes: number;
};

function addMinutesToTime(value: string, minutesToAdd: number) {
  const [hours, minutes] = value.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

const appointmentColumns = {
  id: appointmentTable.id,
  cancelledAt: appointmentTable.cancelledAt,
  remarks: appointmentTable.remarks,
  rotaName: appointmentTable.rotaName,
  tenantId: appointmentTable.tenantId,
  slotDate: appointmentTable.slotDate,
  endTime: appointmentTable.endTime,
  startTime: appointmentTable.startTime,
  bookingPath: appointmentTable.bookingPath,
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
  appointmentCancelledReason: {
    id: appointmentCancelledReasonTable.id,
    name: appointmentCancelledReasonTable.name,
    code: appointmentCancelledReasonTable.code,
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
    .leftJoin(
      doctorTable,
      and(
        eq(doctorTable.id, appointmentTable.doctorId),
        eq(doctorTable.tenantId, appointmentTable.tenantId),
        eq(doctorTable.isDeleted, false)
      )
    )
    .leftJoin(userTable, eq(userTable.id, doctorTable.userId))
    .leftJoin(
      appointmentModeTable,
      and(
        eq(appointmentModeTable.id, appointmentTable.appointmentModeId),
        eq(appointmentModeTable.tenantId, appointmentTable.tenantId)
      )
    )
    .leftJoin(
      appointmentTypeTable,
      and(
        eq(appointmentTypeTable.id, appointmentTable.appointmentTypeId),
        eq(appointmentTypeTable.tenantId, appointmentTable.tenantId)
      )
    )
    .leftJoin(
      appointmentReasonTable,
      and(
        eq(appointmentReasonTable.id, appointmentTable.appointmentReasonId),
        eq(appointmentReasonTable.tenantId, appointmentTable.tenantId)
      )
    )
    .leftJoin(
      appointmentCancelledReasonTable,
      and(
        eq(appointmentCancelledReasonTable.id, appointmentTable.appointmentCancelledReasonId),
        eq(appointmentCancelledReasonTable.tenantId, appointmentTable.tenantId)
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

function toAppointment(row: AppointmentRow, reservations?: AppointmentReservations): Appointment {
  return {
    ...row,
    slots: reservations?.slots ?? [],
    doctor:
      row.doctor.id === null || row.doctor.name === null
        ? null
        : { id: row.doctor.id, name: row.doctor.name },
    doctorRotaId: reservations?.doctorRotaId ?? null,
    slotDate: formatAppointmentDate(row.slotDate),
    appointmentStatus: {
      ...row.appointmentStatus,
      category:
        row.appointmentStatus.category.toLowerCase() as Appointment['appointmentStatus']['category'],
    },
  };
}

async function getAppointmentSlots(
  appointmentIds: number[],
  tenantId: string,
  executor: SelectExecutor = db
) {
  if (appointmentIds.length === 0) {
    return new Map<number, AppointmentReservations>();
  }

  const rows = await executor
    .select({
      appointmentId: appointmentSlotReservationTable.appointmentId,
      doctorRotaId: appointmentSlotReservationTable.doctorRotaId,
      slotTime: appointmentSlotReservationTable.slotTime,
    })
    .from(appointmentSlotReservationTable)
    .where(
      and(
        eq(appointmentSlotReservationTable.tenantId, tenantId),
        eq(appointmentSlotReservationTable.isDeleted, false),
        inArray(appointmentSlotReservationTable.appointmentId, appointmentIds)
      )
    )
    .orderBy(
      appointmentSlotReservationTable.appointmentId,
      appointmentSlotReservationTable.slotTime
    );

  const slotsByAppointment = new Map<number, AppointmentReservations>();

  for (const row of rows) {
    const reservations = slotsByAppointment.get(row.appointmentId) ?? {
      doctorRotaId: row.doctorRotaId,
      slots: [],
    };
    reservations.slots.push({ slotTime: row.slotTime, status: 'Booked' });
    slotsByAppointment.set(row.appointmentId, reservations);
  }

  return slotsByAppointment;
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

  const slotsByAppointment = await getAppointmentSlots([id], tenantId, executor);

  return toAppointment(row as AppointmentRow, slotsByAppointment.get(id));
}

async function getAppointments({
  page = 1,
  limit = 10,
  query,
  tenantId,
  doctorId,
  patientId,
  slotDate,
  appointmentStatusId,
}: AppointmentListParams) {
  const offset = (page - 1) * limit;
  const trimmedQuery = query?.trim();
  const searchCondition = trimmedQuery
    ? or(
        ilike(appointmentTable.bookingNumber, `%${trimmedQuery}%`),
        ilike(patientTable.mrn, `%${trimmedQuery}%`),
        ilike(patientTable.firstName, `%${trimmedQuery}%`),
        ilike(patientTable.lastName, `%${trimmedQuery}%`),
        ilike(userTable.name, `%${trimmedQuery}%`)
      )
    : undefined;
  const whereClause = and(
    eq(appointmentTable.tenantId, tenantId),
    eq(appointmentTable.isDeleted, false),
    slotDate ? eq(appointmentTable.slotDate, slotDate) : undefined,
    doctorId ? eq(appointmentTable.doctorId, doctorId) : undefined,
    patientId ? eq(appointmentTable.patientId, patientId) : undefined,
    appointmentStatusId ? eq(appointmentTable.appointmentStatusId, appointmentStatusId) : undefined,
    searchCondition
  );
  const earliestSlotTime = sql<string>`coalesce(${appointmentTable.startTime}, (
    select min(${appointmentSlotReservationTable.slotTime})
    from ${appointmentSlotReservationTable}
    where ${appointmentSlotReservationTable.appointmentId} = ${appointmentTable.id}
      and ${appointmentSlotReservationTable.tenantId} = ${appointmentTable.tenantId}
      and ${appointmentSlotReservationTable.isDeleted} = false
  ))`;
  const ordering = slotDate
    ? [asc(appointmentTable.slotDate), asc(earliestSlotTime), asc(appointmentTable.id)]
    : [desc(appointmentTable.slotDate), asc(earliestSlotTime), desc(appointmentTable.id)];

  const [rows, [{ total }]] = await Promise.all([
    appointmentJoins()
      .where(whereClause)
      .orderBy(...ordering)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(appointmentTable)
      .innerJoin(
        patientTable,
        and(
          eq(patientTable.id, appointmentTable.patientId),
          eq(patientTable.tenantId, appointmentTable.tenantId),
          eq(patientTable.isDeleted, false)
        )
      )
      .leftJoin(
        doctorTable,
        and(
          eq(doctorTable.id, appointmentTable.doctorId),
          eq(doctorTable.tenantId, appointmentTable.tenantId),
          eq(doctorTable.isDeleted, false)
        )
      )
      .leftJoin(userTable, eq(userTable.id, doctorTable.userId))
      .where(whereClause),
  ]);
  const appointmentIds = rows.map((row) => row.id);
  const slotsByAppointment = await getAppointmentSlots(appointmentIds, tenantId);

  return {
    total,
    data: rows.map((row) => toAppointment(row as AppointmentRow, slotsByAppointment.get(row.id))),
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

// Matches on name + phone together, OR on Emirates ID alone. An Emirates ID is
// a singleton by law, so a hit on it identifies the patient regardless of the
// name given — which closes the gap where "Mohammed Ali" booking from his
// wife's phone sails past a name+phone check into a second chart.
async function findPotentialPatientMatches(
  tenantId: string,
  firstName: string,
  lastName: string,
  phone: string,
  emiratesId?: string,
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
        or(
          and(
            sql`lower(trim(${patientTable.firstName})) = ${firstName.trim().toLowerCase()}`,
            sql`lower(trim(${patientTable.lastName})) = ${lastName.trim().toLowerCase()}`,
            sql`trim(${patientTable.phone}) = ${phone.trim()}`
          ),
          emiratesId ? eq(patientTable.emiratesId, emiratesId) : undefined
        )
      )
    );
}

async function getReservedSlotTimes(
  tenantId: string,
  doctorId: number,
  slotDate: string,
  slotTimes?: string[],
  {
    executor = db,
    excludeAppointmentId,
  }: { executor?: SelectExecutor; excludeAppointmentId?: number } = {}
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
        slotTimes ? inArray(appointmentSlotReservationTable.slotTime, slotTimes) : undefined,
        excludeAppointmentId
          ? ne(appointmentSlotReservationTable.appointmentId, excludeAppointmentId)
          : undefined
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
      emiratesId: provisionalPatient.emiratesId ?? null,
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

export type RescheduleAppointmentRepositoryResult =
  | { success: true; data: Appointment }
  | {
      success: false;
      outcome:
        | 'not-found'
        | 'ineligible'
        | 'no-change'
        | 'booking-path-mismatch'
        | 'invalid-reference'
        | 'slot-invalid'
        | 'slot-unavailable'
        | 'slot-past';
    };

export type CancelAppointmentRepositoryResult =
  | { success: true; data: Appointment }
  | {
      success: false;
      outcome: 'not-found' | 'ineligible' | 'invalid-reason' | 'cancelled-status-not-configured';
    };

async function createAppointment(
  data: ValidatedCreateAppointmentData
): Promise<CreateAppointmentRepositoryResult> {
  return db.transaction(async (tx) => {
    const invalidReferences: string[] = [];
    let slotContext: AppointmentSlotBookingContext | undefined;

    if (data.bookingPath === 'CONSULTATION') {
      slotContext = await getSlotBookingContext(
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
    } else if (data.doctorId !== undefined) {
      const [doctor] = await tx
        .select({ id: doctorTable.id })
        .from(doctorTable)
        .where(
          and(
            eq(doctorTable.id, data.doctorId),
            eq(doctorTable.tenantId, data.tenantId),
            eq(doctorTable.isActive, true),
            eq(doctorTable.isDeleted, false)
          )
        )
        .for('update')
        .limit(1);
      if (!doctor) invalidReferences.push('Doctor');
    }

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

    if (invalidReferences.length > 0 || !scheduledStatus) {
      return { success: false, outcome: 'invalid-reference', invalidReferences };
    }

    if (data.bookingPath === 'CONSULTATION') {
      if (!slotContext || !isValidSlotSelection(slotContext, data.slotTimes)) {
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
        { executor: tx }
      );

      if (reserved.length > 0) {
        return { success: false, outcome: 'slot-unavailable' };
      }
    } else if (!isFutureSlotSelection(data.slotDate, data.startTime, data.timeZone)) {
      return { success: false, outcome: 'slot-past' };
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
        provisionalPatient.emiratesId,
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

    const consultationEndTime =
      data.bookingPath === 'CONSULTATION' && slotContext
        ? addMinutesToTime(data.slotTimes.at(-1) ?? data.slotTimes[0], slotContext.durationMinutes)
        : null;
    const [createdAppointment] = await tx
      .insert(appointmentTable)
      .values({
        tenantId: data.tenantId,
        bookingPath: data.bookingPath,
        bookingNumber: formatAppointmentBookingNumber(counter.lastNumber),
        patientId,
        doctorId: data.doctorId,
        appointmentModeId: data.bookingPath === 'CONSULTATION' ? data.appointmentModeId : undefined,
        appointmentTypeId: data.bookingPath === 'CONSULTATION' ? data.appointmentTypeId : undefined,
        appointmentReasonId:
          data.bookingPath === 'CONSULTATION' ? data.appointmentReasonId : undefined,
        appointmentStatusId: scheduledStatus.id,
        slotDate: data.slotDate,
        startTime: data.bookingPath === 'CONSULTATION' ? data.slotTimes[0] : data.startTime,
        endTime: data.bookingPath === 'CONSULTATION' ? consultationEndTime : data.endTime,
        rotaName: data.bookingPath === 'CONSULTATION' ? slotContext?.rotaName : undefined,
        remarks: data.remarks ?? null,
      })
      .returning({ id: appointmentTable.id });

    if (data.bookingPath === 'CONSULTATION') {
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
    }

    const created = await getAppointmentById(createdAppointment.id, data.tenantId, tx);

    if (!created) {
      throw new Error('Created Appointment could not be read');
    }

    return { success: true, data: created };
  });
}

async function rescheduleAppointment(
  data: ValidatedRescheduleAppointmentData
): Promise<RescheduleAppointmentRepositoryResult> {
  return db.transaction(async (tx) => {
    const [currentRow] = await tx
      .select({
        id: appointmentTable.id,
        slotDate: appointmentTable.slotDate,
        endTime: appointmentTable.endTime,
        startTime: appointmentTable.startTime,
        doctorId: appointmentTable.doctorId,
        bookingPath: appointmentTable.bookingPath,
        statusCategory: appointmentStatusTable.category,
      })
      .from(appointmentTable)
      .innerJoin(
        appointmentStatusTable,
        and(
          eq(appointmentStatusTable.id, appointmentTable.appointmentStatusId),
          eq(appointmentStatusTable.tenantId, appointmentTable.tenantId)
        )
      )
      .where(
        and(
          eq(appointmentTable.id, data.id),
          eq(appointmentTable.tenantId, data.tenantId),
          eq(appointmentTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!currentRow) return { success: false, outcome: 'not-found' };
    if (currentRow.statusCategory !== 'SCHEDULED' && currentRow.statusCategory !== 'CONFIRMED') {
      return { success: false, outcome: 'ineligible' };
    }
    if (currentRow.bookingPath !== data.bookingPath) {
      return { success: false, outcome: 'booking-path-mismatch' };
    }

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

    if (!scheduledStatus) return { success: false, outcome: 'invalid-reference' };

    const now = new Date();

    if (data.bookingPath === 'PROCEDURE') {
      if (
        currentRow.slotDate === data.slotDate &&
        currentRow.startTime === data.startTime &&
        currentRow.endTime === data.endTime
      ) {
        return { success: false, outcome: 'no-change' };
      }

      if (!isFutureSlotSelection(data.slotDate, data.startTime, data.timeZone)) {
        return { success: false, outcome: 'slot-past' };
      }

      await tx
        .update(appointmentTable)
        .set({
          slotDate: data.slotDate,
          endTime: data.endTime,
          startTime: data.startTime,
          modifiedOn: now,
          appointmentStatusId: scheduledStatus.id,
        })
        .where(
          and(
            eq(appointmentTable.id, data.id),
            eq(appointmentTable.tenantId, data.tenantId),
            eq(appointmentTable.isDeleted, false)
          )
        );
    } else {
      const current = await getAppointmentById(data.id, data.tenantId, tx);

      if (!current) return { success: false, outcome: 'not-found' };

      if (
        currentRow.slotDate === data.slotDate &&
        currentRow.doctorId === data.doctorId &&
        current.doctorRotaId === data.doctorRotaId &&
        current.slots.map((slot) => slot.slotTime).join(',') === data.slotTimes.join(',')
      ) {
        return { success: false, outcome: 'no-change' };
      }

      const slotContext = await getSlotBookingContext(
        data.tenantId,
        data.doctorId,
        data.doctorRotaId,
        data.slotDate,
        tx,
        true
      );

      if (!slotContext) return { success: false, outcome: 'invalid-reference' };
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
        { executor: tx, excludeAppointmentId: data.id }
      );

      if (reserved.length > 0) return { success: false, outcome: 'slot-unavailable' };

      await tx
        .update(appointmentSlotReservationTable)
        .set({ isDeleted: true, deletedOn: now, modifiedOn: now })
        .where(
          and(
            eq(appointmentSlotReservationTable.appointmentId, data.id),
            eq(appointmentSlotReservationTable.tenantId, data.tenantId),
            eq(appointmentSlotReservationTable.isDeleted, false)
          )
        );

      await tx.insert(appointmentSlotReservationTable).values(
        data.slotTimes.map((slotTime) => ({
          tenantId: data.tenantId,
          appointmentId: data.id,
          doctorId: data.doctorId,
          doctorRotaId: data.doctorRotaId,
          slotDate: data.slotDate,
          slotTime,
        }))
      );

      const endTime = addMinutesToTime(
        data.slotTimes.at(-1) ?? data.slotTimes[0],
        slotContext.durationMinutes
      );

      await tx
        .update(appointmentTable)
        .set({
          endTime,
          slotDate: data.slotDate,
          doctorId: data.doctorId,
          startTime: data.slotTimes[0],
          rotaName: slotContext.rotaName,
          modifiedOn: now,
          appointmentStatusId: scheduledStatus.id,
        })
        .where(
          and(
            eq(appointmentTable.id, data.id),
            eq(appointmentTable.tenantId, data.tenantId),
            eq(appointmentTable.isDeleted, false)
          )
        );
    }

    const updated = await getAppointmentById(data.id, data.tenantId, tx);
    if (!updated) throw new Error('Rescheduled Appointment could not be read');

    return { success: true, data: updated };
  });
}

async function cancelAppointment(
  data: ValidatedCancelAppointmentData
): Promise<CancelAppointmentRepositoryResult> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: appointmentTable.id,
        statusCategory: appointmentStatusTable.category,
      })
      .from(appointmentTable)
      .innerJoin(
        appointmentStatusTable,
        and(
          eq(appointmentStatusTable.id, appointmentTable.appointmentStatusId),
          eq(appointmentStatusTable.tenantId, appointmentTable.tenantId)
        )
      )
      .where(
        and(
          eq(appointmentTable.id, data.id),
          eq(appointmentTable.tenantId, data.tenantId),
          eq(appointmentTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!current) return { success: false, outcome: 'not-found' };
    if (current.statusCategory !== 'SCHEDULED' && current.statusCategory !== 'CONFIRMED') {
      return { success: false, outcome: 'ineligible' };
    }

    const [cancellationReason] = await tx
      .select({ id: appointmentCancelledReasonTable.id })
      .from(appointmentCancelledReasonTable)
      .where(
        and(
          eq(appointmentCancelledReasonTable.id, data.appointmentCancelledReasonId),
          eq(appointmentCancelledReasonTable.tenantId, data.tenantId),
          eq(appointmentCancelledReasonTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!cancellationReason) return { success: false, outcome: 'invalid-reason' };

    const [cancelledStatus] = await tx
      .select({ id: appointmentStatusTable.id })
      .from(appointmentStatusTable)
      .where(
        and(
          eq(appointmentStatusTable.tenantId, data.tenantId),
          eq(appointmentStatusTable.category, 'CANCELLED'),
          eq(appointmentStatusTable.isSystem, true),
          eq(appointmentStatusTable.isDeleted, false)
        )
      )
      .for('update')
      .limit(1);

    if (!cancelledStatus) {
      return { success: false, outcome: 'cancelled-status-not-configured' };
    }

    const cancelledAt = new Date();

    await tx
      .update(appointmentSlotReservationTable)
      .set({ isDeleted: true, deletedOn: cancelledAt, modifiedOn: cancelledAt })
      .where(
        and(
          eq(appointmentSlotReservationTable.appointmentId, data.id),
          eq(appointmentSlotReservationTable.tenantId, data.tenantId),
          eq(appointmentSlotReservationTable.isDeleted, false)
        )
      );

    await tx
      .update(appointmentTable)
      .set({
        cancelledAt,
        modifiedOn: cancelledAt,
        appointmentStatusId: cancelledStatus.id,
        appointmentCancelledReasonId: cancellationReason.id,
      })
      .where(
        and(
          eq(appointmentTable.id, data.id),
          eq(appointmentTable.tenantId, data.tenantId),
          eq(appointmentTable.isDeleted, false)
        )
      );

    const cancelled = await getAppointmentById(data.id, data.tenantId, tx);
    if (!cancelled) throw new Error('Cancelled Appointment could not be read');

    return { success: true, data: cancelled };
  });
}

export const appointmentRepository = {
  cancelAppointment,
  getAppointments,
  createAppointment,
  rescheduleAppointment,
  getAppointmentById,
  getReservedSlotTimes,
  getSlotBookingContext,
  findPotentialPatientMatches,
  getAppointmentByBookingNumber,
};
