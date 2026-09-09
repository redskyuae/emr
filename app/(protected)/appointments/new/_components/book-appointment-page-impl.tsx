'use client';

import { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Pencil,
  RotateCcw,
  Stethoscope,
  UserRound,
  TriangleAlert,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import { AppointmentDetailsSection } from './appointment-details-section';
import { AppointmentScheduleSection } from './appointment-schedule-section';
import {
  DEMO_DOCTORS,
  DEMO_FACILITY,
  DEMO_MODES,
  DEMO_REASONS,
  DEMO_ROTAS,
  DEMO_TYPES,
} from './book-appointment-demo-data';
import { BookingPathSelector } from './booking-path-selector';
import { BookingRemarks } from './booking-remarks';
import { BookingSummary } from './booking-summary';
import { DoctorSelectionSection } from './doctor-selection-section';
import { PatientSection } from './patient-section';
import { ResourceAllocationSection, ResourceStatus } from './resource-allocation-section';
import { TreatmentSessionSection } from './treatment-session-section';
import { useBookAppointment } from './use-book-appointment';

export function BookAppointmentPageImpl() {
  const booking = useBookAppointment();
  const {
    form,
    values,
    step,
    selectedPatient,
    selectedSession,
    isProcedurePath,
    isProvisionalTreatment,
  } = booking;
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const patientName = selectedPatient
    ? selectedPatient.firstName + ' ' + selectedPatient.lastName
    : (values.firstName + ' ' + values.lastName).trim();
  const visitLabel = isProcedurePath
    ? isProvisionalTreatment
      ? 'Treatment'
      : 'Procedure'
    : 'Consultation';

  useEffect(() => {
    if (previousStep.current !== step) {
      stepHeading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
      previousStep.current = step;
    }
  }, [step]);

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Book Appointment</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Select the Patient, Visit, clinician, and exact Appointment time.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="text-primary size-4 shrink-0" />
          <div>
            <p className="font-medium">{DEMO_FACILITY.name}</p>
            <p className="text-muted-foreground text-xs">
              {DEMO_FACILITY.emirate} · {DEMO_FACILITY.timeZone}
            </p>
          </div>
        </div>
      </header>

      <nav
        aria-label="Booking progress"
        className="bg-card shadow-fluent-2 flex flex-wrap items-center gap-2 rounded-xl border p-2"
      >
        {(['Patient & visit', 'Schedule & book'] as const).map((label, index) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            aria-current={step === index + 1 ? 'step' : undefined}
            onClick={() => (index === 0 ? booking.setStep(1) : void booking.continueToSchedule())}
            className={cn(
              'h-auto flex-1 justify-start gap-3 px-3 py-2 sm:min-w-52 sm:flex-none',
              step === index + 1 && 'bg-primary/5 text-primary'
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                step === index + 1
                  ? 'border-primary bg-primary text-primary-foreground'
                  : index === 0 && step === 2
                    ? 'border-success/25 bg-success/10 text-success'
                    : 'border-border text-muted-foreground'
              )}
            >
              {index === 0 && step === 2 ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className="text-left whitespace-normal">{label}</span>
          </Button>
        ))}
        <span className="text-muted-foreground ml-auto hidden pr-3 text-xs sm:block">
          Step {step} of 2
        </span>
      </nav>

      {booking.confirmation ? (
        <Alert className="border-success/25 bg-success/5" role="status">
          <Check className="size-4" />
          <AlertTitle>
            Booking ready for review ·{' '}
            <span className="font-mono">{booking.confirmation.bookingNumber}</span>
          </AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {booking.confirmation.patientName} · {booking.confirmation.detail}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={booking.resetBooking}>
              <RotateCcw className="size-3.5" /> Start another booking
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <form
        id="book-appointment-form"
        noValidate
        className="flex flex-1 flex-col gap-4"
        onSubmit={(event) => {
          if (step === 1) {
            event.preventDefault();
            void booking.continueToSchedule();
          } else {
            void booking.onSubmit(event);
          }
        }}
      >
        <h2 ref={stepHeading} tabIndex={-1} className="sr-only">
          {step === 1 ? 'Patient & visit' : 'Schedule & book'}
        </h2>
        {step === 1 ? (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <PatientSection
              control={form.control}
              patients={booking.filteredPatients}
              search={booking.patientSearch}
              onSearchChange={booking.setPatientSearch}
              selectedPatient={selectedPatient}
              onSelectPatient={booking.selectPatient}
              patientMode={booking.patientMode}
              onPatientModeChange={booking.changePatientMode}
            />
            <div className="min-w-0 space-y-4">
              <BookingPathSelector
                value={booking.visitType}
                patientMode={booking.patientMode}
                onChange={booking.changeVisitType}
              />
              <FieldError errors={[form.formState.errors.visitType]} />
              {booking.visitType ? (
                <DoctorSelectionSection
                  control={form.control}
                  doctors={DEMO_DOCTORS}
                  doctorId={values.doctorId}
                  onChange={booking.changeSchedule}
                />
              ) : null}
              {isProcedurePath ? (
                <TreatmentSessionSection
                  control={form.control}
                  treatments={booking.treatmentOptions}
                  selectedTreatment={booking.selectedTreatment}
                  selectedSession={selectedSession}
                  showSession={!isProvisionalTreatment}
                  onTreatmentChange={booking.changeTreatment}
                  onSessionChange={booking.changeSession}
                />
              ) : (
                <div className="text-muted-foreground flex items-start gap-3 px-2 py-4 text-sm">
                  <ArrowRight className="mt-0.5 size-4 shrink-0" />
                  <p>
                    {booking.visitType
                      ? 'Continue to choose the date and exact Appointment time.'
                      : 'Choose a Visit Type to see what comes next.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-card flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
              <UserRound className="text-primary size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold break-words">{patientName}</p>
                <p className="text-muted-foreground text-xs break-words">
                  <span className="font-mono">{selectedPatient?.mrn ?? 'Provisional Patient'}</span>{' '}
                  · {selectedPatient?.phone ?? values.phone}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  isProcedurePath
                    ? 'border-procedure/25 bg-procedure/10 text-procedure'
                    : 'border-primary/25 bg-primary/10 text-primary'
                }
              >
                {visitLabel}
              </Badge>
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <Stethoscope className="size-3.5" aria-hidden="true" />
                {booking.selectedDoctor?.name ?? 'Doctor required'}
              </span>
              {booking.selectedTreatment ? (
                <span className="text-sm">
                  {booking.selectedTreatment.name}
                  {selectedSession ? ' · ' + selectedSession.procedure : ''}
                </span>
              ) : null}
              <Button type="button" variant="ghost" size="sm" onClick={() => booking.setStep(1)}>
                <Pencil className="size-3.5" /> Edit
              </Button>
            </div>
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <div className="min-w-0 space-y-4">
                <AppointmentScheduleSection
                  control={form.control}
                  rotas={DEMO_ROTAS}
                  rota={booking.selectedRota}
                  doctorId={values.doctorId}
                  slotDate={values.slotDate}
                  startTime={values.startTime}
                  endTime={values.endTime}
                  selectedRotaId={values.doctorRotaId}
                  procedure={isProcedurePath}
                  recommendedDuration={
                    booking.resourceSession
                      ? booking.resourceSession.duration +
                        booking.resourceSession.setupMinutes +
                        booking.resourceSession.cleaningMinutes
                      : 30
                  }
                  onContextChange={booking.changeSchedule}
                  onRotaChange={(value) => {
                    form.setValue('doctorRotaId', value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.setValue('startTime', '', { shouldDirty: true });
                    form.setValue('endTime', '', { shouldDirty: true });
                  }}
                  onTimeChange={booking.changeTime}
                />
                {selectedSession ? (
                  <Alert className="border-warning/25 bg-warning/5">
                    <TriangleAlert className="text-warning size-4" />
                    <AlertTitle className="text-warning">Clinical warning</AlertTitle>
                    <AlertDescription>{selectedSession.warning}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
              {isProcedurePath ? (
                <div className="min-w-0 space-y-3">
                  <ResourceAllocationSection
                    control={form.control}
                    rooms={booking.filteredRooms}
                    therapists={booking.filteredTherapists}
                    session={booking.resourceSession}
                    canAllocate={Boolean(values.slotDate && values.startTime && values.endTime)}
                    selectedRoomId={values.roomId}
                    selectedTherapistId={values.therapistId}
                    onRoomChange={(value) =>
                      form.setValue('roomId', value, { shouldDirty: true, shouldValidate: true })
                    }
                    onTherapistChange={(value) =>
                      form.setValue('therapistId', value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  <ResourceStatus
                    consentStatus={values.consentStatus}
                    approvalStatus={values.approvalStatus}
                  />
                  <BookingRemarks control={form.control} />
                </div>
              ) : (
                <div className="min-w-0 space-y-4">
                  <AppointmentDetailsSection
                    control={form.control}
                    modes={DEMO_MODES}
                    types={DEMO_TYPES}
                    reasons={DEMO_REASONS}
                  />
                  <BookingRemarks control={form.control} />
                </div>
              )}
            </div>
          </>
        )}

        <footer className="bg-card shadow-fluent-8 sticky bottom-0 z-20 mt-auto flex flex-wrap items-center gap-3 rounded-xl border p-3 sm:p-4">
          {step === 2 ? (
            <>
              <Button type="button" variant="outline" onClick={() => booking.setStep(1)}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <BookingSummary
                values={values}
                room={booking.selectedRoom}
                therapist={booking.selectedTherapist}
                doctorName={booking.selectedDoctor?.name ?? ''}
              />
            </>
          ) : (
            <p className="text-muted-foreground flex-1 text-sm">
              Select a Patient and Visit Type to continue.
            </p>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting} className="ml-auto">
            {step === 1 ? (
              <>
                Continue <ArrowRight className="size-4" />
              </>
            ) : (
              <>
                <Check className="size-4" />
                {form.formState.isSubmitting ? 'Checking availability…' : 'Book ' + visitLabel}
              </>
            )}
          </Button>
        </footer>
      </form>
    </div>
  );
}
