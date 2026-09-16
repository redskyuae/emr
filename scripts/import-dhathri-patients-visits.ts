import { execFileSync } from 'node:child_process';

import { and, eq, sql } from 'drizzle-orm';

import { createDoctorCommand } from '../app/api/lib/modules/doctor/commands/create-doctor-command';
import { formatVisitNumber } from '../app/api/lib/modules/visit/repository/visit-number';
import { db } from '../app/db';
import { country as countryTable } from '../app/db/schema/country';
import { doctor as doctorTable } from '../app/db/schema/doctor';
import { language as languageTable } from '../app/db/schema/language';
import { nationality as nationalityTable } from '../app/db/schema/nationality';
import {
  patient as patientTable,
  patientMrnCounter as patientMrnCounterTable,
} from '../app/db/schema/patient';
import { religion as religionTable } from '../app/db/schema/religion';
import { specialty as specialtyTable } from '../app/db/schema/specialty';
import { state as stateTable } from '../app/db/schema/state';
import {
  treatment as treatmentTable,
  treatmentSession as treatmentSessionTable,
} from '../app/db/schema/treatment';
import {
  visit as visitTable,
  visitNumberCounter as visitNumberCounterTable,
} from '../app/db/schema/visit';
import { visitType as visitTypeTable } from '../app/db/schema/visit-type';

const TENANT_ID = 'N5eSMvVQtLopN4ooFYN3W9GagQ4XJx8S';
const OWNER_USER_ID = 'liEjlOC0cra1U8rb1ufpgUjjAXPVeAfi';
const XLSX = '/Users/arunselvakumar/Downloads/DhathriDetails.xlsx';
const BATCH = 80;
const DOCTOR_PASSWORD = 'abz@1234';

type PatientRow = {
  mrn: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string | null;
  marital: string;
  phone: string;
  emirate: string;
  email: string;
  city: string;
  address: string;
  religion: string;
  nationality: string;
  language: string;
};

type VisitRow = {
  mrn: string;
  visitNumber: string;
  visitAt: string | null;
  license: string;
  doctorName: string;
  complaint: string;
};

type TreatmentRow = {
  treatment: string;
  mrn: string;
  visitNumber: string;
  sessionNumber: number | null;
  status: string;
  note: string;
};

function loadWorkbook() {
  const python = `
import zipfile, xml.etree.ElementTree as ET, re, json
from datetime import datetime, timedelta
from pathlib import Path
p = Path(${JSON.stringify(XLSX)})
NS = {'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def col_row(cell_ref):
    m = re.match(r'([A-Z]+)(\\d+)', cell_ref)
    col, row = m.group(1), int(m.group(2))
    n = 0
    for ch in col:
        n = n*26 + (ord(ch)-64)
    return n, row
def excel_iso(value):
    if value in (None, ''):
        return None
    try:
        n = float(value)
    except Exception:
        return None
    dt = datetime(1899, 12, 30) + timedelta(days=n)
    return dt.isoformat()
def load(z, ss, path):
    sheet = ET.fromstring(z.read(path))
    rows = sheet.find('m:sheetData', NS).findall('m:row', NS)
    out = []
    for row in rows[1:]:
        vals = {}
        for c in row.findall('m:c', NS):
            ref = c.attrib.get('r')
            col,_ = col_row(ref)
            t = c.attrib.get('t')
            v = c.find('m:v', NS)
            val = None
            if t == 's' and v is not None:
                val = ss[int(v.text)]
            elif v is not None:
                val = v.text
            vals[col] = val
        out.append(vals)
    return out
with zipfile.ZipFile(p) as z:
    ss = []
    root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    for si in root.findall('m:si', NS):
        texts = [t.text or '' for t in si.findall('.//m:t', NS)]
        ss.append(''.join(texts))
    patients = []
    for r in load(z, ss, 'xl/worksheets/sheet1.xml'):
        patients.append({
            'mrn': (r.get(1) or '').strip(),
            'firstName': (r.get(2) or '').strip(),
            'lastName': (r.get(3) or '').strip(),
            'gender': (r.get(5) or '').strip(),
            'dob': excel_iso(r.get(6)),
            'marital': (r.get(7) or '').strip(),
            'phone': (r.get(8) or '').strip(),
            'emirate': (r.get(9) or '').strip(),
            'email': (r.get(13) or '').strip(),
            'city': (r.get(14) or '').strip(),
            'address': (r.get(15) or '').strip(),
            'religion': (r.get(16) or '').strip(),
            'nationality': (r.get(17) or '').strip(),
            'language': (r.get(11) or '').strip(),
        })
    visits = []
    for r in load(z, ss, 'xl/worksheets/sheet2.xml'):
        visits.append({
            'mrn': (r.get(1) or '').strip(),
            'visitNumber': str(int(float(r.get(2)))) if r.get(2) not in (None, '') else '',
            'visitAt': excel_iso(r.get(3)),
            'license': (r.get(7) or '').strip(),
            'doctorName': (r.get(8) or '').strip(),
            'complaint': (r.get(11) or '').strip(),
        })
    treatments = []
    for r in load(z, ss, 'xl/worksheets/sheet3.xml'):
        snum = r.get(7)
        treatments.append({
            'treatment': (r.get(1) or '').strip(),
            'mrn': (r.get(3) or '').strip(),
            'visitNumber': str(int(float(r.get(5)))) if r.get(5) not in (None, '') else '',
            'sessionNumber': int(float(snum)) if snum not in (None, '') else None,
            'status': (r.get(9) or r.get(6) or '').strip(),
            'note': (r.get(8) or '').strip(),
        })
    print(json.dumps({'patients': patients, 'visits': visits, 'treatments': treatments}))
`;
  const raw = execFileSync('python3', ['-c', python], { maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(raw.toString()) as {
    patients: PatientRow[];
    visits: VisitRow[];
    treatments: TreatmentRow[];
  };
}

function clip(value: string, max: number) {
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function lookupId(
  rows: Array<{ id: number; name: string }>,
  raw: string,
  aliases: Record<string, string> = {}
) {
  const key = raw.trim().toLowerCase();
  if (!key) return undefined;
  const aliased = aliases[key] ?? key;
  const exact = rows.find((row) => row.name.toLowerCase() === aliased);
  if (exact) return exact.id;
  const partial = rows.find(
    (row) => row.name.toLowerCase().includes(aliased) || aliased.includes(row.name.toLowerCase())
  );
  return partial?.id;
}

function genderOf(value: string) {
  if (value.toUpperCase() === 'M') return 'male';
  if (value.toUpperCase() === 'F') return 'female';
  return 'unknown';
}

function maritalOf(value: string) {
  const key = value.trim().toLowerCase();
  if (key === 'married') return 'married';
  if (key === 'single') return 'single';
  if (key === 'divorced') return 'divorced';
  if (key === 'widowed') return 'widowed';
  return 'other';
}

function dateOnly(iso: string | null) {
  if (!iso) return undefined;
  const date = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  if (date > '2026-09-16') return '2000-01-01';
  if (date < '1900-01-01') return undefined;
  return date;
}

function treatmentCode(raw: string) {
  const idx = raw.indexOf('_');
  const source = idx > 0 ? raw.slice(0, idx) : raw;
  return source
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 20);
}

const workbook = loadWorkbook();
console.log(
  JSON.stringify({
    patients: workbook.patients.length,
    visits: workbook.visits.length,
    treatments: workbook.treatments.length,
  })
);

const [
  nationalities,
  religions,
  languages,
  states,
  countries,
  visitTypes,
  specialties,
  doctors,
  treatments,
] = await Promise.all([
  db
    .select({ id: nationalityTable.id, name: nationalityTable.name })
    .from(nationalityTable)
    .where(eq(nationalityTable.isDeleted, false)),
  db
    .select({ id: religionTable.id, name: religionTable.name })
    .from(religionTable)
    .where(eq(religionTable.isDeleted, false)),
  db
    .select({ id: languageTable.id, name: languageTable.name })
    .from(languageTable)
    .where(eq(languageTable.isDeleted, false)),
  db
    .select({ id: stateTable.id, name: stateTable.name, countryId: stateTable.countryId })
    .from(stateTable)
    .where(eq(stateTable.isDeleted, false)),
  db
    .select({ id: countryTable.id, name: countryTable.name })
    .from(countryTable)
    .where(eq(countryTable.isDeleted, false)),
  db
    .select({ id: visitTypeTable.id, code: visitTypeTable.code })
    .from(visitTypeTable)
    .where(and(eq(visitTypeTable.tenantId, TENANT_ID), eq(visitTypeTable.isDeleted, false))),
  db
    .select({ id: specialtyTable.id, name: specialtyTable.name })
    .from(specialtyTable)
    .where(and(eq(specialtyTable.tenantId, TENANT_ID), eq(specialtyTable.isDeleted, false))),
  db
    .select({
      id: doctorTable.id,
      registrationNumber: doctorTable.registrationNumber,
    })
    .from(doctorTable)
    .where(and(eq(doctorTable.tenantId, TENANT_ID), eq(doctorTable.isDeleted, false))),
  db
    .select({
      id: treatmentTable.id,
      code: treatmentTable.code,
    })
    .from(treatmentTable)
    .where(and(eq(treatmentTable.tenantId, TENANT_ID), eq(treatmentTable.isDeleted, false))),
]);

const sessions = await db
  .select({
    id: treatmentSessionTable.id,
    treatmentId: treatmentSessionTable.treatmentId,
    sessionNumber: treatmentSessionTable.sessionNumber,
  })
  .from(treatmentSessionTable)
  .where(
    and(eq(treatmentSessionTable.tenantId, TENANT_ID), eq(treatmentSessionTable.isDeleted, false))
  );

const specialtyId =
  specialties.find((row) => row.name.toLowerCase() === 'general medicine')?.id ??
  specialties[0]?.id;
const visitTypeId = visitTypes.find((row) => row.code === 'OPD')?.id ?? visitTypes[0]?.id;
if (!specialtyId || !visitTypeId) {
  throw new Error('Missing Specialty or VisitType for Dhathri Ayurveda');
}

const doctorByLicense = new Map(
  doctors
    .filter((row) => row.registrationNumber)
    .map((row) => [row.registrationNumber!.toUpperCase(), row.id])
);
const fallbackDoctorId = doctors[0]?.id;
if (!fallbackDoctorId) {
  throw new Error('No Doctor exists for Dhathri Ayurveda');
}

const doctorsToCreate = [
  { license: 'T2971', name: 'Thameem Mohamed Raffi', email: 'thameem@dhathri.local' },
  { license: 'GA3674', name: 'Anuraj Muttarkulangara Rajasekharan', email: 'anuraj@dhathri.local' },
  { license: 'GA3639', name: 'Lishana Shaijukhan', email: 'lishana@dhathri.local' },
  { license: 'G56677', name: 'Arsha Mahash', email: 'arsha@dhathri.local' },
];

for (const doctor of doctorsToCreate) {
  if (doctorByLicense.has(doctor.license)) continue;
  const result = await createDoctorCommand(
    {
      name: doctor.name,
      email: doctor.email,
      password: DOCTOR_PASSWORD,
      specialtyId,
      registrationNumber: doctor.license,
    },
    TENANT_ID,
    OWNER_USER_ID
  );
  if (result.success) {
    doctorByLicense.set(doctor.license, result.data.id);
    console.log('created doctor', doctor.name, result.data.id);
  } else {
    console.error('doctor failed', doctor.name, result.errors);
  }
}

const existingPatients = await db
  .select({
    id: patientTable.id,
    phone: patientTable.phone,
    firstName: patientTable.firstName,
    lastName: patientTable.lastName,
    mrn: patientTable.mrn,
  })
  .from(patientTable)
  .where(and(eq(patientTable.tenantId, TENANT_ID), eq(patientTable.isDeleted, false)));

const patientIdByExcelMrn = new Map<string, number>();
const existingByPhone = new Map(existingPatients.map((row) => [row.phone, row]));

const nationalityAliases: Record<string, string> = {
  philippine: 'filipino',
  emirati: 'emirati',
  'sri lankan': 'sri lankan',
};
const religionAliases: Record<string, string> = {
  christianity: 'christian',
  muslim: 'islam',
};
const languageAliases: Record<string, string> = {
  'philippine languages': 'filipino',
  'persian / farsi': 'persian',
};
const uae = countries.find((row) => /united arab emirates|uae/i.test(row.name));
const stateIdByEmirate = new Map(
  states
    .filter((row) => !uae || row.countryId === uae.id)
    .map((row) => [row.name.toLowerCase(), row] as const)
);

const pendingPatients: Array<{
  excelMrn: string;
  values: typeof patientTable.$inferInsert;
}> = [];
const seenExcelMrn = new Set<string>();

for (const row of workbook.patients) {
  if (!row.mrn || seenExcelMrn.has(row.mrn.toLowerCase())) continue;
  seenExcelMrn.add(row.mrn.toLowerCase());
  const existing = existingByPhone.get(row.phone);
  if (existing) {
    patientIdByExcelMrn.set(row.mrn.toUpperCase(), existing.id);
    continue;
  }
  const firstName = clip(row.firstName, 100);
  const lastName = clip(row.lastName, 100) || '-';
  if (!firstName) continue;
  const emirate = stateIdByEmirate.get(row.emirate.toLowerCase());
  pendingPatients.push({
    excelMrn: row.mrn,
    values: {
      tenantId: TENANT_ID,
      mrn: clip(row.mrn, 20),
      firstName,
      lastName,
      gender: genderOf(row.gender),
      dateOfBirth: dateOnly(row.dob),
      maritalStatus: maritalOf(row.marital),
      phone: clip(row.phone, 20) || '5000000000',
      email: row.email.includes('@') ? clip(row.email, 255) : null,
      city: clip(row.city, 100) || null,
      addressLine1: clip(row.address, 255) || null,
      countryId: emirate?.countryId ?? uae?.id ?? null,
      stateId: emirate?.id ?? null,
      nationalityId: lookupId(nationalities, row.nationality, nationalityAliases) ?? null,
      religionId: lookupId(religions, row.religion, religionAliases) ?? null,
      languageId: lookupId(languages, row.language, languageAliases) ?? null,
      registrationStatus: 'registered',
      isActive: true,
    },
  });
}

let createdPatients = 0;
for (let offset = 0; offset < pendingPatients.length; offset += BATCH) {
  const batch = pendingPatients.slice(offset, offset + BATCH);
  const inserted = await db
    .insert(patientTable)
    .values(batch.map((item) => item.values))
    .returning({ id: patientTable.id, mrn: patientTable.mrn });
  const idByMrn = new Map(inserted.map((row) => [row.mrn.toUpperCase(), row.id]));
  for (const item of batch) {
    const id = idByMrn.get(item.values.mrn.toUpperCase());
    if (id) patientIdByExcelMrn.set(item.excelMrn.toUpperCase(), id);
  }
  createdPatients += inserted.length;
  console.log(`patients ${createdPatients}/${pendingPatients.length}`);
}

const treatmentIdByCode = new Map(treatments.map((row) => [row.code.toUpperCase(), row.id]));
const sessionIdByKey = new Map(
  sessions.map((row) => [`${row.treatmentId}:${row.sessionNumber}`, row.id])
);

const treatmentsByVisit = new Map<string, TreatmentRow[]>();
for (const row of workbook.treatments) {
  if (!row.visitNumber) continue;
  const list = treatmentsByVisit.get(row.visitNumber) ?? [];
  list.push(row);
  treatmentsByVisit.set(row.visitNumber, list);
}

function pickTreatment(visitNumber: string) {
  const rows = treatmentsByVisit.get(visitNumber) ?? [];
  const ranked = [...rows].sort((left, right) => {
    const score = (value: string) =>
      /completed/i.test(value) ? 0 : /progress/i.test(value) ? 1 : 2;
    return score(left.status) - score(right.status);
  });
  for (const row of ranked) {
    const code = treatmentCode(row.treatment);
    const treatmentId = treatmentIdByCode.get(code);
    if (!treatmentId) continue;
    const sessionNumber = row.sessionNumber ?? 1;
    const sessionId =
      sessionIdByKey.get(`${treatmentId}:${sessionNumber}`) ??
      sessionIdByKey.get(`${treatmentId}:1`);
    return { treatmentId, sessionId, summary: ranked };
  }
  return { treatmentId: undefined, sessionId: undefined, summary: ranked };
}

const existingVisitCount = await db
  .select({ total: sql<number>`count(*)::int` })
  .from(visitTable)
  .where(and(eq(visitTable.tenantId, TENANT_ID), eq(visitTable.isDeleted, false)));
let visitSequence = (existingVisitCount[0]?.total ?? 0) + 1001;
const tokens = new Map<string, number>();
const visitValues: Array<typeof visitTable.$inferInsert> = [];
let skippedVisits = 0;

for (const row of workbook.visits) {
  const patientId = patientIdByExcelMrn.get(row.mrn.toUpperCase());
  const visitAt = row.visitAt ? new Date(row.visitAt) : null;
  if (!patientId || !visitAt || Number.isNaN(visitAt.getTime())) {
    skippedVisits += 1;
    continue;
  }
  const visitDate = visitAt.toISOString().slice(0, 10);
  const doctorId = doctorByLicense.get(row.license.toUpperCase()) ?? fallbackDoctorId;
  const tokenKey = `${doctorId}|${visitDate}`;
  const queueToken = (tokens.get(tokenKey) ?? 0) + 1;
  tokens.set(tokenKey, queueToken);
  const picked = pickTreatment(row.visitNumber);
  const extras = (picked.summary ?? [])
    .slice(0, 6)
    .map((item) => `${treatmentCode(item.treatment)} s${item.sessionNumber ?? 1} ${item.status}`)
    .join('; ');
  visitValues.push({
    tenantId: TENANT_ID,
    visitNumber: formatVisitNumber(visitSequence++),
    patientId,
    doctorId,
    visitTypeId,
    status: 'COMPLETED',
    visitDate,
    queueToken,
    chiefComplaint: clip(row.complaint, 500) || null,
    remarks: clip(
      `Source visit ${row.visitNumber}${extras ? `. Treatments: ${extras}` : ''}`,
      2000
    ),
    checkedInAt: visitAt,
    consultationStartedAt: visitAt,
    completedAt: visitAt,
    treatmentId: picked.treatmentId ?? null,
    treatmentSessionId: picked.sessionId ?? null,
  });
}

let createdVisits = 0;
for (let offset = 0; offset < visitValues.length; offset += BATCH) {
  const batch = visitValues.slice(offset, offset + BATCH);
  await db.insert(visitTable).values(batch);
  createdVisits += batch.length;
  console.log(`visits ${createdVisits}/${visitValues.length}`);
}

const nextMrn = 1003 + createdPatients;
await db
  .insert(patientMrnCounterTable)
  .values({ tenantId: TENANT_ID, lastNumber: nextMrn })
  .onConflictDoUpdate({
    target: patientMrnCounterTable.tenantId,
    set: { lastNumber: nextMrn },
  });

const lastVisitNumber = visitSequence - 1;
await db
  .insert(visitNumberCounterTable)
  .values({ tenantId: TENANT_ID, lastNumber: lastVisitNumber })
  .onConflictDoUpdate({
    target: visitNumberCounterTable.tenantId,
    set: { lastNumber: lastVisitNumber },
  });

const [{ patientsInDb }] = await db
  .select({ patientsInDb: sql<number>`count(*)::int` })
  .from(patientTable)
  .where(and(eq(patientTable.tenantId, TENANT_ID), eq(patientTable.isDeleted, false)));
const [{ visitsInDb }] = await db
  .select({ visitsInDb: sql<number>`count(*)::int` })
  .from(visitTable)
  .where(and(eq(visitTable.tenantId, TENANT_ID), eq(visitTable.isDeleted, false)));

console.log(
  JSON.stringify({
    createdPatients,
    mappedPatients: patientIdByExcelMrn.size,
    createdVisits,
    skippedVisits,
    patientsInDb,
    visitsInDb,
    doctors: [...doctorByLicense.entries()],
  })
);
process.exit(0);
