import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { readDhathriWorkbook } from './dhathri-workbook-reader';

const FIXTURE_PATH = fileURLToPath(
  new URL('../fixtures/dhathri-treatment-details.synthetic.json', import.meta.url)
);

const temporaryDirectories: string[] = [];

const syntheticWorkbookBuilder = String.raw`
import json
import sys
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

fixture_path, output_path, variant = sys.argv[1:]
fixture = json.loads(Path(fixture_path).read_text())
headers = list(fixture['headers'])
rows = list(fixture['rows'])

if variant == 'missing-header':
    headers = headers[:-1]
if variant == 'formula':
    rows[0]['cells'][-1] = {'column': 'I', 'mode': 'formula', 'value': 'Completed'}

shared = []
for cell in headers + [cell for row in rows for cell in row['cells']]:
    if cell['mode'] == 'shared':
        shared.append(cell['value'])

def cell_xml(cell, row_number):
    reference = f"{cell['column']}{row_number}"
    mode = cell['mode']
    value = cell.get('value')
    if mode == 'blank':
        return f'<c r="{reference}"/>'
    if mode == 'shared':
        index = shared.index(value)
        return f'<c r="{reference}" t="s"><v>{index}</v></c>'
    if mode == 'inline':
        return f'<c r="{reference}" t="inlineStr"><is><t xml:space="preserve">{escape(value)}</t></is></c>'
    if mode == 'formula':
        return f'<c r="{reference}"><f>1+1</f><v>2</v></c>'
    return f'<c r="{reference}"><v>{escape(value)}</v></c>'

header_xml = ''.join(cell_xml(cell, 1) for cell in headers)
row_xml = ''.join(
    f'<row r="{row["rowNumber"]}">' +
    ''.join(cell_xml(cell, row['rowNumber']) for cell in row['cells']) +
    '</row>'
    for row in rows
)
worksheet = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    f'<sheetData><row r="1">{header_xml}</row>{row_xml}</sheetData></worksheet>'
)
decoy = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    '<sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Decoy</t></is></c></row></sheetData>'
    '</worksheet>'
)
shared_xml = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
    f'count="{len(shared)}" uniqueCount="{len(shared)}">' +
    ''.join(f'<si><t xml:space="preserve">{escape(value)}</t></si>' for value in shared) +
    '</sst>'
)
workbook = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    '<sheets><sheet name="Decoy" sheetId="1" r:id="rId1"/>'
    '<sheet name="TreatmentDetails" sheetId="2" r:id="rId2"/></sheets></workbook>'
)
external = ''
if variant == 'external-link':
    external = '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLink" Target="https://example.invalid/data.xlsx" TargetMode="External"/>'
relationships = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
    f'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="{fixture["sheetRelationshipTarget"]}"/>'
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>'
    f'{external}</Relationships>'
)
content_types = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    '</Types>'
)

with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.writestr('[Content_Types].xml', content_types)
    archive.writestr('xl/workbook.xml', workbook)
    archive.writestr('xl/_rels/workbook.xml.rels', relationships)
    archive.writestr('xl/sharedStrings.xml', shared_xml)
    archive.writestr('xl/worksheets/sheet1.xml', decoy)
    archive.writestr('xl/' + fixture['sheetRelationshipTarget'], worksheet)
    if variant == 'macro':
        archive.writestr('xl/vbaProject.bin', b'not-a-real-macro')
    if variant == 'too-many-entries':
        for index in range(1001):
            archive.writestr(f'padding/{index}.txt', '')

if variant == 'encrypted':
    content = bytearray(Path(output_path).read_bytes())
    for signature, flag_offset in ((b'PK\x03\x04', 6), (b'PK\x01\x02', 8)):
        position = 0
        while True:
            position = content.find(signature, position)
            if position == -1:
                break
            flag_position = position + flag_offset
            flags = int.from_bytes(content[flag_position:flag_position + 2], 'little') | 1
            content[flag_position:flag_position + 2] = flags.to_bytes(2, 'little')
            position += 4
    Path(output_path).write_bytes(content)
`;

function buildWorkbook(variant = 'valid') {
  const directory = mkdtempSync(join(tmpdir(), 'dhathri-reader-'));
  temporaryDirectories.push(directory);
  const workbookPath = join(directory, `${variant}.xlsx`);
  execFileSync('python3', ['-c', syntheticWorkbookBuilder, FIXTURE_PATH, workbookPath, variant]);
  return workbookPath;
}

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('readDhathriWorkbook', () => {
  it('resolves TreatmentDetails through relationships and preserves raw cell storage values', async () => {
    const workbookPath = buildWorkbook();

    const result = await readDhathriWorkbook(workbookPath);

    expect(result.filename).toBe(basename(workbookPath));
    expect(result.headers).toEqual([
      'Treatment',
      'TotalSession',
      'MRN',
      'VisitID',
      'VisitNumber',
      'TreatmentStatus',
      'SessionNumber',
      'ConductionNote',
      'SessionStatus',
    ]);
    expect(result.structuralErrors).toEqual([]);
    expect(result.rows[0]).toEqual({
      sourceRowNumber: 2,
      raw: {
        treatment: '  SYN-TRT_Oil Therapy  ',
        totalSession: '6',
        mrn: '  SYN-MRN-001  ',
        visitId: 'SYN-VISIT-001',
        visitNumber: '1001',
        treatmentStatus: ' Progress ',
        sessionNumber: '1',
        conductionNote: null,
        sessionStatus: 'Completed',
      },
      normalized: {
        treatment: 'SYN-TRT_Oil Therapy',
        totalSession: '6',
        mrn: 'SYN-MRN-001',
        visitId: 'SYN-VISIT-001',
        visitNumber: '1001',
        treatmentStatus: 'Progress',
        sessionNumber: '1',
        conductionNote: null,
        sessionStatus: 'Completed',
      },
    });
    expect(result.rows.map((row) => row.sourceRowNumber)).toEqual([2, 4]);
  });

  it('normalizes literal NULL only for ConductionNote', async () => {
    const result = await readDhathriWorkbook(buildWorkbook());

    expect(result.rows[1].raw.treatment).toBe('NULL');
    expect(result.rows[1].normalized.treatment).toBe('NULL');
    expect(result.rows[1].raw.conductionNote).toBe('  NULL  ');
    expect(result.rows[1].normalized.conductionNote).toBeNull();
  });

  it('computes the workbook SHA-256 from the supplied file bytes', async () => {
    const workbookPath = buildWorkbook();
    const expectedHash = createHash('sha256').update(readFileSync(workbookPath)).digest('hex');

    const result = await readDhathriWorkbook(workbookPath);

    expect(result.workbookHash).toBe(expectedHash);
  });

  it('reports missing headers without dropping readable rows', async () => {
    const result = await readDhathriWorkbook(buildWorkbook('missing-header'));

    expect(result.structuralErrors).toContainEqual({
      code: 'MISSING_REQUIRED_HEADER',
      header: 'SessionStatus',
      message: 'Required header SessionStatus is missing',
    });
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].raw.sessionStatus).toBeNull();
  });

  it.each([
    ['formula', 'Formula cells are not allowed'],
    ['external-link', 'External relationships are not allowed'],
    ['macro', 'Macro-enabled workbooks are not allowed'],
    ['encrypted', 'Encrypted workbooks are not allowed'],
    ['too-many-entries', 'Archive contains too many entries'],
  ])('rejects unsafe %s workbooks', async (variant, message) => {
    await expect(readDhathriWorkbook(buildWorkbook(variant))).rejects.toThrow(message);
  });

  it('requires an explicit workbook path', async () => {
    await expect(readDhathriWorkbook('')).rejects.toThrow('Workbook path is required');
  });
});
