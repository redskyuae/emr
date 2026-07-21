import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentRepository } from '../../appointment/repository/appointment-repository';
import { tenantLocalDateTime } from '../../appointment/schemas/appointment-slot';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { visitTypeRepository } from '../../visit-type/repository/visit-type-repository';
import { visitRepository } from '../repository/visit-repository';
import {
  checkInVisitSchema,
  formatVisitDate,
  visitTenantIdSchema,
  type ValidatedCheckInVisitData,
} from '../schemas/visit-schema';

// Only these Appointment states mean "expected today, not yet arrived"; the
// rest are already checked in, done, cancelled, or a no-show.
const CHECK_IN_ELIGIBLE_CATEGORIES = ['scheduled', 'confirmed'];

export async function validateCheckInVisit(
  payload: unknown,
  tenantId: unknown
): Promise<ValidationResult<ValidatedCheckInVisitData>> {
  const tenantIdResult = visitTenantIdSchema.safeParse(tenantId);
  const payloadResult = checkInVisitSchema.safeParse(payload);

  if (!tenantIdResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!tenantIdResult.success) {
      errors.push(...formatValidationErrors(tenantIdResult.error));
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const data = payloadResult.data;
  const validatedTenantId = tenantIdResult.data;

  const [tenant, visitType] = await Promise.all([
    tenantRepository.getTenantById(validatedTenantId),
    visitTypeRepository.getVisitTypeById(data.visitTypeId, validatedTenantId),
  ]);

  if (!tenant) {
    return { success: false, errors: ['Tenant not found'], status: StatusCodes.CONFLICT };
  }

  if (!visitType) {
    return {
      success: false,
      errors: [`Visit type ${data.visitTypeId} is Invalid.`],
      status: StatusCodes.CONFLICT,
    };
  }

  // The Tenant owns the operational clock, so "today" is its local date (ADR 0026).
  const visitDate = tenantLocalDateTime(new Date(), tenant.timeZone).date;

  let patientId: number;
  let doctorId: number;

  if (data.appointmentId !== undefined) {
    const appointment = await appointmentRepository.getAppointmentById(
      data.appointmentId,
      validatedTenantId
    );

    if (!appointment) {
      return {
        success: false,
        errors: [`Appointment ${data.appointmentId} is Invalid.`],
        status: StatusCodes.CONFLICT,
      };
    }

    if (appointment.slotDate !== formatVisitDate(visitDate)) {
      return {
        success: false,
        errors: [`Appointment ${appointment.bookingNumber} is not scheduled for today.`],
        status: StatusCodes.CONFLICT,
      };
    }

    if (!CHECK_IN_ELIGIBLE_CATEGORIES.includes(appointment.appointmentStatus.category)) {
      return {
        success: false,
        errors: [
          `Appointment ${appointment.bookingNumber} is not in a checked-in eligible status.`,
        ],
        status: StatusCodes.CONFLICT,
      };
    }

    const existingVisit = await visitRepository.findNonCancelledVisitByAppointmentId(
      validatedTenantId,
      data.appointmentId
    );

    if (existingVisit) {
      return {
        success: false,
        errors: [`Appointment ${appointment.bookingNumber} already has a visit.`],
        status: StatusCodes.CONFLICT,
      };
    }

    patientId = appointment.patient.id;
    doctorId = appointment.doctor.id;
  } else {
    // The schema guarantees both are present when appointmentId is absent.
    patientId = data.patientId as number;
    doctorId = data.doctorId as number;

    const doctor = await doctorRepository.getDoctorById(doctorId, validatedTenantId);

    if (!doctor) {
      return {
        success: false,
        errors: [`Doctor ${doctorId} is Invalid.`],
        status: StatusCodes.CONFLICT,
      };
    }

    if (!doctor.isActive) {
      return {
        success: false,
        errors: [`Doctor ${doctorId} is inactive and cannot be assigned a Visit.`],
        status: StatusCodes.CONFLICT,
      };
    }
  }

  const patient = await patientRepository.getPatientById(patientId, validatedTenantId);

  if (!patient) {
    return {
      success: false,
      errors: [`Patient ${patientId} is Invalid.`],
      status: StatusCodes.CONFLICT,
    };
  }

  // Only Registered Patients may begin clinical care (ADR 0022 / glossary).
  if (patient.registrationStatus !== 'registered') {
    return {
      success: false,
      errors: [
        `Patient ${patientId} is provisional and must complete registration before check-in.`,
      ],
      status: StatusCodes.CONFLICT,
    };
  }

  if (!patient.isActive) {
    return {
      success: false,
      errors: [`Patient ${patientId} is inactive and cannot be checked in.`],
      status: StatusCodes.CONFLICT,
    };
  }

  const activeVisit = await visitRepository.findActiveVisitByPatientId(
    validatedTenantId,
    patientId
  );

  if (activeVisit) {
    return {
      success: false,
      errors: [`Patient ${patientId} already has an active visit.`],
      status: StatusCodes.CONFLICT,
    };
  }

  return {
    success: true,
    data: {
      tenantId: validatedTenantId,
      patientId,
      doctorId,
      visitTypeId: data.visitTypeId,
      appointmentId: data.appointmentId,
      chiefComplaint: data.chiefComplaint,
      remarks: data.remarks,
      visitDate,
      documents: data.documents,
    },
  };
}
