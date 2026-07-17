'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import type { Admission } from '@/app/api/lib/modules/admission/schemas/admission-schema';
import type { DischargeDisposition } from '@/app/api/lib/modules/admission/schemas/admission-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDischargeAdmission } from '@/app/queries/admissions/useDischargeAdmission';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DISCHARGE_DISPOSITION_OPTIONS } from '../../_utils/admission-status';

export function DischargeDialog({
  admission,
  onClose,
}: {
  admission: Admission | null;
  onClose: () => void;
}) {
  return (
    <AlertDialog open={admission !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        {/* Keyed on the Admission so the form starts empty for each stay,
            without an effect resetting state after render. */}
        {admission ? (
          <DischargeForm key={admission.id} admission={admission} onClose={onClose} />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DischargeForm({ admission, onClose }: { admission: Admission; onClose: () => void }) {
  const [disposition, setDisposition] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dischargeMutation = useDischargeAdmission();

  async function handleConfirm() {
    if (!disposition) {
      setError('Discharge disposition is required.');
      return;
    }

    try {
      await dischargeMutation.mutateAsync({
        id: admission.id,
        request: {
          dischargeDisposition: disposition as DischargeDisposition,
          dischargeSummary: summary.trim() || undefined,
        },
      });
      toast.success(`${admission.admissionNumber} discharged.`);
      onClose();
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError));
    }
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Discharge {admission.admissionNumber}?</AlertDialogTitle>
        <AlertDialogDescription>
          {admission.patient.firstName} {admission.patient.lastName} leaves bed{' '}
          {admission.bed.bedNumber}, which becomes Available. A discharged Admission can no longer
          be edited.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="space-y-3">
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="discharge-disposition">
            Disposition{' '}
            <span aria-hidden className="text-destructive">
              *
            </span>
          </FieldLabel>
          <Select
            value={disposition}
            onValueChange={(value) => {
              setDisposition(value);
              setError(null);
            }}
          >
            <SelectTrigger id="discharge-disposition" aria-required className="w-full">
              <SelectValue placeholder="Select a disposition" />
            </SelectTrigger>
            <SelectContent>
              {DISCHARGE_DISPOSITION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="discharge-summary">Discharge summary</FieldLabel>
          <Textarea
            id="discharge-summary"
            rows={4}
            value={summary}
            placeholder="Course of the admission, condition at discharge, follow-up plan…"
            onChange={(event) => setSummary(event.target.value)}
          />
        </Field>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={dischargeMutation.isPending}>Keep admitted</AlertDialogCancel>
        <Button
          type="button"
          disabled={dischargeMutation.isPending}
          onClick={() => void handleConfirm()}
        >
          {dischargeMutation.isPending ? 'Discharging…' : 'Discharge'}
        </Button>
      </AlertDialogFooter>
    </>
  );
}
