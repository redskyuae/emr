import { describe, expect, it } from 'vitest';

import { HELP_TEXT, parseDhathriTreatmentImportArgs } from './import-dhathri-treatments';

describe('parseDhathriTreatmentImportArgs', () => {
  it('requires an explicit Tenant and workbook and defaults to dry run', () => {
    expect(() => parseDhathriTreatmentImportArgs([])).toThrow('--tenant is required');
    expect(() => parseDhathriTreatmentImportArgs(['--tenant', 'tenant-1'])).toThrow(
      '--workbook is required'
    );
    expect(
      parseDhathriTreatmentImportArgs(['--tenant', 'tenant-1', '--workbook', '/tmp/source.xlsx'])
    ).toMatchObject({ commit: false });
  });

  it('requires one mutually exclusive execution mode', () => {
    expect(() =>
      parseDhathriTreatmentImportArgs([
        '--tenant',
        'tenant-1',
        '--workbook',
        '/tmp/source.xlsx',
        '--commit',
        '--dry-run',
      ])
    ).toThrow('--commit and --dry-run cannot be used together');
  });

  it('rejects reports inside the repository and unknown arguments', () => {
    expect(() =>
      parseDhathriTreatmentImportArgs(
        [
          '--tenant',
          'tenant-1',
          '--workbook',
          '/tmp/source.xlsx',
          '--report',
          '/repo/private-report.json',
        ],
        '/repo'
      )
    ).toThrow('--report must point outside the repository');
    expect(() =>
      parseDhathriTreatmentImportArgs([
        '--tenant',
        'tenant-1',
        '--workbook',
        '/tmp/source.xlsx',
        '--surprise',
      ])
    ).toThrow('Unknown argument');
  });

  it('documents exact dry-run and commit invocations', () => {
    expect(HELP_TEXT).toContain('--dry-run');
    expect(HELP_TEXT).toContain('--commit');
    expect(HELP_TEXT).toContain('performs zero writes');
  });
});
