'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import type { Admission } from '@/app/api/lib/modules/admission/schemas/admission-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useCancelAdmission } from '@/app/queries/admissions/useCancelAdmission';
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

export function CancelAdmissionDialog({
  admission,
  onClose,
}: {
  admission: Admission | null;
  onClose: () => void;
}) {
  return (
    <AlertDialog open={admission !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        {admission ? (
          <CancelAdmissionForm key={admission.id} admission={admission} onClose={onClose} />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CancelAdmissionForm({
  admission,
  onClose,
}: {
  admission: Admission;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const cancelMutation = useCancelAdmission();

  async function handleConfirm() {
    if (reason.trim().length === 0) {
      setError('Cancellation reason is required.');
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        id: admission.id,
        request: { cancellationReason: reason.trim() },
      });
      toast.success(`${admission.admissionNumber} cancelled.`);
      onClose();
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError));
    }
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Cancel {admission.admissionNumber}?</AlertDialogTitle>
        <AlertDialogDescription>
          Cancelling records that this Admission was a mistake or that the Patient left before care.
          Bed {admission.bed.bedNumber} becomes Available.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="admission-cancellation-reason">
          Reason{' '}
          <span aria-hidden className="text-destructive">
            *
          </span>
        </FieldLabel>
        <Textarea
          id="admission-cancellation-reason"
          aria-required
          rows={3}
          value={reason}
          placeholder="Admitted in error"
          onChange={(event) => {
            setReason(event.target.value);
            setError(null);
          }}
        />
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={cancelMutation.isPending}>Keep Admission</AlertDialogCancel>
        <Button
          type="button"
          variant="destructive"
          disabled={cancelMutation.isPending}
          onClick={() => void handleConfirm()}
        >
          {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Admission'}
        </Button>
      </AlertDialogFooter>
    </>
  );
}
