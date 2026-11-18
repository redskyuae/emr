'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import type { ClinicalNote } from '@/app/api/lib/modules/clinical-note/schemas/clinical-note-schema';
import type { PatientAllergy } from '@/app/api/lib/modules/patient-allergy/schemas/patient-allergy-schema';
import type { PatientMedication } from '@/app/api/lib/modules/patient-medication/schemas/patient-medication-schema';
import type { PatientProblem } from '@/app/api/lib/modules/patient-problem/schemas/patient-problem-schema';
import type { PatientVitalSign } from '@/app/api/lib/modules/patient-vital-sign/schemas/patient-vital-sign-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { usePatientChartQuery } from '@/app/queries/patients/chart/usePatientChart';
import { useDeleteClinicalNote } from '@/app/queries/patients/chart/useDeleteClinicalNote';
import { useDeletePatientAllergy } from '@/app/queries/patients/chart/useDeletePatientAllergy';
import { useDeletePatientMedication } from '@/app/queries/patients/chart/useDeletePatientMedication';
import { useDeletePatientProblem } from '@/app/queries/patients/chart/useDeletePatientProblem';
import { useDeletePatientVitalSign } from '@/app/queries/patients/chart/useDeletePatientVitalSign';
import { useSignClinicalNote } from '@/app/queries/patients/chart/useSignClinicalNote';
import { useAllergensQuery } from '@/app/queries/clinical-masters/allergens/useAllergens';
import { useDiagnosisCodesQuery } from '@/app/queries/clinical-masters/diagnosis-codes/useDiagnosisCodes';
import { useClinicalNoteTypesQuery } from '@/app/queries/clinical-masters/note-types/useClinicalNoteTypes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

import { AllergyBanner } from './allergy-banner';
import { AllergyPanel } from './allergy-panel';
import { ClinicalNotesPanel } from './clinical-notes-panel';
import { MedicationsPanel } from './medications-panel';
import { ProblemListPanel } from './problem-list-panel';
import { VitalsPanel } from './vitals-panel';
import { AllergyFormSheet } from './_sheets/allergy-form-sheet';
import { ClinicalNoteFormSheet } from './_sheets/clinical-note-form-sheet';
import { MedicationFormSheet } from './_sheets/medication-form-sheet';
import { ProblemFormSheet } from './_sheets/problem-form-sheet';
import { VitalsFormSheet } from './_sheets/vitals-form-sheet';
import { DeleteChartRecordDialog } from './_modals/delete-chart-record-dialog';

type Surface = { mode: 'new' | 'edit'; id: number | null } | { mode: null; id: null };

function parseSurfaceParam(param: string | null): Surface {
  if (param === 'new') {
    return { mode: 'new', id: null };
  }
  if (param && /^\d+$/.test(param)) {
    return { mode: 'edit', id: Number(param) };
  }
  return { mode: null, id: null };
}

type PendingDelete =
  | { type: 'allergy'; record: PatientAllergy }
  | { type: 'problem'; record: PatientProblem }
  | { type: 'vital'; record: PatientVitalSign }
  | { type: 'medication'; record: PatientMedication }
  | { type: 'note'; record: ClinicalNote };

function ChartSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading Patient Chart">
      {[0, 1, 2, 3, 4].map((panel) => (
        <div key={panel} className="bg-card shadow-fluent-2 space-y-3 rounded-xl border p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function PatientChartSection({ patientId }: { patientId: number }) {
  const chartQuery = usePatientChartQuery(patientId);
  const allergensQuery = useAllergensQuery({ limit: 200 });
  const diagnosisCodesQuery = useDiagnosisCodesQuery({ limit: 200 });
  const noteTypesQuery = useClinicalNoteTypesQuery({ limit: 200 });

  const [allergyParam, setAllergyParam] = useQueryState('allergy');
  const [problemParam, setProblemParam] = useQueryState('problem');
  const [vitalParam, setVitalParam] = useQueryState('vital');
  const [medicationParam, setMedicationParam] = useQueryState('medication');
  const [noteParam, setNoteParam] = useQueryState('note');

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const deleteAllergy = useDeletePatientAllergy();
  const deleteProblem = useDeletePatientProblem();
  const deleteVital = useDeletePatientVitalSign();
  const deleteMedication = useDeletePatientMedication();
  const deleteNote = useDeleteClinicalNote();
  const signNote = useSignClinicalNote();

  const isDeleting =
    deleteAllergy.isPending ||
    deleteProblem.isPending ||
    deleteVital.isPending ||
    deleteMedication.isPending ||
    deleteNote.isPending;

  if (chartQuery.isLoading) {
    return <ChartSkeleton />;
  }

  if (chartQuery.isError || !chartQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load the Patient Chart</AlertTitle>
        <AlertDescription>{getApiErrorMessage(chartQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  const chart = chartQuery.data;

  const allergenName = (id: number) =>
    allergensQuery.data?.data.find((allergen) => allergen.id === id)?.name ?? 'Allergen';
  const diagnosisCode = (id: number) =>
    diagnosisCodesQuery.data?.data.find((code) => code.id === id)?.code;
  const noteTypeName = (id: number) =>
    noteTypesQuery.data?.data.find((noteType) => noteType.id === id)?.name ?? 'Note';

  const allergySurface = parseSurfaceParam(allergyParam);
  const editingAllergy =
    allergySurface.id !== null
      ? (chart.allergies.find((allergy) => allergy.id === allergySurface.id) ?? null)
      : null;
  const allergySheetOpen = allergySurface.mode === 'new' || editingAllergy !== null;

  const problemSurface = parseSurfaceParam(problemParam);
  const editingProblem =
    problemSurface.id !== null
      ? (chart.problems.find((problem) => problem.id === problemSurface.id) ?? null)
      : null;
  const problemSheetOpen = problemSurface.mode === 'new' || editingProblem !== null;

  const vitalSurface = parseSurfaceParam(vitalParam);
  const editingVital =
    vitalSurface.id !== null
      ? (chart.vitalSigns.find((vital) => vital.id === vitalSurface.id) ?? null)
      : null;
  const vitalSheetOpen = vitalSurface.mode === 'new' || editingVital !== null;

  const medicationSurface = parseSurfaceParam(medicationParam);
  const editingMedication =
    medicationSurface.id !== null
      ? (chart.medications.find((medication) => medication.id === medicationSurface.id) ?? null)
      : null;
  const medicationSheetOpen = medicationSurface.mode === 'new' || editingMedication !== null;

  const noteSurface = parseSurfaceParam(noteParam);
  const editingNote =
    noteSurface.id !== null
      ? (chart.clinicalNotes.find((note) => note.id === noteSurface.id) ?? null)
      : null;
  const noteSheetOpen = noteSurface.mode === 'new' || editingNote !== null;

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    try {
      if (pendingDelete.type === 'allergy') {
        await deleteAllergy.mutateAsync({ patientId, allergyId: pendingDelete.record.id });
      } else if (pendingDelete.type === 'problem') {
        await deleteProblem.mutateAsync({ patientId, problemId: pendingDelete.record.id });
      } else if (pendingDelete.type === 'vital') {
        await deleteVital.mutateAsync({ patientId, vitalId: pendingDelete.record.id });
      } else if (pendingDelete.type === 'medication') {
        await deleteMedication.mutateAsync({ patientId, medicationId: pendingDelete.record.id });
      } else {
        await deleteNote.mutateAsync({ patientId, noteId: pendingDelete.record.id });
      }
      toast.success('Record deleted.');
      setPendingDelete(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleSignNote(note: ClinicalNote) {
    try {
      await signNote.mutateAsync({ patientId, noteId: note.id });
      toast.success('Clinical note signed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const deleteMeta = getDeleteMeta(pendingDelete, allergenName, noteTypeName);

  return (
    <div className="space-y-4">
      <AllergyBanner allergies={chart.allergies} allergenName={allergenName} />

      <AllergyPanel
        allergies={chart.allergies}
        allergenName={allergenName}
        onAdd={() => void setAllergyParam('new')}
        onEdit={(allergy) => void setAllergyParam(String(allergy.id))}
        onDelete={(record) => setPendingDelete({ type: 'allergy', record })}
      />

      <ProblemListPanel
        problems={chart.problems}
        diagnosisCode={diagnosisCode}
        onAdd={() => void setProblemParam('new')}
        onEdit={(problem) => void setProblemParam(String(problem.id))}
        onDelete={(record) => setPendingDelete({ type: 'problem', record })}
      />

      <VitalsPanel
        vitalSigns={chart.vitalSigns}
        onAdd={() => void setVitalParam('new')}
        onEdit={(vital) => void setVitalParam(String(vital.id))}
        onDelete={(record) => setPendingDelete({ type: 'vital', record })}
      />

      <MedicationsPanel
        medications={chart.medications}
        onAdd={() => void setMedicationParam('new')}
        onEdit={(medication) => void setMedicationParam(String(medication.id))}
        onDelete={(record) => setPendingDelete({ type: 'medication', record })}
      />

      <ClinicalNotesPanel
        notes={chart.clinicalNotes}
        noteTypeName={noteTypeName}
        signingNoteId={signNote.isPending ? (signNote.variables?.noteId ?? null) : null}
        onAdd={() => void setNoteParam('new')}
        onEdit={(note) => void setNoteParam(String(note.id))}
        onDelete={(record) => setPendingDelete({ type: 'note', record })}
        onSign={(note) => void handleSignNote(note)}
      />

      <AllergyFormSheet
        open={allergySheetOpen}
        mode={allergySurface.mode === 'new' ? 'new' : 'edit'}
        patientId={patientId}
        allergy={editingAllergy}
        onClose={() => void setAllergyParam(null)}
      />

      <ProblemFormSheet
        open={problemSheetOpen}
        mode={problemSurface.mode === 'new' ? 'new' : 'edit'}
        patientId={patientId}
        problem={editingProblem}
        onClose={() => void setProblemParam(null)}
      />

      <VitalsFormSheet
        open={vitalSheetOpen}
        mode={vitalSurface.mode === 'new' ? 'new' : 'edit'}
        patientId={patientId}
        vitalSign={editingVital}
        onClose={() => void setVitalParam(null)}
      />

      <MedicationFormSheet
        open={medicationSheetOpen}
        mode={medicationSurface.mode === 'new' ? 'new' : 'edit'}
        patientId={patientId}
        medication={editingMedication}
        onClose={() => void setMedicationParam(null)}
      />

      <ClinicalNoteFormSheet
        open={noteSheetOpen}
        mode={noteSurface.mode === 'new' ? 'new' : 'edit'}
        patientId={patientId}
        note={editingNote}
        onClose={() => void setNoteParam(null)}
      />

      <DeleteChartRecordDialog
        open={pendingDelete !== null}
        entityLabel={deleteMeta.entityLabel}
        itemLabel={deleteMeta.itemLabel}
        isPending={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

function getDeleteMeta(
  pending: PendingDelete | null,
  allergenName: (id: number) => string,
  noteTypeName: (id: number) => string
): { entityLabel: string; itemLabel: string | null } {
  if (!pending) {
    return { entityLabel: 'Record', itemLabel: null };
  }
  switch (pending.type) {
    case 'allergy':
      return {
        entityLabel: 'Allergy',
        itemLabel: pending.record.allergenId
          ? allergenName(pending.record.allergenId)
          : (pending.record.substance ?? null),
      };
    case 'problem':
      return { entityLabel: 'Problem', itemLabel: pending.record.title };
    case 'vital':
      return { entityLabel: 'Vital Signs', itemLabel: null };
    case 'medication':
      return { entityLabel: 'Medication', itemLabel: pending.record.drugName };
    case 'note':
      return { entityLabel: 'Clinical Note', itemLabel: noteTypeName(pending.record.noteTypeId) };
  }
}
