import type { Appointment } from '@/app/api/lib/modules/appointment/schemas/appointment-schema';
import type { Doctor } from '@/app/api/lib/modules/doctor/schemas/doctor-schema';
import type { Patient } from '@/app/api/lib/modules/patient/schemas/patient-schema';
import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import { CalendarCheck, CreditCard, Stethoscope, Upload, UserRoundPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export type CreateVisitMode = 'appointment' | 'walk-in';

export type CreateVisitUiValues = {
  mode: CreateVisitMode;
  appointmentId: string;
  patientId: string;
  patientClass: string;
  visitTypeId: string;
  department: string;
  doctorId: string;
  patientType: string;
  visitModeId: string;
  chiefComplaint: string;
  remarks: string;
  visitClassification: string;
  visitCard: string;
  payerReceiver: string;
  policy: string;
  policyHolder: string;
  membershipId: string;
  coverageStartDate: string;
  coverageEndDate: string;
  scannerEnabled: boolean;
};

type SelectOption = { value: string; label: string };

const PATIENT_CLASS_OPTIONS: SelectOption[] = [
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'pre-admit', label: 'Pre-admit' },
  { value: 'recurring', label: 'Recurring Patient' },
  { value: 'obstetrics', label: 'Obstetrics' },
  { value: 'commercial', label: 'Commercial Account' },
  { value: 'not-applicable', label: 'Not Applicable' },
];

const DEPARTMENT_OPTIONS: SelectOption[] = [
  { value: 'general-medicine', label: 'General Medicine' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'paediatrics', label: 'Paediatrics' },
  { value: 'orthopaedics', label: 'Orthopaedics' },
  { value: 'ent', label: 'ENT' },
];

const PATIENT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'new', label: 'New Patient' },
  { value: 'existing', label: 'Existing Patient' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'referred', label: 'Referred Patient' },
];

const CLASSIFICATION_OPTIONS: SelectOption[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'self-funded', label: 'Self-funded' },
  { value: 'corporate', label: 'Corporate' },
];

const VISIT_CARD_OPTIONS: SelectOption[] = [
  { value: 'primary', label: 'Primary Visit Card' },
  { value: 'insurance', label: 'Insurance Card' },
  { value: 'corporate', label: 'Corporate Card' },
];

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {' '}
      *
    </span>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarCheck;
  title: string;
  description: string;
}) {
  return (
    <CardHeader className="border-b">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

function UiSelect({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled,
  required,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? <RequiredMark /> : null}
      </FieldLabel>
      <NativeSelect
        id={id}
        value={value}
        disabled={disabled}
        aria-required={required}
        className="w-full"
        onChange={(event) => onChange(event.target.value)}
      >
        <NativeSelectOption value="">{placeholder}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

export function VisitSourceSection({
  values,
  appointments,
  patients,
  appointmentsLoading,
  patientsLoading,
  onChange,
}: {
  values: CreateVisitUiValues;
  appointments: Appointment[];
  patients: Patient[];
  appointmentsLoading: boolean;
  patientsLoading: boolean;
  onChange: <K extends keyof CreateVisitUiValues>(key: K, value: CreateVisitUiValues[K]) => void;
}) {
  return (
    <Card className="shadow-fluent-2">
      <SectionHeader
        icon={values.mode === 'appointment' ? CalendarCheck : UserRoundPlus}
        title="Visit source"
        description="Start from a scheduled Appointment or register a Walk-in Visit."
      />
      <CardContent className="space-y-4">
        <Tabs
          value={values.mode}
          onValueChange={(value) => onChange('mode', value as CreateVisitMode)}
        >
          <TabsList className="grid w-full grid-cols-2 sm:w-96">
            <TabsTrigger value="appointment">
              <CalendarCheck className="size-4" />
              From Appointment
            </TabsTrigger>
            <TabsTrigger value="walk-in">
              <UserRoundPlus className="size-4" />
              Walk-in
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {values.mode === 'appointment' ? (
          <UiSelect
            id="visit-appointment"
            label="Appointment"
            value={values.appointmentId}
            placeholder={
              appointmentsLoading
                ? 'Loading Appointments...'
                : appointments.length === 0
                  ? 'No Appointments scheduled today'
                  : 'Select an Appointment'
            }
            disabled={appointmentsLoading}
            required
            onChange={(value) => onChange('appointmentId', value)}
            options={appointments.map((appointment) => ({
              value: String(appointment.id),
              label: `${appointment.bookingNumber} - ${appointment.patient.firstName} ${appointment.patient.lastName} - ${appointment.slots.map((slot) => slot.slotTime).join(', ')}`,
            }))}
          />
        ) : (
          <UiSelect
            id="visit-patient"
            label="Patient"
            value={values.patientId}
            placeholder={
              patientsLoading
                ? 'Loading Patients...'
                : patients.length === 0
                  ? 'No active Patients available'
                  : 'Select a Patient'
            }
            disabled={patientsLoading}
            required
            onChange={(value) => onChange('patientId', value)}
            options={patients.map((patient) => ({
              value: String(patient.id),
              label: `${patient.firstName} ${patient.lastName} - ${patient.mrn} - ${patient.phone}`,
            }))}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function VisitDetailsSection({
  values,
  doctors,
  visitTypes,
  visitModes,
  selectedAppointment,
  dependenciesLoading,
  onChange,
}: {
  values: CreateVisitUiValues;
  doctors: Doctor[];
  visitTypes: VisitType[];
  visitModes: Array<{ id: number; name: string; code: string }>;
  selectedAppointment: Appointment | null;
  dependenciesLoading: boolean;
  onChange: <K extends keyof CreateVisitUiValues>(key: K, value: CreateVisitUiValues[K]) => void;
}) {
  const clinicianValue = selectedAppointment
    ? String(selectedAppointment.doctor.id)
    : values.doctorId;

  return (
    <Card className="shadow-fluent-2">
      <SectionHeader
        icon={Stethoscope}
        title="Visit details"
        description="Capture the operational routing and reason for this Visit."
      />
      <CardContent>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <UiSelect
              id="patient-class"
              label="Patient class"
              value={values.patientClass}
              placeholder="Select a Patient class"
              options={PATIENT_CLASS_OPTIONS}
              onChange={(value) => onChange('patientClass', value)}
            />
            <UiSelect
              id="visit-type"
              label="Visit type"
              value={values.visitTypeId}
              placeholder={
                dependenciesLoading
                  ? 'Loading Visit Types...'
                  : visitTypes.length === 0
                    ? 'No Visit Types available'
                    : 'Select a Visit type'
              }
              disabled={dependenciesLoading}
              options={visitTypes.map((visitType) => ({
                value: String(visitType.id),
                label: `${visitType.name} (${visitType.code})`,
              }))}
              onChange={(value) => onChange('visitTypeId', value)}
              required
            />
            <UiSelect
              id="department"
              label="Department"
              value={values.department}
              placeholder="Select a Department"
              options={DEPARTMENT_OPTIONS}
              onChange={(value) => onChange('department', value)}
            />
            <UiSelect
              id="clinician"
              label="Clinician"
              value={clinicianValue}
              placeholder={
                dependenciesLoading
                  ? 'Loading Doctors...'
                  : doctors.length === 0
                    ? 'No active Doctors available'
                    : 'Select a Clinician'
              }
              disabled={dependenciesLoading || Boolean(selectedAppointment)}
              options={doctors.map((doctor) => ({
                value: String(doctor.id),
                label: doctor.name,
              }))}
              onChange={(value) => onChange('doctorId', value)}
              required
            />
            <UiSelect
              id="patient-type"
              label="Patient type"
              value={values.patientType}
              placeholder="Select a Patient type"
              options={PATIENT_TYPE_OPTIONS}
              onChange={(value) => onChange('patientType', value)}
            />
            <UiSelect
              id="visit-mode"
              label="Visit mode"
              value={values.visitModeId}
              placeholder={
                dependenciesLoading
                  ? 'Loading Visit Modes...'
                  : visitModes.length === 0
                    ? 'No Visit Modes available'
                    : 'Select a Visit mode'
              }
              disabled={dependenciesLoading}
              options={visitModes.map((mode) => ({
                value: String(mode.id),
                label: `${mode.name} (${mode.code})`,
              }))}
              onChange={(value) => onChange('visitModeId', value)}
            />
          </div>

          <Field>
            <FieldLabel htmlFor="chief-complaint">Purpose of visit</FieldLabel>
            <Textarea
              id="chief-complaint"
              rows={3}
              value={values.chiefComplaint}
              placeholder="Describe the Patient's main concern"
              onChange={(event) => onChange('chiefComplaint', event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="visit-remarks">Remarks</FieldLabel>
            <Textarea
              id="visit-remarks"
              rows={3}
              value={values.remarks}
              onChange={(event) => onChange('remarks', event.target.value)}
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

export function CardInformationSection({
  values,
  onChange,
}: {
  values: CreateVisitUiValues;
  onChange: <K extends keyof CreateVisitUiValues>(key: K, value: CreateVisitUiValues[K]) => void;
}) {
  const hasCoverage =
    values.visitClassification === 'insurance' || values.visitClassification === 'corporate';

  return (
    <Card className="shadow-fluent-2">
      <SectionHeader
        icon={CreditCard}
        title="Card information"
        description="Review the Patient's billing classification and Visit card details."
      />
      <CardContent>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <UiSelect
              id="visit-classification"
              label="Visit classification"
              value={values.visitClassification}
              placeholder="Select a classification"
              options={CLASSIFICATION_OPTIONS}
              onChange={(value) => onChange('visitClassification', value)}
            />
            <UiSelect
              id="visit-card"
              label="Visit card"
              value={values.visitCard}
              placeholder="Select a Visit card"
              options={VISIT_CARD_OPTIONS}
              onChange={(value) => onChange('visitCard', value)}
            />
            <UiSelect
              id="payer-receiver"
              label="Payer / Receiver"
              value={values.payerReceiver}
              placeholder="Select a Payer / Receiver"
              disabled={!hasCoverage}
              options={[
                { value: 'patient', label: 'Patient / Self' },
                { value: 'primary-payer', label: 'Primary Payer' },
                { value: 'corporate-payer', label: 'Corporate Payer' },
              ]}
              onChange={(value) => onChange('payerReceiver', value)}
            />
            <UiSelect
              id="insurance-policy"
              label="Insurance policy"
              value={values.policy}
              placeholder="Select an Insurance policy"
              disabled={!hasCoverage}
              options={[
                { value: 'standard', label: 'Standard Network Policy' },
                { value: 'enhanced', label: 'Enhanced Network Policy' },
              ]}
              onChange={(value) => onChange('policy', value)}
            />
            <Field>
              <FieldLabel htmlFor="policy-holder">Policy holder</FieldLabel>
              <Input
                id="policy-holder"
                value={values.policyHolder}
                disabled={!hasCoverage}
                onChange={(event) => onChange('policyHolder', event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="membership-id">Membership ID</FieldLabel>
              <Input
                id="membership-id"
                value={values.membershipId}
                disabled={!hasCoverage}
                className="font-mono"
                onChange={(event) => onChange('membershipId', event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="coverage-start">Start date</FieldLabel>
              <Input
                id="coverage-start"
                type="date"
                value={values.coverageStartDate}
                disabled={!hasCoverage}
                onChange={(event) => onChange('coverageStartDate', event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="coverage-end">End date</FieldLabel>
              <Input
                id="coverage-end"
                type="date"
                value={values.coverageEndDate}
                disabled={!hasCoverage}
                onChange={(event) => onChange('coverageEndDate', event.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Switch
                id="enable-card-scanner"
                checked={values.scannerEnabled}
                onCheckedChange={(checked) => onChange('scannerEnabled', checked)}
              />
              <FieldLabel htmlFor="enable-card-scanner">Enable card scanner</FieldLabel>
            </div>
            <Button type="button" variant="outline" size="sm">
              <Upload className="size-4" />
              Scan card
            </Button>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
