'use client';

import { useState } from 'react';
import { CiFloppyDisk } from 'react-icons/ci';
import { toast } from 'sonner';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useTreatmentsQuery } from '@/app/queries/treatments/useTreatments';
import { useUpdateVisit } from '@/app/queries/visits/useUpdateVisit';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';

import { isActiveVisit } from '../../_utils/visit-status';

type SessionDraft = { treatmentId: string; treatmentSessionId: string };

/**
 * The Treatment and Session this Visit delivers. A Procedure Appointment sets them at
 * check-in; the Doctor can attach or correct them here while the Visit is active.
 */
export function VisitTreatmentSessionCard({ visit }: { visit: Visit }) {
  const [draft, setDraft] = useState<SessionDraft | null>(null);
  const { data: canUpdate } = useHasPermission('visit:update');
  const canEdit = isActiveVisit(visit.status) && Boolean(canUpdate);
  const treatmentsQuery = useTreatmentsQuery({ page: 1, limit: 999 }, { enabled: canEdit });
  const updateMutation = useUpdateVisit();

  const saved = {
    treatmentId: visit.treatment ? String(visit.treatment.id) : '',
    treatmentSessionId: visit.treatmentSession ? String(visit.treatmentSession.id) : '',
  };
  const { treatmentId, treatmentSessionId } = draft ?? saved;
  const treatments = treatmentsQuery.data?.data ?? [];
  const selectedTreatment = treatments.find((item) => String(item.id) === treatmentId);
  const isDirty =
    treatmentId !== saved.treatmentId || treatmentSessionId !== saved.treatmentSessionId;

  // A closed Visit, or one this user cannot edit, has nothing to choose here: the
  // Session itself is shown below when there is one.
  if (!canEdit) return null;

  async function save() {
    try {
      await updateMutation.mutateAsync({
        id: visit.id,
        request: {
          treatmentId: treatmentId ? Number(treatmentId) : null,
          treatmentSessionId: treatmentSessionId ? Number(treatmentSessionId) : null,
        },
      });
      setDraft(null);
      toast.success('Visit updated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <section aria-labelledby="visit-treatment-session" className="space-y-4 rounded-lg border p-4">
      <h3 id="visit-treatment-session" className="text-base font-semibold">
        Treatment &amp; Session
      </h3>
      {treatmentsQuery.isError ? (
        <div className="flex flex-wrap items-center gap-2" role="alert">
          <p className="text-destructive text-sm">Treatments could not be loaded.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void treatmentsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="visit-treatment">Treatment</FieldLabel>
          <SkeletonCrossfade
            isLoading={treatmentsQuery.isLoading}
            skeleton={<Skeleton className="h-10 w-full" aria-label="Loading Treatments" />}
          >
            <NativeSelect
              id="visit-treatment"
              className="w-full"
              value={treatmentId}
              onChange={(event) =>
                setDraft({ treatmentId: event.target.value, treatmentSessionId: '' })
              }
            >
              <NativeSelectOption value="">No Treatment</NativeSelectOption>
              {treatments.map((treatment) => (
                <NativeSelectOption key={treatment.id} value={String(treatment.id)}>
                  {treatment.name} · {treatment.code}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </SkeletonCrossfade>
        </Field>
        <Field>
          <FieldLabel htmlFor="visit-session">Session</FieldLabel>
          <SkeletonCrossfade
            isLoading={treatmentsQuery.isLoading}
            skeleton={<Skeleton className="h-10 w-full" aria-label="Loading Sessions" />}
          >
            <NativeSelect
              id="visit-session"
              className="w-full"
              value={treatmentSessionId}
              disabled={!selectedTreatment}
              onChange={(event) =>
                setDraft({ treatmentId, treatmentSessionId: event.target.value })
              }
            >
              <NativeSelectOption value="">No Session</NativeSelectOption>
              {(selectedTreatment?.sessions ?? []).map((session) => (
                <NativeSelectOption key={session.id} value={String(session.id)}>
                  {session.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </SkeletonCrossfade>
        </Field>
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={
            !isDirty ||
            updateMutation.isPending ||
            treatmentsQuery.isLoading ||
            treatmentsQuery.isError ||
            Boolean(treatmentId) !== Boolean(treatmentSessionId)
          }
          onClick={() => void save()}
        >
          <CiFloppyDisk className="size-4" />
          {updateMutation.isPending ? 'Saving…' : 'Save Treatment'}
        </Button>
      </div>
    </section>
  );
}
