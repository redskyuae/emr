'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import type { Admission } from '@/app/api/lib/modules/admission/schemas/admission-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useTransferBed } from '@/app/queries/admissions/useTransferBed';
import { useBedsQuery } from '@/app/queries/inpatient-masters/beds/useBeds';
import { useWardsQuery } from '@/app/queries/inpatient-masters/wards/useWards';
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
import { getBedStatusLabel } from '@/app/(protected)/inpatient-masters/beds/_utils/bed-status';

export function TransferBedDialog({
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
          <TransferBedForm key={admission.id} admission={admission} onClose={onClose} />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TransferBedForm({ admission, onClose }: { admission: Admission; onClose: () => void }) {
  const [wardId, setWardId] = useState(String(admission.ward.id));
  const [bedId, setBedId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const transferMutation = useTransferBed();

  const wardsQuery = useWardsQuery({ page: 1, limit: 999 });
  const bedsQuery = useBedsQuery({
    page: 1,
    limit: 999,
    wardId: wardId ? Number(wardId) : undefined,
  });

  const wards = wardsQuery.data?.data ?? [];
  // Only free Beds are offered, and never the current one.
  const beds = (bedsQuery.data?.data ?? []).filter(
    (bed) =>
      (bed.status === 'AVAILABLE' || bed.status === 'RESERVED') && bed.id !== admission.bed.id
  );

  async function handleConfirm() {
    if (!bedId) {
      setError('Target Bed is required.');
      return;
    }

    try {
      const result = await transferMutation.mutateAsync({
        id: admission.id,
        request: { toBedId: Number(bedId), reason: reason.trim() || undefined },
      });
      toast.success(`${admission.admissionNumber} moved to ${result.data.bed.bedNumber}.`);
      onClose();
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError));
    }
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Transfer {admission.admissionNumber}</AlertDialogTitle>
        <AlertDialogDescription>
          Move {admission.patient.firstName} {admission.patient.lastName} from bed{' '}
          {admission.bed.bedNumber}. The current Bed becomes Available and the movement is recorded
          in the Bed history.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="space-y-3">
        <Field>
          <FieldLabel htmlFor="transfer-ward">Ward</FieldLabel>
          <Select
            value={wardId}
            onValueChange={(value) => {
              setWardId(value);
              setBedId('');
            }}
          >
            <SelectTrigger id="transfer-ward" className="w-full">
              <SelectValue placeholder="Select a Ward" />
            </SelectTrigger>
            <SelectContent>
              {wards.map((ward) => (
                <SelectItem key={ward.id} value={String(ward.id)}>
                  {ward.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="transfer-bed">
            Target Bed{' '}
            <span aria-hidden className="text-destructive">
              *
            </span>
          </FieldLabel>
          <Select
            value={bedId}
            onValueChange={(value) => {
              setBedId(value);
              setError(null);
            }}
          >
            <SelectTrigger id="transfer-bed" aria-required className="w-full">
              <SelectValue placeholder="Select a Bed" />
            </SelectTrigger>
            <SelectContent>
              {beds.map((bed) => (
                <SelectItem key={bed.id} value={String(bed.id)}>
                  {bed.bedNumber} · {getBedStatusLabel(bed.status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {beds.length === 0 && !bedsQuery.isLoading ? (
            <p className="text-muted-foreground text-xs">No free Beds in this Ward.</p>
          ) : null}
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="transfer-reason">Reason</FieldLabel>
          <Textarea
            id="transfer-reason"
            rows={2}
            value={reason}
            placeholder="Closer to the nursing station"
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={transferMutation.isPending}>Cancel</AlertDialogCancel>
        <Button
          type="button"
          disabled={transferMutation.isPending}
          onClick={() => void handleConfirm()}
        >
          {transferMutation.isPending ? 'Transferring…' : 'Transfer'}
        </Button>
      </AlertDialogFooter>
    </>
  );
}
