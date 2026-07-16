import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { clinicalNoteRepository } from '../../clinical-note/repository/clinical-note-repository';
import { patientAllergyRepository } from '../../patient-allergy/repository/patient-allergy-repository';
import { patientMedicationRepository } from '../../patient-medication/repository/patient-medication-repository';
import { patientProblemRepository } from '../../patient-problem/repository/patient-problem-repository';
import { patientVitalSignRepository } from '../../patient-vital-sign/repository/patient-vital-sign-repository';
import type { PatientChart } from '../schemas/patient-chart-schema';
import { validateGetPatientChart } from '../validator/get-patient-chart-validator';

// A single chart load returns each record collection's most-recent slice; the
// per-record endpoints remain the source of truth for pagination and writes.
const CHART_SLICE_LIMIT = 100;

// Allergies drive the safety-critical allergy banner, which must surface every
// active allergy — so they are never truncated by the generic slice cap.
const ALLERGY_SLICE_LIMIT = 1000;

export async function getPatientChartQuery(
  patientId: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<PatientChart>> {
  const validationResult = await validateGetPatientChart(patientId, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors, status: validationResult.status };
  }

  const params = {
    tenantId: validationResult.data.tenantId,
    patientId: validationResult.data.patientId,
    page: 1,
    limit: CHART_SLICE_LIMIT,
  };

  const [allergies, problems, vitalSigns, medications, clinicalNotes] = await Promise.all([
    patientAllergyRepository.getPatientAllergies({ ...params, limit: ALLERGY_SLICE_LIMIT }),
    patientProblemRepository.getPatientProblems(params),
    patientVitalSignRepository.getPatientVitalSigns(params),
    patientMedicationRepository.getPatientMedications(params),
    clinicalNoteRepository.getClinicalNotes(params),
  ]);

  return {
    success: true,
    data: {
      allergies: allergies.data,
      problems: problems.data,
      vitalSigns: vitalSigns.data,
      medications: medications.data,
      clinicalNotes: clinicalNotes.data,
    },
  };
}
