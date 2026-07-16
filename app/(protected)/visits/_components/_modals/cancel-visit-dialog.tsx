'use client';

import { useState } from 'react';
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
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

export function CancelVisitDialog({
  visit,
  onClose,
}: {
  visit: Visit | null;
  onClose: () => void;
}) {
  return (
    <AlertDialog open={visit !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        {/* Keyed on the Visit so the reason field starts empty for each Visit,
            without an effect resetting state after render. */}
        {visit ? <CancelVisitForm key={visit.id} visit={visit} onClose={onClose} /> : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CancelVisitForm({ visit, onClose }: { visit: Visit; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const cancelMutation = useCancelVisit();

  async function handleConfirm() {
    if (reason.trim().length === 0) {
      setError('Cancellation reason is required.');
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: visit.id,
        request: { cancellationReason: reason.trim() },
      });
      toast.success(`${visit.visitNumber} cancelled.`);
      onClose();
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError));
    }
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Cancel {visit.visitNumber}?</AlertDialogTitle>
        <AlertDialogDescription>
          {visit.appointment
            ? 'The Appointment returns to Scheduled so the Patient can be checked in again. The Queue Token is not reused.'
            : 'The Visit is cancelled and its Queue Token is not reused.'}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="cancellation-reason">
          Reason{' '}
          <span aria-hidden className="text-destructive">
            *
          </span>
        </FieldLabel>
        <Textarea
          id="cancellation-reason"
          aria-required
          rows={3}
          value={reason}
          placeholder="Patient left before consultation"
          onChange={(event) => {
            setReason(event.target.value);
            setError(null);
          }}
        />
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={cancelMutation.isPending}>Keep Visit</AlertDialogCancel>
        <Button
          type="button"
          variant="destructive"
          disabled={cancelMutation.isPending}
          onClick={() => void handleConfirm()}
        >
          {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Visit'}
        </Button>
      </AlertDialogFooter>
    </>
  );
}
