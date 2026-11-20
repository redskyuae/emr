import {
  ACTUAL_DURATION_PATTERN,
  DAILY_TREATMENT_LABELS,
  PAIN_SCORE_PATTERN,
} from '../../_utils/daily-treatment-note';
import {
  CONSULTATION_LABELS,
  MODERN_DIAGNOSIS_PREFIX,
} from '../../_utils/doctor-consultation-note';

type SoapNote = {
  plan: string | null;
  objective: string | null;
  subjective: string | null;
  assessment: string | null;
  noteType: { code: string };
};

type LabelledSection = { label: string; value: string };

const LABEL_PATTERN = /\*\*([^*\n]+):\*\*\n\n/g;

/**
 * Splits a SOAP section written as `**Label:**\n\nvalue` blocks into labelled parts.
 * Text before the first label is returned as `lead`.
 */
export function parseLabelled(text: string | null): { lead: string; sections: LabelledSection[] } {
  const source = text ?? '';
  const matches = [...source.matchAll(LABEL_PATTERN)];

  if (matches.length === 0) return { lead: source.trim(), sections: [] };

  const sections = matches.map((match, position) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[position + 1]?.index ?? source.length;
    return { label: match[1].trim(), value: source.slice(start, end).trim() };
  });

  return { lead: source.slice(0, matches[0].index).trim(), sections };
}

// The consultation form's labels, shortened for the Patient copy.
const DISPLAY_LABELS: Record<string, string> = {
  [CONSULTATION_LABELS.hpi]: 'Present condition',
  [CONSULTATION_LABELS.examination]: 'Examination',
  [CONSULTATION_LABELS.vikriti]: 'Vikriti',
  [CONSULTATION_LABELS.precautions]: 'Precautions',
};

// History stays in the Clinical record; the Patient copy leaves it out.
const PATIENT_COPY_HIDDEN = new Set<string>([
  CONSULTATION_LABELS.medicalHistory,
  CONSULTATION_LABELS.surgicalHistory,
  CONSULTATION_LABELS.familySocialHistory,
]);

type ConsultationRow = { label: string; value: string };

export type ConsultationGroup = {
  key: 'subjective' | 'objective' | 'assessment' | 'plan';
  rows: ConsultationRow[];
};

function rowsOf(text: string | null): ConsultationRow[] {
  const { lead, sections } = parseLabelled(text);
  const rows: ConsultationRow[] = [];

  if (lead.startsWith(MODERN_DIAGNOSIS_PREFIX)) {
    rows.push({ label: 'Modern diagnosis', value: lead.slice(MODERN_DIAGNOSIS_PREFIX.length) });
  } else if (lead) {
    rows.push({ label: '', value: lead });
  }

  for (const section of sections) {
    if (PATIENT_COPY_HIDDEN.has(section.label) || !section.value) continue;
    rows.push({ label: DISPLAY_LABELS[section.label] ?? section.label, value: section.value });
  }

  return rows;
}

/** SOAP groups of a consultation note for the Patient copy; empty groups are dropped. */
export function consultationGroups(note: SoapNote): ConsultationGroup[] {
  const groups: ConsultationGroup[] = [
    { key: 'subjective', rows: rowsOf(note.subjective) },
    { key: 'objective', rows: rowsOf(note.objective) },
    { key: 'assessment', rows: rowsOf(note.assessment) },
    { key: 'plan', rows: rowsOf(note.plan) },
  ];

  return groups.filter((group) => group.rows.length > 0);
}

const TREATMENT_RESPONSE_LABEL = `**${DAILY_TREATMENT_LABELS.response}:**`;
const CHIEF_COMPLAINT_LABEL = `**${CONSULTATION_LABELS.chiefComplaint}:**`;

function isTreatmentNote(note: SoapNote) {
  return (note.subjective ?? '').startsWith(TREATMENT_RESPONSE_LABEL);
}

// A CONS note, or one written by the consultation form.
function isConsultationNote(note: SoapNote) {
  return (
    !isTreatmentNote(note) &&
    (note.noteType.code === 'CONS' || (note.subjective ?? '').includes(CHIEF_COMPLAINT_LABEL))
  );
}

/** The latest signed consultation note. */
export function latestConsultationNote<T extends SoapNote>(notes: T[]): T | null {
  return notes.filter(isConsultationNote).at(-1) ?? null;
}

/**
 * The Clinical Note Types written for the Patient to read. Every other type (nursing handoffs,
 * and any type a Tenant adds to the master) stays off the Patient copy until it is listed here.
 * Codes are matched case-insensitively, as the Clinical Note Type code index is.
 */
const PATIENT_COPY_NOTE_TYPES = new Set(['PROG', 'DISCH']);

/**
 * Signed notes printed under Clinical notes, oldest first: the Patient-facing note types only,
 * less consultation notes and Treatment Session records, which the Patient copy shows elsewhere.
 */
export function otherClinicalNotes<T extends SoapNote>(notes: T[]): T[] {
  return notes.filter(
    (note) =>
      !isConsultationNote(note) &&
      !isTreatmentNote(note) &&
      PATIENT_COPY_NOTE_TYPES.has(note.noteType.code.toUpperCase())
  );
}

/** The latest signed Daily Treatment Session note. */
export function latestTreatmentNote<T extends SoapNote>(notes: T[]): T | null {
  return notes.filter(isTreatmentNote).at(-1) ?? null;
}

type TreatmentResponse = {
  response: string;
  painScore: number | null;
  variations: string | null;
  actualMinutes: number | null;
  adverseEvents: string | null;
};

/** Reads back what the Daily Treatment Session sheet wrote into a note. */
export function treatmentResponse(note: SoapNote): TreatmentResponse {
  const subjective = parseLabelled(note.subjective).sections.find(
    (section) => section.label === DAILY_TREATMENT_LABELS.response
  );
  const responseText = subjective?.value ?? '';
  const pain = PAIN_SCORE_PATTERN.exec(responseText);
  const objective = parseLabelled(note.objective);
  const minutes = ACTUAL_DURATION_PATTERN.exec(objective.lead);
  const section = (label: string) =>
    objective.sections.find((item) => item.label === label)?.value || null;

  return {
    response: pain ? responseText.slice(0, pain.index).trim() : responseText,
    painScore: pain ? Number(pain[1]) : null,
    variations: section(DAILY_TREATMENT_LABELS.variations),
    actualMinutes: minutes ? Number(minutes[1]) : null,
    adverseEvents: section(DAILY_TREATMENT_LABELS.adverseEvents),
  };
}
