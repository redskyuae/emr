'use client';

import { TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useCompleteVisit } from '@/app/queries/visits/useCompleteVisit';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

export function CompleteVisitDialog({
  visit,
  open,
  outstanding,
  onClose,
}: {
  visit: Visit;
  open: boolean;
  outstanding: string[];
  onClose: () => void;
}) {
  const completeMutation = useCompleteVisit();

  async function handleConfirm() {
    try {
      await completeMutation.mutateAsync(visit.id);
      toast.success(`${visit.visitNumber} completed.`);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete {visit.visitNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            {visit.patient.firstName} {visit.patient.lastName} leaves the queue and this Visit can
            no longer be edited.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {outstanding.length > 0 ? (
          <Alert>
            <TriangleAlert className="text-warning size-4" />
            <AlertTitle>Still open on this Visit</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {outstanding.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={completeMutation.isPending}>
            Keep Visit open
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={completeMutation.isPending}
            aria-busy={completeMutation.isPending}
            onClick={() => void handleConfirm()}
          >
            {completeMutation.isPending ? 'Completing Visit…' : 'Complete Visit'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
