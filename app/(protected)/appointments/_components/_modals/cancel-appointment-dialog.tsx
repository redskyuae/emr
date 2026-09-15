'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import {
  cancelAppointmentFormSchema,
  type CancelAppointmentFormInput,
  type CancelAppointmentFormValues,
} from '@/app/(protected)/appointments/_utils/cancel-appointment-form-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentCancelledReasonsQuery } from '@/app/queries/appointment-masters/cancelled-reasons/useAppointmentCancelledReasons';
import { useCancelAppointment } from '@/app/queries/appointments/useCancelAppointment';
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

function appointmentTime(appointment: Appointment) {
  if (appointment.startTime && appointment.endTime) {
    return `${appointment.startTime}–${appointment.endTime}`;
  }

  return appointment.slots.map((slot) => slot.slotTime).join(', ') || 'Not recorded';
}

export function CancelAppointmentDialog({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const form = useForm<CancelAppointmentFormInput, unknown, CancelAppointmentFormValues>({
    mode: 'onTouched',
    defaultValues: { appointmentCancelledReasonId: '' },
    resolver: zodResolver(cancelAppointmentFormSchema),
  });
  const reasonsQuery = useAppointmentCancelledReasonsQuery({ page: 1, limit: 999 });
  const reasons = reasonsQuery.data?.data ?? [];
  const cancelMutation = useCancelAppointment();

  async function confirmCancellation(values: CancelAppointmentFormValues) {
    form.clearErrors('root');

    try {
      await cancelMutation.mutateAsync({
        appointmentId: appointment.id,
        request: values,
      });
      toast.success(`${appointment.bookingNumber} cancelled.`);
      onClose();
    } catch (error) {
      const message = getApiErrorMessage(error);
      form.setError('root', { type: 'server', message });
      toast.error(message);
    }
  }

  const cannotSubmit =
    cancelMutation.isPending ||
    reasonsQuery.isLoading ||
    reasonsQuery.isError ||
    reasons.length === 0;

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !cancelMutation.isPending) onClose();
      }}
    >
      <AlertDialogContent className="shadow-fluent-64">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel {appointment.bookingNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            {appointment.patient.firstName} {appointment.patient.lastName} · MRN{' '}
            {appointment.patient.mrn} · {appointment.slotDate} at {appointmentTime(appointment)}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form className="contents" onSubmit={form.handleSubmit(confirmCancellation)}>
          <Alert>
            <AlertTriangle className="size-4" />
            <AlertTitle>This cancellation cannot be undone here</AlertTitle>
            <AlertDescription>
              The Appointment remains in history.
              {appointment.bookingPath === 'CONSULTATION'
                ? ' Its reserved Doctor Slots will be released.'
                : ''}
            </AlertDescription>
          </Alert>

          {reasonsQuery.isLoading ? (
            <div className="space-y-2" aria-label="Loading Appointment Cancelled Reasons">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : null}

          {reasonsQuery.isError ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Could not load Appointment Cancelled Reasons</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>{getApiErrorMessage(reasonsQuery.error)}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void reasonsQuery.refetch()}
                  >
                    <RefreshCw className="size-4" /> Retry
                  </Button>
                  <Button type="button" size="sm" variant="link" asChild>
                    <Link href="/appointment-masters/cancelled-reasons">
                      Manage Cancelled Reasons
                    </Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}

          {!reasonsQuery.isLoading && !reasonsQuery.isError && reasons.length === 0 ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>No active Appointment Cancelled Reasons</AlertTitle>
              <AlertDescription>
                Configure a reason before cancelling this Appointment.{' '}
                <Link
                  className="font-medium underline underline-offset-4"
                  href="/appointment-masters/cancelled-reasons"
                >
                  Manage Cancelled Reasons
                </Link>
              </AlertDescription>
            </Alert>
          ) : null}

          {!reasonsQuery.isLoading && !reasonsQuery.isError && reasons.length > 0 ? (
            <Controller
              control={form.control}
              name="appointmentCancelledReasonId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="appointment-cancelled-reason">
                    Appointment Cancelled Reason{' '}
                    <span aria-hidden className="text-destructive">
                      *
                    </span>
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.clearErrors('root');
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    <SelectTrigger
                      id="appointment-cancelled-reason"
                      className="w-full"
                      aria-required
                      aria-invalid={fieldState.invalid}
                      onBlur={field.onBlur}
                    >
                      <SelectValue placeholder="Select a cancellation reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {reasons.map((reason) => (
                        <SelectItem key={reason.id} value={String(reason.id)}>
                          {reason.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          ) : null}

          {form.formState.errors.root?.message ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Could not cancel Appointment</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={cancelMutation.isPending}>
              Keep Appointment
            </AlertDialogCancel>
            <Button
              type="submit"
              variant="destructive"
              disabled={cannotSubmit}
              aria-busy={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Appointment'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
