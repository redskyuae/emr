const TITLES: Record<string, string> = {
  mr: 'Mr.',
  ms: 'Ms.',
  dr: 'Dr.',
  mrs: 'Mrs.',
  miss: 'Miss',
  baby: 'Baby',
  master: 'Master',
};

const GENDERS: Record<string, string> = {
  male: 'Male',
  other: 'Other',
  female: 'Female',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type NamedPatient = {
  title: string | null;
  lastName: string;
  firstName: string;
  middleName: string | null;
};

export function patientFullName(patient: NamedPatient) {
  return [
    patient.title ? TITLES[patient.title] : null,
    patient.firstName,
    patient.middleName,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(' ');
}

export function patientInitials(patient: { firstName: string; lastName: string }) {
  return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
}

/** The age in whole years on a `DD-MM-YYYY` date, from an ISO birth date. */
function ageOn(dateOfBirth: string, onDate: string) {
  const [birthYear, birthMonth, birthDay] = dateOfBirth.split('-').map(Number);
  const [day, month, year] = onDate.split('-').map(Number);
  const hadBirthday = month > birthMonth || (month === birthMonth && day >= birthDay);

  return year - birthYear - (hadBirthday ? 0 : 1);
}

/** `52 yrs / Male`, with the age on the report's end date; `—` when neither is known. */
export function ageAndSex(dateOfBirth: string | null, gender: string | null, onDate: string) {
  const age = dateOfBirth ? ageOn(dateOfBirth, onDate) : -1;
  const parts = [age >= 0 ? `${age} yrs` : null, gender ? GENDERS[gender] : null].filter(Boolean);

  return parts.length > 0 ? parts.join(' / ') : '—';
}

/** `03-11-2026` (the API's Visit date format) as `03 Nov 2026`. */
export function displayDate(apiDate: string) {
  const [day, month, year] = apiDate.split('-');
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
}

/** A moment as `20 Nov 2026` on the calendar of the Tenant's time zone. */
export function displayDateIn(value: Date | string, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';

  return displayDate(`${part('day')}-${part('month')}-${part('year')}`);
}

/** `Thrissur, Kerala`, or `—` when neither is recorded. */
export function displayPlace(city: string | null, state: string | null) {
  return [city, state].filter(Boolean).join(', ') || '—';
}

type GivenSession = {
  label: string | null;
  completed: boolean;
  procedure: string | null;
  sessionNumber: number;
  treatmentName: string;
  totalSessions: number;
};

/** `Janu Basti, Session 2 of 7: Janu Basti with Murivenna`, marked when not completed. */
export function sessionText(session: GivenSession) {
  const heading = `${session.treatmentName}, Session ${session.sessionNumber} of ${session.totalSessions}`;
  const detail = session.procedure?.trim() || session.label?.trim();

  return `${heading}${detail ? `: ${detail}` : ''}${session.completed ? '' : ' (in progress)'}`;
}

type NoteText = {
  objective: string | null;
  subjective: string | null;
  assessment: string | null;
};

/** The note's assessment, else its subjective and objective findings, as markdown paragraphs. */
export function noteText(note: NoteText) {
  const assessment = note.assessment?.trim();
  if (assessment) return assessment;

  return [note.subjective, note.objective]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join('\n\n');
}
