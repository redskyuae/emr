import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

export const DHATHRI_TREATMENT_HEADERS = [
  'Treatment',
  'TotalSession',
  'MRN',
  'VisitID',
  'VisitNumber',
  'TreatmentStatus',
  'SessionNumber',
  'ConductionNote',
  'SessionStatus',
] as const;

const MAX_READER_OUTPUT_BYTES = 64 * 1024 * 1024;
const nullableCellSchema = z.string().nullable();
const valuesSchema = z.tuple([
  nullableCellSchema,
  nullableCellSchema,
  nullableCellSchema,
  nullableCellSchema,
  nullableCellSchema,
  nullableCellSchema,
  nullableCellSchema,
  nullableCellSchema,
  nullableCellSchema,
]);
const structuralErrorSchema = z
  .object({
    code: z.enum(['INVALID_HEADER', 'DUPLICATE_REQUIRED_HEADER', 'MISSING_REQUIRED_HEADER']),
    header: z.string(),
    message: z.string(),
  })
  .strict();
const metadataLineSchema = z
  .object({
    type: z.literal('metadata'),
    sheetName: z.literal('TreatmentDetails'),
    headers: z.array(nullableCellSchema),
    structuralErrors: z.array(structuralErrorSchema),
  })
  .strict();
const rowLineSchema = z
  .object({
    type: z.literal('row'),
    sourceRowNumber: z.number().int().positive(),
    values: valuesSchema,
  })
  .strict();
const readerLineSchema = z.discriminatedUnion('type', [metadataLineSchema, rowLineSchema]);

export type DhathriTreatmentValues = {
  treatment: string | null;
  totalSession: string | null;
  mrn: string | null;
  visitId: string | null;
  visitNumber: string | null;
  treatmentStatus: string | null;
  sessionNumber: string | null;
  conductionNote: string | null;
  sessionStatus: string | null;
};

export type DhathriWorkbookRow = {
  sourceRowNumber: number;
  raw: DhathriTreatmentValues;
  normalized: DhathriTreatmentValues;
};

export type DhathriWorkbookReadResult = {
  workbookHash: string;
  filename: string;
  headers: Array<string | null>;
  rows: DhathriWorkbookRow[];
  structuralErrors: Array<z.infer<typeof structuralErrorSchema>>;
};

function valuesFromTuple(values: z.infer<typeof valuesSchema>): DhathriTreatmentValues {
  return {
    treatment: values[0],
    totalSession: values[1],
    mrn: values[2],
    visitId: values[3],
    visitNumber: values[4],
    treatmentStatus: values[5],
    sessionNumber: values[6],
    conductionNote: values[7],
    sessionStatus: values[8],
  };
}

function normalizeValue(value: string | null, isConductionNote = false): string | null {
  if (value === null) return null;
  const normalized = value.trim();
  if (normalized === '') return null;
  if (isConductionNote && normalized === 'NULL') return null;
  return normalized;
}

export function normalizeDhathriValues(raw: DhathriTreatmentValues): DhathriTreatmentValues {
  return {
    treatment: normalizeValue(raw.treatment),
    totalSession: normalizeValue(raw.totalSession),
    mrn: normalizeValue(raw.mrn),
    visitId: normalizeValue(raw.visitId),
    visitNumber: normalizeValue(raw.visitNumber),
    treatmentStatus: normalizeValue(raw.treatmentStatus),
    sessionNumber: normalizeValue(raw.sessionNumber),
    conductionNote: normalizeValue(raw.conductionNote, true),
    sessionStatus: normalizeValue(raw.sessionStatus),
  };
}

async function hashWorkbook(workbookPath: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(workbookPath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function runReader(workbookPath: string): Promise<string> {
  const readerPath = fileURLToPath(new URL('./read-dhathri-workbook.py', import.meta.url));
  return await new Promise((resolve, reject) => {
    const process = spawn('python3', [readerPath, workbookPath], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let outputBytes = 0;
    let outputLimitExceeded = false;

    process.stdout.on('data', (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes > MAX_READER_OUTPUT_BYTES) {
        outputLimitExceeded = true;
        process.kill();
        return;
      }
      stdout.push(chunk);
    });
    process.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    process.on('error', reject);
    process.on('close', (code) => {
      if (outputLimitExceeded) {
        reject(new Error('Workbook reader output exceeds the size limit'));
        return;
      }
      if (code !== 0) {
        const diagnostic = Buffer.concat(stderr).toString('utf8').trim();
        reject(new Error(diagnostic || `Workbook reader exited with code ${code}`));
        return;
      }
      resolve(Buffer.concat(stdout).toString('utf8'));
    });
  });
}

export async function readDhathriWorkbook(
  workbookPath: string
): Promise<DhathriWorkbookReadResult> {
  if (workbookPath.trim() === '') {
    throw new Error('Workbook path is required');
  }

  const [workbookHash, output] = await Promise.all([
    hashWorkbook(workbookPath),
    runReader(workbookPath),
  ]);
  const parsedLines = output
    .split(/\r?\n/u)
    .filter((line) => line !== '')
    .map((line, index) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch (error) {
        throw new Error(`Workbook reader returned invalid JSON on line ${index + 1}`, {
          cause: error,
        });
      }
      const result = readerLineSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`Workbook reader returned invalid data on line ${index + 1}`);
      }
      return result.data;
    });

  const metadataLines = parsedLines.filter((line) => line.type === 'metadata');
  if (metadataLines.length !== 1 || parsedLines[0]?.type !== 'metadata') {
    throw new Error('Workbook reader returned invalid metadata');
  }
  const metadata = metadataLines[0];
  const rows = parsedLines
    .filter((line) => line.type === 'row')
    .map((line) => {
      const raw = valuesFromTuple(line.values);
      return {
        sourceRowNumber: line.sourceRowNumber,
        raw,
        normalized: normalizeDhathriValues(raw),
      };
    });

  return {
    workbookHash,
    filename: basename(workbookPath),
    headers: metadata.headers,
    rows,
    structuralErrors: metadata.structuralErrors,
  };
}
