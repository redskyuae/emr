'use client';

import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useCancelVisit } from '@/app/queries/visits/useCancelVisit';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

type CancelVisitDialogProps = {
  visit: Visit | null;
  onClose: () => void;
  onCancelled?: (visitId: number) => void;
};

export function CancelVisitDialog({ visit, onClose, onCancelled }: CancelVisitDialogProps) {
  const cancelMutation = useCancelVisit();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [syncedVisitId, setSyncedVisitId] = useState<number | null>(null);

  // Reset the form when a different Visit is opened, adjusting state during
  // render rather than in an effect (the documented React pattern for this).
  if (visit && visit.id !== syncedVisitId) {
    setSyncedVisitId(visit.id);
    setReason('');
    setError(null);
  }

  async function handleConfirmCancel() {
    if (!visit) {
      return;
    }

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setError('Visit cancelled reason cannot be empty');
      return;
    }

    try {
      await cancelMutation.mutateAsync({ id: visit.id, request: { cancelledReason: trimmedReason } });
      toast.success('Visit cancelled.');
      onCancelled?.(visit.id);
      onClose();
    } catch (cancelError) {
      toast.error(getApiErrorMessage(cancelError));
    }
  }

  return (
    <AlertDialog open={visit !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <XCircle />
          </AlertDialogMedia>
          <AlertDialogTitle>Cancel Visit?</AlertDialogTitle>
          <AlertDialogDescription>
            {visit ? (
              <>
                Cancel Visit <strong>{visit.visitNumber}</strong> for{' '}
                <strong>{visit.patient.name}</strong>? Please provide a reason.
              </>
            ) : (
              'This Visit will be cancelled.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Field data-invalid={error !== null}>
          <FieldLabel htmlFor="cancel-visit-reason">
            Reason{' '}
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
          </FieldLabel>
          <Textarea
            id="cancel-visit-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError(null);
            }}
            rows={3}
            placeholder="e.g. Patient left before consultation"
            aria-required="true"
            aria-invalid={error !== null}
            disabled={cancelMutation.isPending}
          />
          <FieldError errors={error ? [{ message: error }] : []} />
        </Field>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelMutation.isPending}>Keep Visit</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={cancelMutation.isPending}
            aria-busy={cancelMutation.isPending}
            onClick={() => void handleConfirmCancel()}
          >
            Cancel Visit
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
