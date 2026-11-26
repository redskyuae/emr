'use client';

import { useState } from 'react';

import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useSaveVisitDiagnoses } from '@/app/queries/visits/useSaveVisitDiagnoses';
import { useVisitDiagnosesQuery } from '@/app/queries/visits/useVisitDiagnoses';

import {
  sameDiagnoses,
  toDiagnosisDrafts,
  toSaveVisitDiagnosesRequest,
  type DiagnosisDraft,
} from '../_utils/visit-diagnoses';

/** `edit` for an Active Visit, `amend` for a Completed one, otherwise read-only. */
type VisitDiagnosesMode = 'edit' | 'amend' | 'read';

/**
 * The Visit's coded diagnoses and the codes chosen but not saved yet. It lives with the Visit
 * rather than the Diagnosis step, so the choices survive the step being redrawn (signing the
 * consultation does that), and so the consultation's Save draft / Save and sign and the
 * complete dialog can see and save them.
 */
export function useVisitDiagnosesDraft(visitId: number, mode: VisitDiagnosesMode) {
  const { data: canRead, isLoading: permissionLoading } = useHasPermission('visit-diagnosis:read');
  const query = useVisitDiagnosesQuery(visitId, { enabled: canRead });
  const saveMutation = useSaveVisitDiagnoses();
  // A draft belongs to the mode it was made in: a Visit that completes while codes are
  // chosen does not carry them over into an amendment.
  const [pending, setPending] = useState<{ mode: VisitDiagnosesMode; rows: DiagnosisDraft[] }>();
  const saved = toDiagnosisDrafts(query.data ?? []);
  const draft = mode !== 'read' && pending?.mode === mode ? pending.rows : null;
  const drafts = draft ?? saved;
  const dirty = draft !== null && !sameDiagnoses(draft, saved);

  function change(next: (current: DiagnosisDraft[]) => DiagnosisDraft[]) {
    setPending((current) => ({
      mode,
      rows: next(current?.mode === mode ? current.rows : saved),
    }));
  }

  function discard() {
    setPending(undefined);
  }

  async function save() {
    await saveMutation.mutateAsync({
      visitId,
      amend: mode === 'amend',
      request: toSaveVisitDiagnosesRequest(drafts),
    });
    setPending(undefined);
  }

  return {
    mode,
    save,
    dirty,
    drafts,
    change,
    discard,
    canRead: Boolean(canRead),
    loading: permissionLoading || query.isLoading,
    saving: saveMutation.isPending,
    loadFailed: query.isError,
    retry: () => void query.refetch(),
  };
}

export type VisitDiagnosesDraft = ReturnType<typeof useVisitDiagnosesDraft>;
