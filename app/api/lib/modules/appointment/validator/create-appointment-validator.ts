import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { appointmentModeRepository } from '../../appointment-mode/repository/appointment-mode-repository';
import { appointmentReasonRepository } from '../../appointment-reason/repository/appointment-reason-repository';
import { appointmentStatusRepository } from '../../appointment-status/repository/appointment-status-repository';
import { appointmentTypeRepository } from '../../appointment-type/repository/appointment-type-repository';
import { doctorRepository } from '../../doctor/repository/doctor-repository';
import { patientRepository } from '../../patient/repository/patient-repository';
import { patientTreatmentPlanRepository } from '../../patient-treatment-plan/repository/patient-treatment-plan-repository';
import { validatePatientEmiratesIdUniqueness } from '../../patient/validator/patient-emirates-id-validator';
import { validatePatientReferences } from '../../patient/validator/patient-reference-validator';
import { tenantRepository } from '../../tenant/repository/tenant-repository';
import { treatmentRepository } from '../../treatment/repository/treatment-repository';
import { therapistRepository } from '../../therapist/repository/therapist-repository';
import { appointmentRepository } from '../repository/appointment-repository';
import {
  appointmentTenantIdSchema,
  createAppointmentSchema,
  type CreateAppointmentInput,
  type PotentialPatientMatch,
  type ValidatedCreateAppointmentData,
} from '../schemas/appointment-schema';
import { isFutureSlotSelection, isValidSlotSelection } from '../schemas/appointment-slot';

export type CreateAppointmentValidationResult = ValidationResult<ValidatedCreateAppointmentData> & {
  patientMatches?: PotentialPatientMatch[];
};

export async function validateCreateAppointment(
  payload: unknown,
  tenantId: unknown
): Promise<CreateAppointmentValidationResult> {
  const tenantIdResult = appointmentTenantIdSchema.safeParse(tenantId);
  const payloadResult = createAppointmentSchema.safeParse(payload);

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
  let validatedData: CreateAppointmentInput = data;
  const validatedTenantId = tenantIdResult.data;
  const [tenant, scheduledStatus] = await Promise.all([
    tenantRepository.getTenantById(validatedTenantId),
    appointmentStatusRepository.findSystemByCategory(validatedTenantId, 'SCHEDULED'),
  ]);
  const errors: string[] = [];

  if (!tenant) errors.push('Tenant not found');
  if (!scheduledStatus) errors.push('Scheduled appointment status is not configured.');

  if (errors.length > 0 || !tenant) {
    return { success: false, errors, status: StatusCodes.CONFLICT };
  }

  if (data.bookingPath === 'PROCEDURE') {
    const patient = await patientRepository.getPatientById(data.patientId, validatedTenantId);

    if (!patient) {
      return {
        success: false,
        errors: [`Patient ${data.patientId} is Invalid.`],
        status: StatusCodes.CONFLICT,
      };
    }

    if (!patient.isActive) {
      return {
        success: false,
        errors: ['Inactive Patient cannot be booked for an Appointment.'],
        status: StatusCodes.CONFLICT,
      };
    }

    if (patient.registrationStatus !== 'registered') {
      return {
        success: false,
        errors: ['Only a Registered Patient can be booked for a Procedure Appointment.'],
        status: StatusCodes.CONFLICT,
      };
    }
  }

  if (data.bookingPath === 'CONSULTATION') {
    const [mode, type, reason, slotContext] = await Promise.all([
      appointmentModeRepository.getAppointmentModeById(data.appointmentModeId, validatedTenantId),
      appointmentTypeRepository.getAppointmentTypeById(data.appointmentTypeId, validatedTenantId),
      appointmentReasonRepository.getAppointmentReasonById(
        data.appointmentReasonId,
        validatedTenantId
      ),
      appointmentRepository.getSlotBookingContext(
        validatedTenantId,
        data.doctorId,
        data.doctorRotaId,
        data.slotDate
      ),
    ]);

    if (!mode) errors.push(`Appointment mode ${data.appointmentModeId} is Invalid.`);
    if (!type) errors.push(`Appointment type ${data.appointmentTypeId} is Invalid.`);
    if (!reason) errors.push(`Appointment reason ${data.appointmentReasonId} is Invalid.`);
    if (!slotContext) errors.push('Doctor slot is Invalid.');

    if (errors.length > 0 || !slotContext) {
      return { success: false, errors, status: StatusCodes.CONFLICT };
    }

    if (!isValidSlotSelection(slotContext, data.slotTimes)) {
      return {
        success: false,
        errors: ['Selected Doctor slots must exist and be consecutive.'],
      };
    }

    if (!isFutureSlotSelection(data.slotDate, data.slotTimes[0], tenant.timeZone)) {
      return { success: false, errors: ['Selected Doctor slots must be in the future.'] };
    }

    const reserved = await appointmentRepository.getReservedSlotTimes(
      validatedTenantId,
      data.doctorId,
      data.slotDate,
      data.slotTimes
    );

    if (reserved.length > 0) {
      return {
        success: false,
        errors: ['One or more selected Doctor slots are no longer available.'],
        status: StatusCodes.CONFLICT,
      };
    }
  } else {
    if (!isFutureSlotSelection(data.slotDate, data.startTime, tenant.timeZone)) {
      return { success: false, errors: ['Procedure time must be in the future.'] };
    }

    if (data.doctorId !== undefined) {
      const doctor = await doctorRepository.getDoctorById(data.doctorId, validatedTenantId);

      if (!doctor) {
        return {
          success: false,
          errors: [`Doctor ${data.doctorId} is Invalid.`],
          status: StatusCodes.CONFLICT,
        };
      }

      if (!doctor.isActive) {
        return {
          success: false,
          errors: [`Doctor ${data.doctorId} is inactive and cannot be assigned to an Appointment.`],
          status: StatusCodes.CONFLICT,
        };
      }
    }

    const currentPlans = await patientTreatmentPlanRepository.getCurrentByPatientId(
      data.patientId,
      validatedTenantId
    );
    let requiredTherapistSkillId: number | null | undefined;

    if ('patientTreatmentPlanId' in data) {
      const plan = currentPlans.find((candidate) => candidate.id === data.patientTreatmentPlanId);
      const session = plan?.sessions.find(
        (candidate) => candidate.id === data.patientTreatmentPlanSessionId
      );

      if (!session) {
        return {
          success: false,
          errors: ['Patient Treatment Plan Session is Invalid.'],
          status: StatusCodes.CONFLICT,
        };
      }

      if (!session.isBookable) {
        return {
          success: false,
          errors: ['Patient Treatment Plan Session is not available.'],
          status: StatusCodes.CONFLICT,
        };
      }

      if (data.therapistId !== undefined) {
        const [treatment, treatmentSession] = await Promise.all([
          plan?.treatmentId == null
            ? undefined
            : treatmentRepository.getTreatmentById(plan.treatmentId, validatedTenantId),
          session.treatmentSessionId === null
            ? undefined
            : treatmentRepository.getTreatmentSessionById(
                session.treatmentSessionId,
                validatedTenantId
              ),
        ]);
        requiredTherapistSkillId =
          treatmentSession?.therapistSkillId ?? treatment?.therapistSkillId;
      }
    } else {
      if (currentPlans.length > 0) {
        return {
          success: false,
          errors: ['Catalogue Treatment cannot be assigned while the Patient has a current Plan.'],
          status: StatusCodes.CONFLICT,
        };
      }

      const treatment = await treatmentRepository.getTreatmentById(
        data.treatmentId,
        validatedTenantId
      );

      if (!treatment) {
        return {
          success: false,
          errors: [`Treatment ${data.treatmentId} is Invalid.`],
          status: StatusCodes.CONFLICT,
        };
      }

      requiredTherapistSkillId =
        treatment.sessions.toSorted((left, right) => left.sessionNumber - right.sessionNumber)[0]
          ?.therapistSkillId ?? treatment.therapistSkillId;

      if (treatment.sessionStructure === 'REPEATABLE') {
        if (treatment.sessions.length !== 1) {
          return {
            success: false,
            errors: ['Repeatable Treatment must have exactly one Session template.'],
            status: StatusCodes.CONFLICT,
          };
        }

        const totalSessions = data.totalSessions ?? treatment.defaultTotalSessions ?? undefined;

        if (totalSessions === undefined) {
          return {
            success: false,
            errors: ['Total Sessions is required for a Repeatable Treatment without a default.'],
          };
        }

        validatedData = { ...data, totalSessions };
      } else {
        if (data.totalSessions !== undefined) {
          return {
            success: false,
            errors: ['Sequenced Treatments derive their count from Session templates.'],
          };
        }

        if (treatment.sessions.length === 0) {
          return {
            success: false,
            errors: ['Sequenced Treatment must have at least one Session template.'],
            status: StatusCodes.CONFLICT,
          };
        }
      }
    }

    if (data.therapistId !== undefined) {
      const therapist = await therapistRepository.getTherapistById(
        data.therapistId,
        validatedTenantId
      );
      if (!therapist) errors.push(`Therapist ${data.therapistId} is Invalid.`);
      else if (!therapist.isActive)
        errors.push(
          `Therapist ${data.therapistId} is inactive and cannot be assigned to an Appointment.`
        );
      else {
        if (
          requiredTherapistSkillId != null &&
          !therapist.skills.some((skill) => skill.id === requiredTherapistSkillId)
        ) {
          errors.push(`Therapist ${data.therapistId} does not have the required Therapist Skill.`);
        }
      }
      if (errors.length > 0) return { success: false, errors, status: StatusCodes.CONFLICT };
    }
  }

  if (data.bookingPath === 'CONSULTATION' && data.patientId !== undefined) {
    const patient = await patientRepository.getPatientById(data.patientId, validatedTenantId);

    if (!patient) {
      return {
        success: false,
        errors: [`Patient ${data.patientId} is Invalid.`],
        status: StatusCodes.CONFLICT,
      };
    }

    if (!patient.isActive) {
      return {
        success: false,
        errors: ['Inactive Patient cannot be booked for an Appointment.'],
        status: StatusCodes.CONFLICT,
      };
    }

    if (patient.registrationStatus === 'provisional') {
      return {
        success: false,
        status: StatusCodes.CONFLICT,
        errors: [
          'Provisional Patient must complete or reconcile Patient Registration before another Appointment.',
        ],
      };
    }
  }

  if (data.bookingPath === 'CONSULTATION' && data.provisionalPatient) {
    const [referenceResult, emiratesIdResult, patientMatches] = await Promise.all([
      validatePatientReferences(data.provisionalPatient),
      validatePatientEmiratesIdUniqueness({
        tenantId: validatedTenantId,
        emiratesId: data.provisionalPatient.emiratesId,
      }),
      appointmentRepository.findPotentialPatientMatches(
        validatedTenantId,
        data.provisionalPatient.firstName,
        data.provisionalPatient.lastName,
        data.provisionalPatient.phone,
        data.provisionalPatient.emiratesId
      ),
    ]);

    if (!referenceResult.success) {
      return {
        success: false,
        errors: referenceResult.errors,
        status: referenceResult.status,
      };
    }

    // Checked before the uniqueness result on purpose. An Emirates ID that
    // already exists means the patient has a chart, so the caller should see
    // candidates to book against rather than a bare conflict — matching the
    // Patient Reconciliation rule that matching identifies candidates but never
    // links or merges automatically. The uniqueness check below is the backstop.
    const registeredPatientMatches = patientMatches.filter(
      (patient) => patient.registrationStatus === 'registered'
    );

    if (registeredPatientMatches.length > 0) {
      return {
        success: false,
        errors: ['Potential Patient match found. Retry with patientId.'],
        status: StatusCodes.CONFLICT,
        patientMatches: registeredPatientMatches,
      };
    }

    if (patientMatches.length > 0) {
      return {
        success: false,
        status: StatusCodes.CONFLICT,
        errors: [
          'Matching Provisional Patient must complete or reconcile Patient Registration before another Appointment.',
        ],
      };
    }

    if (!emiratesIdResult.success) {
      return { success: false, errors: emiratesIdResult.errors, status: emiratesIdResult.status };
    }
  }

  return {
    success: true,
    data: {
      ...validatedData,
      tenantId: validatedTenantId,
      timeZone: tenant.timeZone,
    },
  };
}
