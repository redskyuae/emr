import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { patientRepository } from '../../patient/repository/patient-repository';
import { visitRepository } from '../../visit/repository/visit-repository';
import { patientTreatmentPlanRepository } from '../repository/patient-treatment-plan-repository';
import {
  patientTreatmentPlanIdSchema,
  patientTreatmentPlanPatientIdSchema,
  patientTreatmentPlanSessionIdSchema,
  patientTreatmentPlanTenantIdSchema,
  startPatientTreatmentPlanSessionSchema,
  updatePatientTreatmentPlanSessionSchema,
  type PatientTreatmentPlan,
  type PatientTreatmentPlanReadSession,
  type StartPatientTreatmentPlanSessionInput,
  type UpdatePatientTreatmentPlanSessionInput,
} from '../schemas/patient-treatment-plan-schema';

type SessionTargetParams = {
  patientId: unknown;
  tenantId: unknown;
  patientTreatmentPlanId: unknown;
  patientTreatmentPlanSessionId: unknown;
};

type PendingSessionContext = {
  patientId: number;
  tenantId: string;
  plan: PatientTreatmentPlan;
  session: PatientTreatmentPlanReadSession;
};

function parseTarget(params: SessionTargetParams) {
  const patientId = patientTreatmentPlanPatientIdSchema.safeParse(params.patientId);
  const tenantId = patientTreatmentPlanTenantIdSchema.safeParse(params.tenantId);
  const planId = patientTreatmentPlanIdSchema.safeParse(params.patientTreatmentPlanId);
  const sessionId = patientTreatmentPlanSessionIdSchema.safeParse(
    params.patientTreatmentPlanSessionId
  );
  const errors: string[] = [];

  if (!patientId.success) errors.push(`Patient ${String(params.patientId)} is Invalid.`);
  if (!tenantId.success) errors.push(...tenantId.error.issues.map((issue) => issue.message));
  if (!planId.success) {
    errors.push(`Patient Treatment Plan ${String(params.patientTreatmentPlanId)} is Invalid.`);
  }
  if (!sessionId.success) {
    errors.push(
      `Patient Treatment Plan Session ${String(params.patientTreatmentPlanSessionId)} is Invalid.`
    );
  }

  if (!patientId.success || !tenantId.success || !planId.success || !sessionId.success) {
    return { success: false as const, errors };
  }

  return {
    success: true as const,
    data: {
      patientId: patientId.data,
      tenantId: tenantId.data,
      patientTreatmentPlanId: planId.data,
      patientTreatmentPlanSessionId: sessionId.data,
    },
  };
}

async function findPendingSession(
  target: Exclude<ReturnType<typeof parseTarget>, { success: false }>['data']
): Promise<ValidationResult<PendingSessionContext>> {
  const patient = await patientRepository.getPatientById(target.patientId, target.tenantId);

  if (!patient) {
    return { success: false, status: StatusCodes.NOT_FOUND, errors: ['Patient not found'] };
  }

  const plans = await patientTreatmentPlanRepository.getCurrentByPatientId(
    target.patientId,
    target.tenantId
  );
  const plan = plans.find((candidate) => candidate.id === target.patientTreatmentPlanId);

  if (!plan) {
    return {
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient Treatment Plan not found'],
    };
  }

  const session = plan.sessions.find(
    (candidate) => candidate.id === target.patientTreatmentPlanSessionId
  );

  if (!session) {
    return {
      success: false,
      status: StatusCodes.NOT_FOUND,
      errors: ['Patient Treatment Plan Session not found'],
    };
  }

  if (session.completionStatus === 'COMPLETED') {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: [`Session ${session.sessionNumber} is already completed.`],
    };
  }

  return {
    success: true,
    data: { patientId: target.patientId, tenantId: target.tenantId, plan, session },
  };
}

export async function validateUpdatePatientTreatmentPlanSession(
  params: SessionTargetParams,
  payload: unknown
): Promise<ValidationResult<UpdatePatientTreatmentPlanSessionInput>> {
  const target = parseTarget(params);
  const payloadResult = updatePatientTreatmentPlanSessionSchema.safeParse(payload);

  if (!target.success || !payloadResult.success) {
    return {
      success: false,
      errors: [
        ...(target.success ? [] : target.errors),
        ...(payloadResult.success ? [] : payloadResult.error.issues.map((issue) => issue.message)),
      ],
    };
  }

  const pending = await findPendingSession(target.data);

  if (!pending.success) return pending;

  // The plan is frozen once delivery starts so it cannot change mid-treatment.
  const { session } = pending.data;

  if (session.startedVisitId !== null) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      errors: [`Session ${session.sessionNumber} is in progress and cannot be edited.`],
    };
  }

  return { success: true, data: { ...target.data, plan: payloadResult.data } };
}

export async function validateStartPatientTreatmentPlanSession(
  params: SessionTargetParams,
  payload: unknown
): Promise<ValidationResult<StartPatientTreatmentPlanSessionInput>> {
  const target = parseTarget(params);
  const payloadResult = startPatientTreatmentPlanSessionSchema.safeParse(payload);

  if (!target.success || !payloadResult.success) {
    return {
      success: false,
      errors: [
        ...(target.success ? [] : target.errors),
        ...(payloadResult.success ? [] : payloadResult.error.issues.map((issue) => issue.message)),
      ],
    };
  }

  const pending = await findPendingSession(target.data);

  if (!pending.success) return pending;

  const { plan, session } = pending.data;
  const { visitId } = payloadResult.data;
  const visit = await visitRepository.getVisitById(visitId, target.data.tenantId);

  if (!visit || visit.patient.id !== target.data.patientId) {
    return { success: false, status: StatusCodes.NOT_FOUND, errors: ['Visit not found'] };
  }

  const conflict = (message: string): ValidationResult<StartPatientTreatmentPlanSessionInput> => ({
    success: false,
    status: StatusCodes.CONFLICT,
    errors: [message],
  });

  if (visit.status !== 'CHECKED_IN' && visit.status !== 'IN_CONSULTATION') {
    return conflict('Visit must be Checked In or In Consultation to start a Session.');
  }

  if (session.startedVisitId !== null) {
    return conflict(`Session ${session.sessionNumber} is already in progress.`);
  }

  const visitBookingNumber = visit.appointment?.bookingNumber ?? null;
  const reservedBookingNumber = session.reservedAppointment?.bookingNumber ?? null;

  if (reservedBookingNumber !== null && reservedBookingNumber !== visitBookingNumber) {
    return conflict(
      `Session ${session.sessionNumber} is booked for Appointment ${reservedBookingNumber}.`
    );
  }

  // One Visit delivers one Session of a Plan: either the one it started or the one it booked.
  const deliveredInVisit = plan.sessions.find(
    (candidate) =>
      candidate.id !== session.id &&
      (candidate.startedVisitId === visitId ||
        candidate.completedVisitId === visitId ||
        (candidate.completionStatus === 'PENDING' &&
          visitBookingNumber !== null &&
          candidate.reservedAppointment?.bookingNumber === visitBookingNumber))
  );

  if (deliveredInVisit) {
    return conflict(
      `This Visit already has Session ${deliveredInVisit.sessionNumber} of this Patient Treatment Plan.`
    );
  }

  return { success: true, data: { ...target.data, visitId } };
}
