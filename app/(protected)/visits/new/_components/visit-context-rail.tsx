import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import { CalendarClock, CreditCard, FileText, UserRound } from 'lucide-react';

import {
  formatEmiratesId,
  getPatientGenderLabel,
  getPatientPaymentMethodLabel,
} from '@/app/(protected)/patients/_utils/patient-value-sets';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function Detail({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={mono ? 'font-mono text-sm font-medium' : 'text-sm font-medium'}>
        {value || <span className="text-muted-foreground">Not recorded</span>}
      </p>
    </div>
  );
}

export function PatientContextCard({
  patient,
  loading,
}: {
  patient: Patient | null;
  loading: boolean;
}) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <UserRound className="text-primary size-4" />
          Patient
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : patient ? (
          <>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading text-base font-semibold">
                  {patient.firstName} {patient.middleName ? `${patient.middleName} ` : ''}
                  {patient.lastName}
                </p>
                {patient.isVip ? <Badge>VIP</Badge> : null}
              </div>
              <p className="text-muted-foreground font-mono text-xs">MRN {patient.mrn}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={patient.isActive ? 'secondary' : 'destructive'}>
                {patient.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">
                {patient.registrationStatus === 'registered' ? 'Registered' : 'Provisional'}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Detail label="Phone" value={patient.phone} />
              <Detail
                label="Gender"
                value={patient.gender ? getPatientGenderLabel(patient.gender) : null}
              />
              <Detail label="Date of birth" value={patient.dateOfBirth} />
              <Detail label="Emirates ID" value={formatEmiratesId(patient.emiratesId)} mono />
            </div>
          </>
        ) : (
          <div className="bg-muted/40 text-muted-foreground rounded-lg border p-4 text-sm">
            Select a Patient or Appointment to review Patient details.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AppointmentContextCard({ appointment }: { appointment: Appointment | null }) {
  if (!appointment) {
    return null;
  }

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="text-primary size-4" />
          Appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-sm font-semibold">{appointment.bookingNumber}</p>
          <Badge variant="secondary">{appointment.appointmentStatus.name}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Detail label="Date" value={appointment.slotDate} mono />
          <Detail
            label="Slot"
            value={appointment.slots.map((slot) => slot.slotTime).join(', ')}
            mono
          />
          <Detail label="Doctor" value={appointment.doctor.name} />
          <Detail label="Type" value={appointment.appointmentType.name} />
          <Detail label="Mode" value={appointment.appointmentMode.name} />
          <Detail label="Reason" value={appointment.appointmentReason.name} />
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentContextCard({ patient }: { patient: Patient | null }) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="text-primary size-4" />
          Payment summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Detail
          label="Preferred payment method"
          value={
            patient?.preferredPaymentMethod
              ? getPatientPaymentMethodLabel(patient.preferredPaymentMethod)
              : null
          }
        />
        <Detail label="Coverage card" value={null} />
      </CardContent>
    </Card>
  );
}

export function DocumentsCard() {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <FileText className="text-primary size-4" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted/40 text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          No documents attached
        </div>
        <Button type="button" variant="outline" className="w-full">
          <FileText className="size-4" />
          Add document
        </Button>
      </CardContent>
    </Card>
  );
}
