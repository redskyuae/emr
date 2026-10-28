'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useTreatmentsQuery } from '@/app/queries/treatments/useTreatments';
import { useUpdateVisit } from '@/app/queries/visits/useUpdateVisit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { RichTextEditor } from '@/components/clinical/rich-text-editor';

import { isActiveVisit, visitStatusPresentation } from '../../_utils/visit-status';

type DetailsDraft = {
  remarks: string;
  treatmentId: string;
  chiefComplaint: string;
  treatmentSessionId: string;
};

export function VisitDetailsCard({ visit }: { visit: Visit }) {
  const [draft, setDraft] = useState<DetailsDraft | null>(null);
  const { data: canUpdate } = useHasPermission('visit:update');
  const treatmentsQuery = useTreatmentsQuery({ page: 1, limit: 999 });
  const updateMutation = useUpdateVisit();
  const active = isActiveVisit(visit.status);
  const canEdit = active && canUpdate;
  const details = draft ?? {
    remarks: visit.remarks ?? '',
    treatmentId: visit.treatment ? String(visit.treatment.id) : '',
    chiefComplaint: visit.chiefComplaint ?? '',
    treatmentSessionId: visit.treatmentSession ? String(visit.treatmentSession.id) : '',
  };
  const { remarks, treatmentId, chiefComplaint, treatmentSessionId } = details;
  const treatments = treatmentsQuery.data?.data ?? [];
  const selectedTreatment = treatments.find((item) => String(item.id) === treatmentId);
  const selectedSession = selectedTreatment?.sessions.find(
    (item) => String(item.id) === treatmentSessionId
  );
  const isDirty =
    chiefComplaint !== (visit.chiefComplaint ?? '') ||
    remarks !== (visit.remarks ?? '') ||
    treatmentId !== (visit.treatment ? String(visit.treatment.id) : '') ||
    treatmentSessionId !== (visit.treatmentSession ? String(visit.treatmentSession.id) : '');

  async function save() {
    const treatmentDirty =
      treatmentId !== (visit.treatment ? String(visit.treatment.id) : '') ||
      treatmentSessionId !== (visit.treatmentSession ? String(visit.treatmentSession.id) : '');

    try {
      await updateMutation.mutateAsync({
        id: visit.id,
        request: {
          chiefComplaint: chiefComplaint || undefined,
          remarks: remarks || undefined,
          ...(treatmentDirty
            ? {
                treatmentId: treatmentId ? Number(treatmentId) : null,
                treatmentSessionId: treatmentSessionId ? Number(treatmentSessionId) : null,
              }
            : {}),
        },
      });
      setDraft(null);
      toast.success('Visit updated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card className="shadow-fluent-2 gap-4">
      <CardHeader>
        <CardTitle className="text-base">Visit details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="visit-chief-complaint">Purpose of visit</FieldLabel>
            <RichTextEditor
              id="visit-chief-complaint"
              aria-label="Purpose of visit"
              placeholder="Why is the Patient here today?"
              disabled={!canEdit}
              value={chiefComplaint}
              onChange={(value) => setDraft({ ...details, chiefComplaint: value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="visit-remarks">Remarks</FieldLabel>
            <RichTextEditor
              id="visit-remarks"
              aria-label="Remarks"
              placeholder="Anything the next person should know"
              disabled={!canEdit}
              value={remarks}
              onChange={(value) => setDraft({ ...details, remarks: value })}
            />
          </Field>
        </div>
        {canEdit && treatmentsQuery.isError ? (
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
        {(visit.treatment || canEdit) && (
          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="visit-treatment">Treatment</FieldLabel>
              {canEdit && treatmentsQuery.isLoading ? (
                <Skeleton className="h-10 w-full" aria-label="Loading Treatments" />
              ) : canEdit ? (
                <NativeSelect
                  id="visit-treatment"
                  className="w-full"
                  value={treatmentId}
                  onChange={(event) =>
                    setDraft({
                      ...details,
                      treatmentId: event.target.value,
                      treatmentSessionId: '',
                    })
                  }
                >
                  <NativeSelectOption value="">No Treatment</NativeSelectOption>
                  {treatments.map((treatment) => (
                    <NativeSelectOption key={treatment.id} value={String(treatment.id)}>
                      {treatment.name} · {treatment.code}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : (
                <p className="text-sm">{visit.treatment?.name ?? 'No Treatment'}</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="visit-session">Session</FieldLabel>
              {canEdit && treatmentsQuery.isLoading ? (
                <Skeleton className="h-10 w-full" aria-label="Loading Sessions" />
              ) : canEdit ? (
                <NativeSelect
                  id="visit-session"
                  className="w-full"
                  value={treatmentSessionId}
                  disabled={!selectedTreatment}
                  onChange={(event) =>
                    setDraft({ ...details, treatmentSessionId: event.target.value })
                  }
                >
                  <NativeSelectOption value="">No Session</NativeSelectOption>
                  {(selectedTreatment?.sessions ?? []).map((session) => (
                    <NativeSelectOption key={session.id} value={String(session.id)}>
                      {session.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : (
                <p className="text-sm">{visit.treatmentSession?.label ?? 'No Session'}</p>
              )}
            </Field>
          </div>
        )}
        {selectedSession ? (
          <p className="text-muted-foreground text-xs">
            {selectedSession.procedure}
            {selectedSession.durationMinutes ? ` · ${selectedSession.durationMinutes} min` : ''}
          </p>
        ) : null}
        {canEdit ? (
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
              <Save className="size-4" />
              {updateMutation.isPending ? 'Saving…' : 'Save details'}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {active
              ? 'You do not have permission to edit this Visit.'
              : `This Visit is ${visitStatusPresentation(visit.status).label.toLowerCase()} and can no longer be edited.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
