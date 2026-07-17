import type {
  AdmissionStatus,
  DischargeDisposition,
} from '@/app/api/lib/modules/admission/schemas/admission-schema';
import { DISCHARGE_DISPOSITIONS } from '@/app/api/lib/modules/admission/schemas/admission-schema';

type AdmissionStatusPresentation = {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
};

const ADMISSION_STATUS_PRESENTATION: Record<AdmissionStatus, AdmissionStatusPresentation> = {
  ADMITTED: { label: 'Admitted', variant: 'default' },
  DISCHARGED: { label: 'Discharged', variant: 'outline' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export const ADMISSION_STATUS_FILTERS = [
  { value: 'ADMITTED', label: 'Admitted' },
  { value: 'DISCHARGED', label: 'Discharged' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const DISCHARGE_DISPOSITION_LABELS: Record<DischargeDisposition, string> = {
  ROUTINE: 'Routine',
  LAMA: 'LAMA (against medical advice)',
  TRANSFERRED: 'Transferred',
  DECEASED: 'Deceased',
  ABSCONDED: 'Absconded',
};

export const DISCHARGE_DISPOSITION_OPTIONS = DISCHARGE_DISPOSITIONS.map((disposition) => ({
  value: disposition,
  label: DISCHARGE_DISPOSITION_LABELS[disposition],
}));

export function admissionStatusPresentation(status: AdmissionStatus) {
  return ADMISSION_STATUS_PRESENTATION[status];
}

export function dischargeDispositionLabel(disposition: DischargeDisposition) {
  return DISCHARGE_DISPOSITION_LABELS[disposition];
}

/** The API speaks DD-MM-YYYY for the Expected Discharge Date; `<input type="date">` speaks ISO. */
export function toDateInputValue(displayDate: string) {
  const [day, month, year] = displayDate.split('-');
  return `${year}-${month}-${day}`;
}

export function toDisplayDate(inputValue: string) {
  const [year, month, day] = inputValue.split('-');
  return `${day}-${month}-${year}`;
}
