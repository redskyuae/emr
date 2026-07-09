'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList, Pencil, Play, Save, Square, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import type { Visit } from '@/app/api/lib/modules/visit/schemas/visit-schema';
import { CancelVisitDialog } from '@/app/(protected)/visits/_components/_modals/cancel-visit-dialog';
import { DeleteVisitDialog } from '@/app/(protected)/visits/_components/_modals/delete-visit-dialog';
import { VisitStatusBadge } from '@/app/(protected)/visits/_components/visit-status-badge';
import {
  visitEditFormSchema,
  type VisitEditFormValues,
} from '@/app/(protected)/visits/_utils/visit-form-schema';
import { useAppointmentReasonsQuery } from '@/app/queries/appointment-masters/reasons/useAppointmentReasons';
import { useAppointmentTypesQuery } from '@/app/queries/appointment-masters/types/useAppointmentTypes';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { useCompleteVisit } from '@/app/queries/visits/useCompleteVisit';
import { useStartVisit } from '@/app/queries/visits/useStartVisit';
import { useUpdateVisit } from '@/app/queries/visits/useUpdateVisit';
import { useVisitQuery } from '@/app/queries/visits/useVisit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium">
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

function formatTimestamp(value: Date | string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function BackLink() {
  return (
    <Button type="button" variant="ghost" size="sm" asChild className="-ml-2">
      <Link href="/visits">
        <ArrowLeft className="size-4" />
        Visits
      </Link>
    </Button>
  );
}

function VisitDetailSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading Visit">
      <div className="bg-card shadow-fluent-2 rounded-xl border p-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />
      </div>
      {[0, 1, 2].map((section) => (
        <div key={section} className="bg-card shadow-fluent-2 space-y-4 rounded-xl border p-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function VisitDetailsSection({ visit }: { visit: Visit }) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateVisit();
  const doctorsQuery = useDoctorsQuery({ limit: 100, status: 'active' });
  const appointmentTypesQuery = useAppointmentTypesQuery({ limit: 100 });
  const appointmentReasonsQuery = useAppointmentReasonsQuery({ limit: 100 });

  const isOpen = visit.status.category === 'WAITING' || visit.status.category === 'IN_PROGRESS';

  const form = useForm<VisitEditFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(visitEditFormSchema),
    defaultValues: {
      doctorId: visit.doctorId ?? undefined,
      appointmentTypeId: visit.appointmentTypeId,
      appointmentReasonId: visit.appointmentReasonId ?? undefined,
      chiefComplaint: visit.chiefComplaint ?? '',
      notes: visit.notes ?? '',
    },
  });

  function startEditing() {
    form.reset({
      doctorId: visit.doctorId ?? undefined,
      appointmentTypeId: visit.appointmentTypeId,
      appointmentReasonId: visit.appointmentReasonId ?? undefined,
      chiefComplaint: visit.chiefComplaint ?? '',
      notes: visit.notes ?? '',
    });
    setIsEditing(true);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        id: visit.id,
        request: {
          doctorId: values.doctorId,
          appointmentTypeId: values.appointmentTypeId,
          appointmentReasonId: values.appointmentReasonId,
          chiefComplaint: values.chiefComplaint.trim() || undefined,
          notes: values.notes.trim() || undefined,
        },
      });
      toast.success('Visit updated.');
      setIsEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  });

  if (!isEditing) {
    return (
      <Card className="shadow-fluent-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Visit details</CardTitle>
          {isOpen ? (
            <Button type="button" variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="size-4" />
              Edit
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Doctor" value={visit.doctor?.name} />
          <DetailField label="Visit type" value={visit.appointmentType.name} />
          <DetailField label="Reason" value={visit.appointmentReason?.name} />
          <DetailField label="Chief complaint" value={visit.chiefComplaint} />
          <DetailField label="Notes" value={visit.notes} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-fluent-2">
      <CardHeader>
        <CardTitle>Edit Visit details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="doctorId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-visit-doctor">Doctor</FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger id="edit-visit-doctor" className="w-full">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {(doctorsQuery.data?.data ?? []).map((doctor) => (
                          <SelectItem key={doctor.id} value={String(doctor.id)}>
                            {doctor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="appointmentTypeId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-visit-type">
                      Visit type <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger id="edit-visit-type" className="w-full" aria-required="true">
                        <SelectValue placeholder="Select visit type" />
                      </SelectTrigger>
                      <SelectContent>
                        {(appointmentTypesQuery.data?.data ?? []).map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="appointmentReasonId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-visit-reason">Reason</FieldLabel>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger id="edit-visit-reason" className="w-full">
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      {(appointmentReasonsQuery.data?.data ?? []).map((reason) => (
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

            <Controller
              control={form.control}
              name="chiefComplaint"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-visit-chief-complaint">Chief complaint</FieldLabel>
                  <Textarea
                    id="edit-visit-chief-complaint"
                    {...field}
                    disabled={updateMutation.isPending}
                    rows={2}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-visit-notes">Notes</FieldLabel>
                  <Textarea
                    id="edit-visit-notes"
                    {...field}
                    disabled={updateMutation.isPending}
                    rows={3}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              aria-busy={updateMutation.isPending}
            >
              <Save className="size-4" />
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function VisitDetailImpl({ visitId }: { visitId: number }) {
  const router = useRouter();
  const visitQuery = useVisitQuery(visitId);
  const startMutation = useStartVisit();
  const completeMutation = useCompleteVisit();
  const [visitPendingCancel, setVisitPendingCancel] = useState<Visit | null>(null);
  const [visitPendingDelete, setVisitPendingDelete] = useState<Visit | null>(null);

  if (visitQuery.isLoading) {
    return <VisitDetailSkeleton />;
  }

  if (visitQuery.isError || !visitQuery.data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Empty className="min-h-72">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Visit not found</EmptyTitle>
            <EmptyDescription>{getApiErrorMessage(visitQuery.error)}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const visit = visitQuery.data;
  const category = visit.status.category;

  async function handleStart() {
    try {
      await startMutation.mutateAsync({ id: visit.id });
      toast.success('Visit started.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleComplete() {
    try {
      await completeMutation.mutateAsync({ id: visit.id });
      toast.success('Visit completed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-4">
      <BackLink />

      <Card className="shadow-fluent-2">
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-xl font-semibold">{visit.visitNumber}</h2>
              <VisitStatusBadge status={visit.status} />
            </div>
            <p className="text-sm">
              <Link href={`/patients/${visit.patient.id}`} className="hover:underline">
                {visit.patient.name}
              </Link>
              <span className="text-muted-foreground font-mono"> · {visit.patient.mrn}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {category === 'WAITING' ? (
              <Button type="button" variant="outline" onClick={() => void handleStart()}>
                <Play className="size-4" />
                Start
              </Button>
            ) : null}
            {category === 'IN_PROGRESS' ? (
              <Button type="button" variant="outline" onClick={() => void handleComplete()}>
                <Square className="size-4" />
                Complete
              </Button>
            ) : null}
            {category === 'WAITING' || category === 'IN_PROGRESS' ? (
              <Button type="button" variant="outline" onClick={() => setVisitPendingCancel(visit)}>
                <X className="size-4" />
                Cancel
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setVisitPendingDelete(visit)}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <VisitDetailsSection visit={visit} />

      <Card className="shadow-fluent-2">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="Checked in" value={formatTimestamp(visit.createdOn)} />
          <DetailField label="Started" value={formatTimestamp(visit.startedOn)} />
          <DetailField label="Completed" value={formatTimestamp(visit.completedOn)} />
          <DetailField label="Cancelled" value={formatTimestamp(visit.cancelledOn)} />
          {visit.cancelledReason ? (
            <div className="sm:col-span-2 lg:col-span-4">
              <DetailField label="Cancelled reason" value={visit.cancelledReason} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CancelVisitDialog visit={visitPendingCancel} onClose={() => setVisitPendingCancel(null)} />
      <DeleteVisitDialog
        visit={visitPendingDelete}
        onClose={() => setVisitPendingDelete(null)}
        onDeleted={() => router.push('/visits')}
      />
    </div>
  );
}
