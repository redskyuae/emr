import { execFileSync } from 'node:child_process';

import { and, eq, sql } from 'drizzle-orm';

import { db } from '../app/db';
import {
  treatment as treatmentTable,
  treatmentSession as treatmentSessionTable,
} from '../app/db/schema/treatment';
import { createTreatmentSchema } from '../app/api/lib/modules/treatment/schemas/treatment-schema';

const TENANT_ID = 'N5eSMvVQtLopN4ooFYN3W9GagQ4XJx8S';
const XLSX = '/Users/arunselvakumar/Downloads/DhathriDetails.xlsx';
const BATCH_SIZE = 50;

type Row = {
  treatment: string;
  total: number;
  sessionNumber: number | null;
  note: string;
};

function loadRows(): Row[] {
  const python = `
import zipfile, xml.etree.ElementTree as ET, re, json
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
with zipfile.ZipFile(p) as z:
    ss = []
    root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    for si in root.findall('m:si', NS):
        texts = [t.text or '' for t in si.findall('.//m:t', NS)]
        ss.append(''.join(texts))
    sheet = ET.fromstring(z.read('xl/worksheets/sheet3.xml'))
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
        name = (vals.get(1) or '').strip()
        if not name:
            continue
        total = int(float(vals.get(2) or 1))
        snum = vals.get(7)
        note = (vals.get(8) or '').strip()
        out.append({
            'treatment': name,
            'total': total if total > 0 else 1,
            'sessionNumber': int(float(snum)) if snum not in (None, '') else None,
            'note': note,
        })
    print(json.dumps(out))
`;
  const raw = execFileSync('python3', ['-c', python], { maxBuffer: 32 * 1024 * 1024 });
  return JSON.parse(raw.toString()) as Row[];
}

function sanitizeName(value: string) {
  return value
    .replace(/[^\p{L}\p{N} +,&'()/_.:;{}[\]-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function uniqueValue(value: string, used: Set<string>, maxLength: number, separator = ' ') {
  let candidate = value.slice(0, maxLength);
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = `${separator}${n++}`;
    candidate = `${value.slice(0, Math.max(1, maxLength - suffix.length))}${suffix}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function sanitizeCode(value: string, used: Set<string>) {
  let code = value
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 20);
  if (!code) code = 'TRT';
  if (!/[A-Z0-9]/.test(code)) code = `TRT${code}`.slice(0, 20);
  return uniqueValue(code, used, 20, '').toUpperCase();
}

function splitTreatment(raw: string) {
  const idx = raw.indexOf('_');
  if (idx <= 0) {
    return { codeSource: raw.replace(/\s+/g, '').slice(0, 20), nameSource: raw };
  }
  return { codeSource: raw.slice(0, idx), nameSource: raw.slice(idx + 1) || raw };
}

const rows = loadRows();
const byKey = new Map<string, { raw: string; maxSessions: number; notes: Map<number, string> }>();

for (const row of rows) {
  const key = row.treatment.toLowerCase();
  const existing = byKey.get(key) ?? { raw: row.treatment, maxSessions: 1, notes: new Map() };
  existing.maxSessions = Math.max(existing.maxSessions, row.total, row.sessionNumber ?? 1);
  if (row.sessionNumber && row.note && !existing.notes.has(row.sessionNumber)) {
    existing.notes.set(row.sessionNumber, row.note);
  }
  byKey.set(key, existing);
}

const existing = await db
  .select({
    id: treatmentTable.id,
    name: treatmentTable.name,
    code: treatmentTable.code,
  })
  .from(treatmentTable)
  .where(and(eq(treatmentTable.tenantId, TENANT_ID), eq(treatmentTable.isDeleted, false)));

const usedCodes = new Set(existing.map((row) => row.code.toLowerCase()));
const usedNames = new Set(existing.map((row) => row.name.toLowerCase()));
usedCodes.add('trt-0400');
usedCodes.add('trt-0401');

type Prepared = {
  name: string;
  code: string;
  durationMinutes: number;
  setupMinutes: number;
  cleaningMinutes: number;
  roomType: string;
  therapistSkill: string;
  sessions: Array<{
    sessionNumber: number;
    label: string;
    procedure: string;
    durationMinutes: number;
    setupMinutes: number;
    cleaningMinutes: number;
    roomType: string;
    therapistSkill: string;
  }>;
};

const prepared: Prepared[] = [];
let failed = 0;

for (const item of byKey.values()) {
  const split = splitTreatment(item.raw);
  const desiredName = sanitizeName(split.nameSource) || 'Treatment';
  const desiredCode = split.codeSource
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 20);
  if (
    usedNames.has(desiredName.toLowerCase()) ||
    (desiredCode && usedCodes.has(desiredCode.toLowerCase()))
  ) {
    continue;
  }
  const name = uniqueValue(desiredName, usedNames, 200);
  const code = sanitizeCode(split.codeSource, usedCodes);
  const sessionCount = Math.min(Math.max(item.maxSessions, 1), 12);
  const fallbackProcedure = name.slice(0, 200) || 'Treatment session';
  const sessions = Array.from({ length: sessionCount }, (_, index) => {
    const sessionNumber = index + 1;
    const note = item.notes.get(sessionNumber) ?? fallbackProcedure;
    return {
      sessionNumber,
      label: `Session ${sessionNumber} of ${sessionCount} · ${name}`.slice(0, 200),
      procedure: note.slice(0, 200),
      durationMinutes: 60,
      setupMinutes: 10,
      cleaningMinutes: 5,
      roomType: 'Panchakarma room',
      therapistSkill: 'Abhyanga',
    };
  });

  const parsed = createTreatmentSchema.safeParse({
    name,
    code,
    durationMinutes: 60,
    setupMinutes: 10,
    cleaningMinutes: 5,
    roomType: 'Panchakarma room',
    therapistSkill: 'Abhyanga',
    sessions,
  });

  if (!parsed.success) {
    failed += 1;
    console.error(
      'SKIP invalid',
      code,
      name,
      parsed.error.issues.map((issue) => issue.message).join('; ')
    );
    continue;
  }

  prepared.push({
    ...parsed.data,
    roomType: parsed.data.roomType ?? 'Panchakarma room',
    therapistSkill: parsed.data.therapistSkill ?? 'Abhyanga',
    sessions: parsed.data.sessions.map((session) => ({
      sessionNumber: session.sessionNumber,
      label: session.label,
      procedure: session.procedure,
      durationMinutes: session.durationMinutes,
      setupMinutes: session.setupMinutes,
      cleaningMinutes: session.cleaningMinutes,
      roomType: session.roomType ?? 'Panchakarma room',
      therapistSkill: session.therapistSkill ?? 'Abhyanga',
    })),
  });
}

let created = 0;

for (let offset = 0; offset < prepared.length; offset += BATCH_SIZE) {
  const batch = prepared.slice(offset, offset + BATCH_SIZE);
  const inserted = await db
    .insert(treatmentTable)
    .values(
      batch.map((item) => ({
        tenantId: TENANT_ID,
        name: item.name,
        code: item.code,
        durationMinutes: item.durationMinutes,
        setupMinutes: item.setupMinutes,
        cleaningMinutes: item.cleaningMinutes,
        roomType: item.roomType,
        therapistSkill: item.therapistSkill,
      }))
    )
    .returning({ id: treatmentTable.id, code: treatmentTable.code });

  const idByCode = new Map(inserted.map((row) => [row.code.toUpperCase(), row.id]));
  const sessionRows = batch.flatMap((item) => {
    const treatmentId = idByCode.get(item.code.toUpperCase());
    if (!treatmentId) {
      throw new Error(`Missing inserted Treatment for ${item.code}`);
    }
    return item.sessions.map((session) => ({
      tenantId: TENANT_ID,
      treatmentId,
      sessionNumber: session.sessionNumber,
      label: session.label,
      procedure: session.procedure,
      durationMinutes: session.durationMinutes,
      setupMinutes: session.setupMinutes,
      cleaningMinutes: session.cleaningMinutes,
      roomType: session.roomType,
      therapistSkill: session.therapistSkill,
    }));
  });

  if (sessionRows.length > 0) {
    await db.insert(treatmentSessionTable).values(sessionRows);
  }

  created += batch.length;
  console.log(`created ${created}/${prepared.length}`);
}

const [{ total }] = await db
  .select({ total: sql<number>`count(*)::int` })
  .from(treatmentTable)
  .where(and(eq(treatmentTable.tenantId, TENANT_ID), eq(treatmentTable.isDeleted, false)));

console.log(
  JSON.stringify({
    unique: byKey.size,
    prepared: prepared.length,
    created,
    failed,
    alreadyPresent: existing.length,
    totalInDb: total,
  })
);

process.exit(0);
