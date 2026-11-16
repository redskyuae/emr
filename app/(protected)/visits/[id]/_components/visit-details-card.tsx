'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { useUpdateVisit } from '@/app/queries/visits/useUpdateVisit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Field, FieldLabel } from '@/components/ui/field';
import { RichTextEditor } from '@/components/clinical/rich-text-editor';

import { isActiveVisit, visitStatusPresentation } from '../../_utils/visit-status';

/**
 * Handover Remarks on the Visit. The purpose of visit recorded at check-in seeds the
 * consultation's Chief complaint, so it is not repeated here.
 */
export function VisitDetailsCard({
  visit,
  embedded = false,
}: {
  visit: Visit;
  embedded?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const { data: canUpdate } = useHasPermission('visit:update');
  const updateMutation = useUpdateVisit();
  const active = isActiveVisit(visit.status);
  const canEdit = active && canUpdate;
  const remarks = draft ?? visit.remarks ?? '';
  const isDirty = remarks !== (visit.remarks ?? '');

  async function save() {
    try {
      await updateMutation.mutateAsync({
        id: visit.id,
        request: { remarks: remarks || undefined },
      });
      setDraft(null);
      toast.success('Visit updated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card
      className={cn(
        'shadow-fluent-2 gap-4',
        embedded &&
          'gap-0 overflow-visible rounded-none border-0 bg-transparent py-0 shadow-none ring-0'
      )}
    >
      {embedded ? null : (
        <CardHeader>
          <CardTitle className="text-base">Visit details</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn('space-y-4', embedded && 'px-0')}>
        <Field>
          <FieldLabel htmlFor="visit-remarks">Remarks</FieldLabel>
          <RichTextEditor
            id="visit-remarks"
            aria-label="Remarks"
            placeholder="Anything the next person should know"
            disabled={!canEdit}
            value={remarks}
            onChange={setDraft}
          />
        </Field>
        {canEdit ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || updateMutation.isPending}
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
