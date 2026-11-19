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
  'Present condition / HPI': 'Present condition',
  'Examination / red flags': 'Examination',
  'Vikriti / body condition': 'Vikriti',
  'Treatment precautions': 'Precautions',
};

// History stays in the Clinical record; the Patient copy leaves it out.
const PATIENT_COPY_HIDDEN = new Set([
  'Past medical history',
  'Past surgical history',
  'Family / social history',
]);

const MODERN_DIAGNOSIS_PREFIX = 'Modern diagnosis: ';

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

const TREATMENT_RESPONSE_LABEL = '**Treatment response:**';

function isTreatmentNote(note: SoapNote) {
  return (note.subjective ?? '').startsWith(TREATMENT_RESPONSE_LABEL);
}

/** The latest signed consultation note: a CONS note, or one written by the consultation form. */
export function latestConsultationNote<T extends SoapNote>(notes: T[]): T | null {
  const candidates = notes.filter(
    (note) =>
      !isTreatmentNote(note) &&
      (note.noteType.code === 'CONS' || (note.subjective ?? '').includes('**Chief complaint:**'))
  );
  return candidates.at(-1) ?? null;
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
    (section) => section.label === 'Treatment response'
  );
  const responseText = subjective?.value ?? '';
  const pain = /\n*Pain score: (\d+)\/10$/.exec(responseText);
  const objective = parseLabelled(note.objective);
  const minutes = /Actual duration: (\d+) minutes/.exec(objective.lead);
  const section = (label: string) =>
    objective.sections.find((item) => item.label === label)?.value || null;

  return {
    response: pain ? responseText.slice(0, pain.index).trim() : responseText,
    painScore: pain ? Number(pain[1]) : null,
    variations: section('Variations'),
    actualMinutes: minutes ? Number(minutes[1]) : null,
    adverseEvents: section('Adverse events'),
  };
}
