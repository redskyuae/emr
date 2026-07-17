'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch, Controller, type Control, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  CalendarClock,
  Check,
  Clock3,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  UserRound,
  UserRoundPlus,
} from 'lucide-react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { toast } from 'sonner';

import type { DoctorSlotRota } from '@/app/api/lib/modules/doctor-schedule/schemas/doctor-schedule-schema';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { PotentialPatientMatch } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import {
  AppointmentApiError,
  useCreateAppointment,
} from '@/app/queries/appointments/useCreateAppointment';
import { useDoctorSlotsQuery } from '@/app/queries/appointments/useDoctorSlots';
import { getApiErrorMessage, getApiErrors } from '@/app/queries/api-error';
import { useAppointmentModesQuery } from '@/app/queries/appointment-masters/useAppointmentModes';
import { useAppointmentReasonsQuery } from '@/app/queries/appointment-masters/reasons/useAppointmentReasons';
import { useAppointmentTypesQuery } from '@/app/queries/appointment-masters/types/useAppointmentTypes';
import { useDoctorsQuery } from '@/app/queries/doctors/useDoctors';
import { usePatientsQuery } from '@/app/queries/patients/usePatients';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import {
  bookAppointmentFormSchema,
  EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
  type BookAppointmentFormValues,
} from '../_utils/book-appointment-form-schema';
import { bookAppointmentFormValuesToRequest } from '../_utils/book-appointment-request';

const MASTER_LIMIT = 999;
const PATIENT_LIMIT = 8;

type MasterOption = {
  id: number | string;
  name: string;
  code?: string;
  value?: string;
};

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {' '}
      *
    </span>
  );
}

function FormErrors({
  title,
  errors,
  patientMatches,
  onUsePatient,
}: {
  title: string;
  errors: string[];
  patientMatches: PotentialPatientMatch[];
  onUsePatient: (match: PotentialPatientMatch) => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <ul className="list-disc space-y-1 pl-4">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>

        {patientMatches.length > 0 ? (
          <div className="space-y-2">
            {patientMatches.map((match) => (
              <div
                key={match.id}
                className="bg-background/70 text-foreground flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {match.firstName} {match.lastName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {match.mrn} / {match.phone} / {match.registrationStatus}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onUsePatient(match)}
                >
                  <Check className="size-4" />
                  Use Patient
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <CardHeader className="border-b">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

function NativeSelectField({
  id,
  name,
  label,
  control,
  options,
  disabled,
  loading,
  required,
  placeholder,
}: {
  id: string;
  name: FieldPath<BookAppointmentFormValues>;
  label: string;
  control: Control<BookAppointmentFormValues>;
  options: MasterOption[];
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  placeholder: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={id}>
            {label}
            {required ? <RequiredMark /> : null}
          </FieldLabel>
          <NativeSelect
            id={id}
            value={String(field.value ?? '')}
            disabled={disabled || loading}
            aria-invalid={fieldState.invalid}
            aria-required={required}
            className="w-full"
            onChange={(event) => field.onChange(event.target.value)}
          >
            <NativeSelectOption value="">{loading ? 'Loading...' : placeholder}</NativeSelectOption>
            {options.map((option) => (
              <NativeSelectOption key={option.id} value={option.value ?? String(option.id)}>
                {option.name}
                {option.code ? ` (${option.code})` : ''}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function TextField({
  id,
  name,
  type = 'text',
  label,
  control,
  disabled,
  required,
}: {
  id: string;
  name: FieldPath<BookAppointmentFormValues>;
  type?: string;
  label: string;
  control: Control<BookAppointmentFormValues>;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel htmlFor={id}>
            {label}
            {required ? <RequiredMark /> : null}
          </FieldLabel>
          <Input
            id={id}
            type={type}
            value={String(field.value ?? '')}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            aria-required={required}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function PatientSearchResult({
  patient,
  selected,
  onSelect,
}: {
  patient: Patient;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'focus-visible:ring-ring flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-2',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
        <UserRound className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {patient.firstName} {patient.lastName}
        </span>
        <span className="text-muted-foreground block text-xs">
          {patient.mrn} / {patient.phone}
        </span>
      </span>
      <Badge variant={patient.registrationStatus === 'registered' ? 'secondary' : 'outline'}>
        {patient.registrationStatus}
      </Badge>
    </button>
  );
}

function PatientSection({
  control,
  isSaving,
  patients,
  searchTerm,
  setSearchTerm,
  patientsLoading,
  selectedPatient,
  patientMode,
  onSelectPatient,
  onChangePatientMode,
}: {
  control: Control<BookAppointmentFormValues>;
  isSaving: boolean;
  patients: Patient[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  patientsLoading: boolean;
  selectedPatient: Patient | null;
  patientMode: BookAppointmentFormValues['patientMode'];
  onSelectPatient: (patient: Patient) => void;
  onChangePatientMode: (mode: BookAppointmentFormValues['patientMode']) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <SectionTitle
        icon={patientMode === 'existing' ? UserRound : UserRoundPlus}
        title="Patient"
        description="Select an existing Patient or create a Provisional Patient for this booking."
      />
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant={patientMode === 'existing' ? 'default' : 'outline'}
            onClick={() => onChangePatientMode('existing')}
            disabled={isSaving}
            className="justify-start"
          >
            <UserRound className="size-4" />
            Existing Patient
          </Button>
          <Button
            type="button"
            variant={patientMode === 'provisional' ? 'default' : 'outline'}
            onClick={() => onChangePatientMode('provisional')}
            disabled={isSaving}
            className="justify-start"
          >
            <UserRoundPlus className="size-4" />
            Provisional Patient
          </Button>
        </div>

        {patientMode === 'existing' ? (
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="patient-search">
                Patient
                <RequiredMark />
              </FieldLabel>
              <InputGroup className="bg-background shadow-fluent-2">
                <InputGroupAddon>
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="patient-search"
                  type="search"
                  value={searchTerm}
                  disabled={isSaving}
                  placeholder="Search by name, phone, or MRN"
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </InputGroup>
              <Controller
                control={control}
                name="patientId"
                render={({ fieldState }) => <FieldError errors={[fieldState.error]} />}
              />
            </Field>

            <div className="space-y-2">
              {patientsLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : patients.length > 0 ? (
                patients.map((patient) => (
                  <PatientSearchResult
                    key={patient.id}
                    patient={patient}
                    selected={selectedPatient?.id === patient.id}
                    onSelect={() => onSelectPatient(patient)}
                  />
                ))
              ) : (
                <div className="bg-muted/40 text-muted-foreground rounded-lg border p-4 text-sm">
                  No active Patients found.
                </div>
              )}
            </div>
          </FieldGroup>
        ) : (
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                id="provisional-first-name"
                name="firstName"
                label="First name"
                control={control}
                disabled={isSaving}
                required
              />
              <TextField
                id="provisional-middle-name"
                name="middleName"
                label="Middle name"
                control={control}
                disabled={isSaving}
              />
              <TextField
                id="provisional-last-name"
                name="lastName"
                label="Last name"
                control={control}
                disabled={isSaving}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NativeSelectField
                id="provisional-gender"
                name="gender"
                label="Gender"
                control={control}
                disabled={isSaving}
                placeholder="Not specified"
                options={[
                  { id: 'male', name: 'Male', value: 'male' },
                  { id: 'female', name: 'Female', value: 'female' },
                  { id: 'other', name: 'Other', value: 'other' },
                  { id: 'unknown', name: 'Unknown', value: 'unknown' },
                ]}
              />
              <TextField
                id="provisional-date-of-birth"
                name="dateOfBirth"
                type="date"
                label="Date of birth"
                control={control}
                disabled={isSaving}
              />
              <TextField
                id="provisional-phone"
                name="phone"
                label="Phone"
                control={control}
                disabled={isSaving}
                required
              />
              <TextField
                id="provisional-email"
                name="email"
                type="email"
                label="Email"
                control={control}
                disabled={isSaving}
              />
            </div>
          </FieldGroup>
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentDetailsSection({
  control,
  doctors,
  modes,
  types,
  reasons,
  isSaving,
  doctorsLoading,
  mastersLoading,
}: {
  control: Control<BookAppointmentFormValues>;
  doctors: MasterOption[];
  modes: MasterOption[];
  types: MasterOption[];
  reasons: MasterOption[];
  isSaving: boolean;
  doctorsLoading: boolean;
  mastersLoading: boolean;
}) {
  return (
    <Card className="shadow-fluent-2">
      <SectionTitle
        icon={CalendarClock}
        title="Appointment Details"
        description="Choose the Doctor, appointment classification, and booking date."
      />
      <CardContent>
        <FieldGroup className="gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <NativeSelectField
              id="appointment-doctor"
              name="doctorId"
              label="Doctor"
              control={control}
              options={doctors}
              loading={doctorsLoading}
              disabled={isSaving}
              required
              placeholder="Select Doctor"
            />
            <TextField
              id="appointment-slot-date"
              name="slotDate"
              type="date"
              label="Slot date"
              control={control}
              disabled={isSaving}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <NativeSelectField
              id="appointment-mode"
              name="appointmentModeId"
              label="Mode"
              control={control}
              options={modes}
              loading={mastersLoading}
              disabled={isSaving}
              required
              placeholder="Select Mode"
            />
            <NativeSelectField
              id="appointment-type"
              name="appointmentTypeId"
              label="Type"
              control={control}
              options={types}
              loading={mastersLoading}
              disabled={isSaving}
              required
              placeholder="Select Type"
            />
            <NativeSelectField
              id="appointment-reason"
              name="appointmentReasonId"
              label="Reason"
              control={control}
              options={reasons}
              loading={mastersLoading}
              disabled={isSaving}
              required
              placeholder="Select Reason"
            />
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function SlotButton({
  slot,
  selected,
  disabled,
  onToggle,
}: {
  slot: DoctorSlotRota['slots'][number];
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const isBooked = slot.slotStatus === 'Booked';

  return (
    <Button
      type="button"
      variant={selected ? 'default' : 'outline'}
      disabled={disabled || isBooked}
      onClick={onToggle}
      className={cn(
        'h-10 justify-center font-mono',
        isBooked ? 'text-muted-foreground line-through' : null
      )}
      aria-pressed={selected}
    >
      {slot.slotTime}
    </Button>
  );
}

function SlotsSection({
  rotas,
  isSaving,
  isLoading,
  isError,
  error,
  selectedRota,
  selectedRotaId,
  selectedSlotTimes,
  rotaError,
  slotTimesError,
  canLoadSlots,
  onRotaChange,
  onSlotToggle,
  onRetry,
}: {
  rotas: DoctorSlotRota[];
  isSaving: boolean;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  selectedRota: DoctorSlotRota | null;
  selectedRotaId: string;
  selectedSlotTimes: string[];
  rotaError?: string;
  slotTimesError?: string;
  canLoadSlots: boolean;
  onRotaChange: (rotaId: string) => void;
  onSlotToggle: (slotTime: string) => void;
  onRetry: () => void;
}) {
  const selectedSlotSet = useMemo(() => new Set(selectedSlotTimes), [selectedSlotTimes]);
  const availableSlots =
    selectedRota?.slots.filter((slot) => slot.slotStatus === 'Available') ?? [];

  return (
    <Card className="shadow-fluent-2">
      <SectionTitle
        icon={Clock3}
        title="DoctorSlots"
        description="Reserve one or more consecutive available DoctorSlots from the selected DoctorRota."
      />
      <CardContent className="space-y-4">
        {!canLoadSlots ? (
          <div className="bg-muted/40 text-muted-foreground rounded-lg border p-4 text-sm">
            Select a Doctor and Slot date to load DoctorSlots.
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load DoctorSlots</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{getApiErrorMessage(error)}</p>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                <RefreshCcw className="size-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ) : rotas.length === 0 ? (
          <div className="bg-muted/40 text-muted-foreground rounded-lg border p-4 text-sm">
            No DoctorSlots are available for this Doctor and date.
          </div>
        ) : (
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="doctor-rota">
                Doctor Rota
                <RequiredMark />
              </FieldLabel>
              <NativeSelect
                id="doctor-rota"
                value={selectedRotaId}
                disabled={isSaving}
                aria-required={true}
                onChange={(event) => onRotaChange(event.target.value)}
                className="w-full"
              >
                <NativeSelectOption value="">Select Doctor Rota</NativeSelectOption>
                {rotas.map((rota) => (
                  <NativeSelectOption key={rota.doctorRotaId} value={String(rota.doctorRotaId)}>
                    {rota.rotaName} / {rota.duration} min
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {rotaError ? <FieldError errors={[{ message: rotaError }]} /> : null}
            </Field>

            {selectedRota ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{availableSlots.length} available</Badge>
                  <Badge variant="outline">{selectedSlotTimes.length} selected</Badge>
                  <Badge variant="outline">{selectedRota.duration} min slots</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {selectedRota.slots.map((slot) => (
                    <SlotButton
                      key={slot.slotTime}
                      slot={slot}
                      disabled={isSaving}
                      selected={selectedSlotSet.has(slot.slotTime)}
                      onToggle={() => onSlotToggle(slot.slotTime)}
                    />
                  ))}
                </div>
                {slotTimesError ? <FieldError errors={[{ message: slotTimesError }]} /> : null}
              </>
            ) : null}
          </FieldGroup>
        )}
      </CardContent>
    </Card>
  );
}

function BookingSummary({
  values,
  isSaving,
  selectedDoctor,
  selectedPatient,
  selectedRota,
  selectedMode,
  selectedType,
  selectedReason,
}: {
  values: BookAppointmentFormValues;
  isSaving: boolean;
  selectedDoctor: MasterOption | null;
  selectedPatient: Patient | null;
  selectedRota: DoctorSlotRota | null;
  selectedMode: MasterOption | null;
  selectedType: MasterOption | null;
  selectedReason: MasterOption | null;
}) {
  const patientName =
    values.patientMode === 'existing'
      ? selectedPatient
        ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
        : 'Not selected'
      : values.firstName || values.lastName
        ? `${values.firstName} ${values.lastName}`.trim()
        : 'Provisional Patient';
  const totalMinutes = selectedRota ? values.slotTimes.length * selectedRota.duration : 0;

  return (
    <Card className="shadow-fluent-2 xl:sticky xl:top-24">
      <CardHeader className="border-b">
        <CardTitle>Booking Summary</CardTitle>
        <CardDescription>Review the Appointment before saving.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SummaryRow label="Patient" value={patientName} />
        <SummaryRow label="Doctor" value={selectedDoctor?.name ?? 'Not selected'} />
        <SummaryRow label="Slot date" value={values.slotDate || 'Not selected'} />
        <SummaryRow label="Doctor Rota" value={selectedRota?.rotaName ?? 'Not selected'} />
        <SummaryRow
          label="Slots"
          value={values.slotTimes.length > 0 ? values.slotTimes.join(', ') : 'Not selected'}
        />
        <Separator />
        <SummaryRow label="Mode" value={selectedMode?.name ?? 'Not selected'} />
        <SummaryRow label="Type" value={selectedType?.name ?? 'Not selected'} />
        <SummaryRow label="Reason" value={selectedReason?.name ?? 'Not selected'} />
        <Separator />
        <div className="bg-muted/40 rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Reserved duration</p>
          <p className="font-heading text-2xl font-semibold">{totalMinutes} min</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="book-appointment-form" className="w-full" disabled={isSaving}>
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Book Appointment
        </Button>
      </CardFooter>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  );
}

function DependencyAlert({
  label,
  error,
  onRetry,
}: {
  label: string;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>{label}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{getApiErrorMessage(error)}</span>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          <RefreshCcw className="size-4" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function BookAppointmentPageImpl() {
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientMatches, setPatientMatches] = useState<PotentialPatientMatch[]>([]);
  const [debouncedPatientSearch] = useDebouncedValue(patientSearch, { wait: 300 });
  const createAppointmentMutation = useCreateAppointment();

  const form = useForm<BookAppointmentFormValues>({
    mode: 'onTouched',
    defaultValues: {
      ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
      slotDate: todayIsoDate(),
    },
    resolver: zodResolver(bookAppointmentFormSchema),
  });

  const values = useWatch({ control: form.control });
  const patientMode = values.patientMode ?? 'existing';
  const selectedPatientId = values.patientId ?? '';
  const selectedDoctorId = values.doctorId ?? '';
  const selectedRotaId = values.doctorRotaId ?? '';
  const selectedSlotTimes = values.slotTimes ?? [];
  const slotDate = values.slotDate ?? '';

  const patientsQuery = usePatientsQuery({
    page: 1,
    limit: PATIENT_LIMIT,
    isActive: true,
    query: debouncedPatientSearch || undefined,
  });
  const doctorsQuery = useDoctorsQuery({ page: 1, limit: MASTER_LIMIT, status: 'active' });
  const modesQuery = useAppointmentModesQuery({ page: 1, limit: MASTER_LIMIT });
  const typesQuery = useAppointmentTypesQuery({ page: 1, limit: MASTER_LIMIT });
  const reasonsQuery = useAppointmentReasonsQuery({ page: 1, limit: MASTER_LIMIT });
  const slotsQuery = useDoctorSlotsQuery({
    slotDate,
    doctorId: selectedDoctorId ? Number(selectedDoctorId) : null,
  });

  const patients = patientsQuery.data?.data ?? [];
  const doctors =
    doctorsQuery.data?.data.map((doctor) => ({ id: doctor.id, name: doctor.name })) ?? [];
  const modes = modesQuery.data?.data ?? [];
  const types = typesQuery.data?.data ?? [];
  const reasons = reasonsQuery.data?.data ?? [];
  const rotas = slotsQuery.data?.data[0]?.rotas ?? [];

  const selectedPatient =
    patients.find((patient) => String(patient.id) === selectedPatientId) ?? null;
  const selectedDoctor = doctors.find((doctor) => String(doctor.id) === selectedDoctorId) ?? null;
  const selectedMode = modes.find((mode) => String(mode.id) === values.appointmentModeId) ?? null;
  const selectedType = types.find((type) => String(type.id) === values.appointmentTypeId) ?? null;
  const selectedReason =
    reasons.find((reason) => String(reason.id) === values.appointmentReasonId) ?? null;
  const selectedRota = rotas.find((rota) => String(rota.doctorRotaId) === selectedRotaId) ?? null;
  const isSaving = createAppointmentMutation.isPending;
  const mastersLoading = modesQuery.isLoading || typesQuery.isLoading || reasonsQuery.isLoading;
  const hasDoctorAndDate = selectedDoctorId.length > 0 && slotDate.length > 0;

  useEffect(() => {
    form.setValue('doctorRotaId', '', { shouldDirty: true, shouldValidate: false });
    form.setValue('slotTimes', [], { shouldDirty: true, shouldValidate: false });
  }, [form, selectedDoctorId, slotDate]);

  function setPatientMode(mode: BookAppointmentFormValues['patientMode']) {
    form.setValue('patientMode', mode, { shouldDirty: true, shouldValidate: true });
    setServerErrors([]);
    setPatientMatches([]);

    if (mode === 'existing') {
      form.setValue('firstName', '');
      form.setValue('middleName', '');
      form.setValue('lastName', '');
      form.setValue('gender', '');
      form.setValue('dateOfBirth', '');
      form.setValue('phone', '');
      form.setValue('email', '');
      return;
    }

    form.setValue('patientId', '');
  }

  function selectPatient(patient: Pick<Patient, 'id' | 'firstName' | 'lastName' | 'phone'>) {
    form.setValue('patientMode', 'existing', { shouldDirty: true, shouldValidate: true });
    form.setValue('patientId', String(patient.id), { shouldDirty: true, shouldValidate: true });
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    setPatientMatches([]);
    setServerErrors([]);
  }

  function changeRota(rotaId: string) {
    form.setValue('doctorRotaId', rotaId, { shouldDirty: true, shouldValidate: true });
    form.setValue('slotTimes', [], { shouldDirty: true, shouldValidate: true });
  }

  function toggleSlot(slotTime: string) {
    const nextSlotTimes = selectedSlotTimes.includes(slotTime)
      ? selectedSlotTimes.filter((selected) => selected !== slotTime)
      : [...selectedSlotTimes, slotTime];

    const orderedSlotTimes =
      selectedRota?.slots
        .filter((slot) => nextSlotTimes.includes(slot.slotTime))
        .map((slot) => slot.slotTime) ?? nextSlotTimes;

    form.setValue('slotTimes', orderedSlotTimes, { shouldDirty: true, shouldValidate: true });
  }

  const onSubmit = form.handleSubmit(async (formValues) => {
    setServerErrors([]);
    setPatientMatches([]);

    try {
      const response = await createAppointmentMutation.mutateAsync(
        bookAppointmentFormValuesToRequest(formValues)
      );

      toast.success(`Appointment booked as ${response.data.bookingNumber}.`);
      form.reset({
        ...EMPTY_BOOK_APPOINTMENT_FORM_VALUES,
        slotDate: todayIsoDate(),
      });
      setPatientSearch('');
    } catch (error) {
      setServerErrors(getApiErrors(error));

      if (error instanceof AppointmentApiError) {
        setPatientMatches(error.patientMatches);
      }

      toast.error(getApiErrorMessage(error));
    }
  });

  return (
    <form
      id="book-appointment-form"
      onSubmit={onSubmit}
      className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div className="space-y-4">
        {serverErrors.length > 0 ? (
          <FormErrors
            title="Booking failed"
            errors={serverErrors}
            patientMatches={patientMatches}
            onUsePatient={(match) => selectPatient(match)}
          />
        ) : null}

        {doctorsQuery.isError ? (
          <DependencyAlert
            label="Could not load Doctors"
            error={doctorsQuery.error}
            onRetry={() => void doctorsQuery.refetch()}
          />
        ) : null}
        {modesQuery.isError ? (
          <DependencyAlert
            label="Could not load Appointment Modes"
            error={modesQuery.error}
            onRetry={() => void modesQuery.refetch()}
          />
        ) : null}
        {typesQuery.isError ? (
          <DependencyAlert
            label="Could not load Appointment Types"
            error={typesQuery.error}
            onRetry={() => void typesQuery.refetch()}
          />
        ) : null}
        {reasonsQuery.isError ? (
          <DependencyAlert
            label="Could not load Appointment Reasons"
            error={reasonsQuery.error}
            onRetry={() => void reasonsQuery.refetch()}
          />
        ) : null}

        <PatientSection
          control={form.control}
          isSaving={isSaving}
          patients={patients}
          searchTerm={patientSearch}
          setSearchTerm={setPatientSearch}
          patientsLoading={patientsQuery.isLoading || patientsQuery.isFetching}
          selectedPatient={selectedPatient}
          patientMode={patientMode}
          onSelectPatient={selectPatient}
          onChangePatientMode={setPatientMode}
        />

        <AppointmentDetailsSection
          control={form.control}
          doctors={doctors}
          modes={modes}
          types={types}
          reasons={reasons}
          isSaving={isSaving}
          doctorsLoading={doctorsQuery.isLoading}
          mastersLoading={mastersLoading}
        />

        <SlotsSection
          rotas={rotas}
          isSaving={isSaving}
          isLoading={slotsQuery.isLoading || slotsQuery.isFetching}
          isError={slotsQuery.isError}
          error={slotsQuery.error}
          selectedRota={selectedRota}
          selectedRotaId={selectedRotaId}
          selectedSlotTimes={selectedSlotTimes}
          rotaError={form.formState.errors.doctorRotaId?.message}
          slotTimesError={form.formState.errors.slotTimes?.message}
          canLoadSlots={hasDoctorAndDate}
          onRotaChange={changeRota}
          onSlotToggle={toggleSlot}
          onRetry={() => void slotsQuery.refetch()}
        />

        <Card className="shadow-fluent-2">
          <CardContent>
            <Controller
              name="remarks"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="appointment-remarks">Remarks</FieldLabel>
                  <Textarea
                    id="appointment-remarks"
                    {...field}
                    rows={3}
                    disabled={isSaving}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </CardContent>
        </Card>
      </div>

      <BookingSummary
        values={values as BookAppointmentFormValues}
        isSaving={isSaving}
        selectedDoctor={selectedDoctor}
        selectedPatient={selectedPatient}
        selectedRota={selectedRota}
        selectedMode={selectedMode}
        selectedType={selectedType}
        selectedReason={selectedReason}
      />
    </form>
  );
}
